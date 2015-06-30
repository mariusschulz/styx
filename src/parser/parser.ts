/// <reference path="../estree.ts" />
/// <reference path="../flow.ts" />
/// <reference path="../util/idGenerator.ts" />
/// <reference path="../collections/stack.ts" />
/// <reference path="enclosingStatement.ts" />
/// <reference path="expressions/negator.ts" />
/// <reference path="expressions/stringifier.ts" />
/// <reference path="passes/constantConditionalEdgeRewriting.ts" />
/// <reference path="passes/transitNodeRemoval.ts" />

namespace Styx.Parser {
    const stringify = Expressions.Stringifier.stringify;
    const negateTruthiness = Expressions.Negator.negateTruthiness;
    
    interface CaseBlock {
        caseClausesA: ESTree.SwitchCase[];
        defaultCase: ESTree.SwitchCase;
        caseClausesB: ESTree.SwitchCase[];
    }
    
    interface ParsingContext {
        functions: FlowFunction[];
        currentFunction: FlowFunction;
        enclosingStatements: Collections.Stack<EnclosingStatement>;
        
        createTemporaryLocalVariableName(): string;
        createNode(type?: NodeType): FlowNode;
        createFunctionId(): number;
    }
    
    interface StatementTypeToParserMap {
        [type: string]: (statement: ESTree.Statement, currentNode: FlowNode, context: ParsingContext) => FlowNode;
    }
    
    export function parse(program: ESTree.Program, options: ParserOptions): FlowProgram {
        let context = createParsingContext();        
        let parsedProgram = parseProgram(program, options, context);
        
        // Run optimization passes
        let functionFlowGraphs = context.functions.map(func => func.flowGraph);
        let flowGraphs = [parsedProgram.flowGraph, ...functionFlowGraphs];
        runOptimizationPasses(flowGraphs, options);
        
        return parsedProgram;
    }
    
    function createParsingContext(): ParsingContext {
        let nodeIdGenerator = Util.IdGenerator.create();
        let functionIdGenerator = Util.IdGenerator.create();
        let variableNameIdGenerator = Util.IdGenerator.create();
        
        return {
            functions: [],
            currentFunction: null,
            enclosingStatements: new Collections.Stack<EnclosingStatement>(),
            
            createTemporaryLocalVariableName: function() {
                return "$$temp" + variableNameIdGenerator.generateId();
            },
            
            createNode: function(type = NodeType.Normal) {
                let id = nodeIdGenerator.generateId();
                return new FlowNode(id, type);
            },
            
            createFunctionId: function() {
                return functionIdGenerator.generateId();
            }
        };
    }
    
    function parseProgram(program: ESTree.Program, options: ParserOptions, context: ParsingContext): FlowProgram {
        let entryNode = context.createNode(NodeType.Entry);
        let successExitNode = context.createNode(NodeType.Exit);
        
        let programFlowGraph = { entry: entryNode, successExit: successExitNode };
        
        let finalNode = parseStatements(program.body, entryNode, context);
        successExitNode.appendEpsilonEdgeTo(finalNode);
        
        return {
            flowGraph: programFlowGraph,
            functions: context.functions
        };
    }

    function parseStatements(statements: ESTree.Statement[], currentNode: FlowNode, context: ParsingContext): FlowNode {
        for (let statement of statements) {
            currentNode = parseStatement(statement, currentNode, context);
            
            if (isAbruptCompletion(statement)) {
                // If we encounter an abrupt completion, normal control flow is interrupted
                // and the following statements aren't executed
                return currentNode;
            }
        }
        
        return currentNode;
    }

    function parseStatement(statement: ESTree.Statement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        if (statement === null) {
            return currentNode;
        }
        
        let statementParsers: StatementTypeToParserMap = {
            [ESTree.NodeType.FunctionDeclaration]: parseFunctionDeclaration,
            [ESTree.NodeType.EmptyStatement]: parseEmptyStatement,
            [ESTree.NodeType.BlockStatement]: parseBlockStatement,
            [ESTree.NodeType.VariableDeclaration]: parseVariableDeclaration,
            [ESTree.NodeType.IfStatement]: parseIfStatement,
            [ESTree.NodeType.LabeledStatement]: parseLabeledStatement,
            [ESTree.NodeType.BreakStatement]: parseBreakStatement,
            [ESTree.NodeType.ContinueStatement]: parseContinueStatement,
            [ESTree.NodeType.WithStatement]: parseWithStatement,
            [ESTree.NodeType.SwitchStatement]: parseSwitchStatement,
            [ESTree.NodeType.ReturnStatement]: parseReturnStatement,
            [ESTree.NodeType.WhileStatement]: parseWhileStatement,
            [ESTree.NodeType.DoWhileStatement]: parseDoWhileStatement,
            [ESTree.NodeType.ForStatement]: parseForStatement,
            [ESTree.NodeType.ForInStatement]: parseForInStatement,
            [ESTree.NodeType.DebuggerStatement]: parseDebuggerStatement,
            [ESTree.NodeType.ExpressionStatement]: parseExpressionStatement
        };
        
        let parsingMethod = statementParsers[statement.type];
        
        if (!parsingMethod) {
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }
        
        return parsingMethod(statement, currentNode, context);
    }
    
    function parseFunctionDeclaration(functionDeclaration: ESTree.Function, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let entryNode = context.createNode(NodeType.Entry);
        let successExitNode = context.createNode(NodeType.Exit);
        
        let func: FlowFunction = {
            id: context.createFunctionId(),
            name: functionDeclaration.id.name,
            flowGraph: { entry: entryNode, successExit: successExitNode }
        };
        
        let previousFunction = context.currentFunction;
        context.currentFunction = func;
        
        let finalNode = parseBlockStatement(functionDeclaration.body, entryNode, context);
        
        if (finalNode) {
            // If we reached this point, the function didn't end with an explicit return statement.
            // Thus, an implicit "undefined" is returned.
            let undefinedReturnValue: ESTree.Identifier = {
                type: ESTree.NodeType.Identifier,
                name: "undefined"
            };
            
            func.flowGraph.successExit
                .appendTo(finalNode, "return undefined", EdgeType.AbruptCompletion, undefinedReturnValue);
        }
        
        context.functions.push(func);
        context.currentFunction = previousFunction;
        
        return currentNode;
    }
    
    function parseEmptyStatement(emptyStatement: ESTree.EmptyStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        return context.createNode().appendTo(currentNode, "(empty)");
    }
    
    function parseBlockStatement(blockStatement: ESTree.BlockStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        return parseStatements(blockStatement.body, currentNode, context);
    }

    function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode, context: ParsingContext): FlowNode {
        for (let declarator of declaration.declarations) {
            let initString = stringify(declarator.init);
            let edgeLabel = `${declarator.id.name} = ${initString}`;
            currentNode = context.createNode().appendTo(currentNode, edgeLabel);
        }

        return currentNode;
    }

    function parseLabeledStatement(labeledStatement: ESTree.LabeledStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let body = labeledStatement.body;
        let label = labeledStatement.label.name;
        
        switch (body.type) {
            case ESTree.NodeType.BlockStatement:
                let finalNode = context.createNode();
                
                let enclosingStatement: EnclosingStatement = {
                    breakTarget: finalNode,
                    continueTarget: null,
                    label: label
                };
                
                context.enclosingStatements.push(enclosingStatement);
                let endOfStatementBodyNode = parseBlockStatement(<ESTree.BlockStatement>body, currentNode, context);
                context.enclosingStatements.pop();
                                    
                return finalNode.appendEpsilonEdgeTo(endOfStatementBodyNode);
            
            case ESTree.NodeType.SwitchStatement:
                return parseSwitchStatement(<ESTree.SwitchStatement>body, currentNode, context, label);
                
            case ESTree.NodeType.WhileStatement:
                return parseWhileStatement(<ESTree.WhileStatement>body, currentNode, context, label);
            
            case ESTree.NodeType.DoWhileStatement:
                return parseDoWhileStatement(<ESTree.DoWhileStatement>body, currentNode, context, label);
            
            case ESTree.NodeType.ForStatement:
                return parseForStatement(<ESTree.ForStatement>body, currentNode, context, label);
            
            case ESTree.NodeType.ForInStatement:
                return parseForInStatement(<ESTree.ForInStatement>body, currentNode, context, label);
                
            default:
                // If we didn't encounter an enclosing statement,
                // the label is irrelevant for control flow and we thus don't track it.
                return parseStatement(body, currentNode, context);
        }
    }

    function parseIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        return ifStatement.alternate === null
            ? parseSimpleIfStatement(ifStatement, currentNode, context)
            : parseIfElseStatement(ifStatement, currentNode, context);
    }

    function parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let negatedTest = negateTruthiness(ifStatement.test);
        
        let thenLabel = stringify(ifStatement.test);
        let elseLabel = stringify(negatedTest);
        
        let thenNode = context.createNode()
            .appendConditionallyTo(currentNode, thenLabel, ifStatement.test);
        
        let endOfThenBranch = parseStatement(ifStatement.consequent, thenNode, context);
        
        let finalNode = context.createNode()
            .appendConditionallyTo(currentNode, elseLabel, negatedTest);
        
        if (endOfThenBranch) {
            finalNode.appendEpsilonEdgeTo(endOfThenBranch);
        }
        
        return finalNode;
    }

    function parseIfElseStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        // Then branch
        let thenLabel = stringify(ifStatement.test);
        let thenNode = context.createNode().appendConditionallyTo(currentNode, thenLabel, ifStatement.test);
        let endOfThenBranch = parseStatement(ifStatement.consequent, thenNode, context);
        
        // Else branch
        let negatedTest = negateTruthiness(ifStatement.test);
        let elseLabel = stringify(negatedTest); 
        let elseNode = context.createNode().appendConditionallyTo(currentNode, elseLabel, negatedTest);
        let endOfElseBranch = parseStatement(ifStatement.alternate, elseNode, context);
        
        let finalNode = context.createNode();
        
        if (endOfThenBranch) {
            finalNode.appendEpsilonEdgeTo(endOfThenBranch);
        }
        
        if (endOfElseBranch) {
            finalNode.appendEpsilonEdgeTo(endOfElseBranch);
        }
        
        return finalNode;
    }
    
    function parseBreakStatement(breakStatement: ESTree.BreakStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let label = breakStatement.label ? breakStatement.label.name : void 0;
        let enclosingStatement = label
            ? context.enclosingStatements.find(statement => statement.label === label)
            : context.enclosingStatements.peek();
        
        enclosingStatement.breakTarget.appendTo(currentNode, "break", EdgeType.AbruptCompletion);
        
        return null;
    }
    
    function parseContinueStatement(continueStatement: ESTree.ContinueStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let label = continueStatement.label ? continueStatement.label.name : void 0;
        let enclosingStatement = label
            ? context.enclosingStatements.find(statement => statement.label === label)
            : context.enclosingStatements.peek();
        
        if (enclosingStatement.continueTarget === null) {
            throw new Error(`Illegal continue target detected: "${label}" does not label an enclosing iteration statement`);
        }
        
        enclosingStatement.continueTarget.appendTo(currentNode, "continue", EdgeType.AbruptCompletion);
        
        return null;
    }
    
    function parseWithStatement(withStatement: ESTree.WithStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let stringifiedExpression = stringify(withStatement.object);
        let expressionNode = context.createNode().appendTo(currentNode, stringifiedExpression); 
        
        return parseStatement(withStatement.body, expressionNode, context);
    }
    
    function parseSwitchStatement(switchStatement: ESTree.SwitchStatement, currentNode: FlowNode, context: ParsingContext, label?: string): FlowNode {
        const switchExpression = context.createTemporaryLocalVariableName();
        
        let stringifiedDiscriminant = stringify(switchStatement.discriminant);
        let exprRef = `${switchExpression} = ${stringifiedDiscriminant}`;
        let evaluatedDiscriminantNode = context.createNode().appendTo(currentNode, exprRef);
        
        let finalNode = context.createNode(); 
        
        context.enclosingStatements.push({
            breakTarget: finalNode,
            continueTarget: null,
            label: label
        });
        
        let { caseClausesA, defaultCase, caseClausesB } = partitionCases(switchStatement.cases);
        let caseClauses = [...caseClausesA, ...caseClausesB];
        
        let stillSearchingNode = evaluatedDiscriminantNode;
        let endOfPreviousCaseBody: FlowNode = null;
        let firstNodeOfClauseListB: FlowNode = null;
        
        for (let caseClause of caseClauses) {
            let truthyCondition = {
                type: ESTree.NodeType.BinaryExpression,
                left: { type: ESTree.NodeType.Identifier, name: switchExpression },
                right: caseClause.test,
                operator: "==="
            };
            
            let beginOfCaseBody = context.createNode()
                .appendConditionallyTo(stillSearchingNode, stringify(truthyCondition), truthyCondition);
            
            if (caseClause === caseClausesB[0]) {
                firstNodeOfClauseListB = beginOfCaseBody;
            }
            
            if (endOfPreviousCaseBody) {
                // We reached the end of the case through normal control flow,
                // which means there was no 'break' statement at the end.
                // We therefore fall through from the previous case!
                beginOfCaseBody.appendEpsilonEdgeTo(endOfPreviousCaseBody);
            }
            
            endOfPreviousCaseBody = parseStatements(caseClause.consequent, beginOfCaseBody, context);
            
            let falsyCondition = negateTruthiness(truthyCondition);  
            stillSearchingNode = context.createNode()
                .appendConditionallyTo(stillSearchingNode, stringify(falsyCondition), falsyCondition);
        }
        
        if (endOfPreviousCaseBody) {
            // If the last case didn't end with an abrupt completion,
            // connect it to the final node and resume normal control flow.
            finalNode.appendEpsilonEdgeTo(endOfPreviousCaseBody);
        }
        
        if (defaultCase) {
            let endOfDefaultCaseBody = parseStatements(defaultCase.consequent, stillSearchingNode, context);
            
            if (endOfDefaultCaseBody) {
                let nodeAfterDefaultCase = firstNodeOfClauseListB || finalNode;
                nodeAfterDefaultCase.appendEpsilonEdgeTo(endOfDefaultCaseBody);
            }
        } else {
            // If there's no default case, the switch statements isn't necessarily exhaustive.
            // Therefore, if no match is found, no clause's statement list is executed
            // and control flow resumes normally after the switch statement.
            finalNode.appendEpsilonEdgeTo(stillSearchingNode);
        }
        
        context.enclosingStatements.pop();
        
        return finalNode;
    }
    
    function partitionCases(cases: ESTree.SwitchCase[]): CaseBlock {
        let caseClausesA: ESTree.SwitchCase[] = [];
        let defaultCase: ESTree.SwitchCase = null;
        let caseClausesB: ESTree.SwitchCase[] = [];
        
        let isInCaseClausesA = true;
        
        for (let switchCase of cases) {
            if (switchCase.test === null) {
                // We found the default case
                defaultCase = switchCase;
                isInCaseClausesA = false;
            } else {
                (isInCaseClausesA ? caseClausesA : caseClausesB).push(switchCase);
            }
        }
        
        return { caseClausesA, defaultCase, caseClausesB };
    }
    
    function parseReturnStatement(returnStatement: ESTree.ReturnStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        let returnLabel = "return " + stringify(returnStatement.argument);
        
        context.currentFunction.flowGraph.successExit
            .appendTo(currentNode, returnLabel, EdgeType.AbruptCompletion, returnStatement.argument);
        
        return null;
    }
    
    function parseWhileStatement(whileStatement: ESTree.WhileStatement, currentNode: FlowNode, context: ParsingContext, label?: string): FlowNode {
        // Truthy test (enter loop)
        let truthyCondition = whileStatement.test;
        let truthyConditionLabel = stringify(truthyCondition);
        
        // Falsy test (exit loop)
        let falsyCondition = negateTruthiness(truthyCondition);
        let falsyConditionLabel = stringify(falsyCondition);
        
        let loopBodyNode = context.createNode().appendConditionallyTo(currentNode, truthyConditionLabel, truthyCondition);
        let finalNode = context.createNode();
        
        context.enclosingStatements.push({
            continueTarget: currentNode,
            breakTarget: finalNode,
            label: label
        });
        
        let endOfLoopBodyNode = parseStatement(whileStatement.body, loopBodyNode, context);
        
        if (endOfLoopBodyNode) {
            currentNode.appendEpsilonEdgeTo(endOfLoopBodyNode);
        }
        
        context.enclosingStatements.pop();
        
        return finalNode
            .appendConditionallyTo(currentNode, falsyConditionLabel, falsyCondition);
    }
    
    function parseDoWhileStatement(doWhileStatement: ESTree.DoWhileStatement, currentNode: FlowNode, context: ParsingContext, label?: string): FlowNode {
        // Truthy test (enter loop)
        let truthyCondition = doWhileStatement.test;
        let truthyConditionLabel = stringify(truthyCondition);
        
        // Falsy test (exit loop)
        let falsyCondition = negateTruthiness(truthyCondition);            
        let falsyConditionLabel = stringify(falsyCondition);
        
        let testNode = context.createNode();
        let finalNode = context.createNode();
        
        context.enclosingStatements.push({
            continueTarget: testNode,
            breakTarget: finalNode,
            label: label
        });
        
        let endOfLoopBodyNode = parseStatement(doWhileStatement.body, currentNode, context);
        
        context.enclosingStatements.pop();
        
        currentNode.appendConditionallyTo(testNode, truthyConditionLabel, truthyCondition);
        finalNode.appendConditionallyTo(testNode, falsyConditionLabel, falsyCondition);
        
        if (endOfLoopBodyNode) {
            testNode.appendEpsilonEdgeTo(endOfLoopBodyNode);
        }
        
        return finalNode;
    }
    
    function parseForStatement(forStatement: ESTree.ForStatement, currentNode: FlowNode, context: ParsingContext, label?: string): FlowNode {
        // Parse initialization
        let testDecisionNode = parseStatement(forStatement.init, currentNode, context);
        
        // Create nodes for loop cornerstones
        let beginOfLoopBodyNode = context.createNode();
        let updateNode = context.createNode();
        let finalNode = context.createNode();
        
        if (forStatement.test) {
            // If the loop has a test expression,
            // we need to add truthy and falsy edges
            let truthyCondition = forStatement.test;
            let falsyCondition = negateTruthiness(truthyCondition);
            
            // Create edges labels
            let truthyConditionLabel = stringify(truthyCondition);                
            let falsyConditionLabel = stringify(falsyCondition);
            
            // Add truthy and falsy edges
            beginOfLoopBodyNode.appendConditionallyTo(testDecisionNode, truthyConditionLabel, truthyCondition)
            finalNode.appendConditionallyTo(testDecisionNode, falsyConditionLabel, falsyCondition);
        } else {
            // If the loop doesn't have a test expression,
            // the loop body starts unconditionally after the initialization
            beginOfLoopBodyNode.appendEpsilonEdgeTo(testDecisionNode);
        }
        
        context.enclosingStatements.push({
            continueTarget: updateNode,
            breakTarget: finalNode,
            label: label
        });
        
        let endOfLoopBodyNode = parseStatement(forStatement.body, beginOfLoopBodyNode, context);
        
        context.enclosingStatements.pop();
        
        if (forStatement.update) {
            // If the loop has an update expression,
            // parse it and append it to the end of the loop body
            let endOfUpdateNode = parseExpression(forStatement.update, updateNode, context);
            testDecisionNode.appendEpsilonEdgeTo(endOfUpdateNode);                                   
        } else {
            // If the loop doesn't have an update expression,
            // treat the update node as a dummy and point it to the test node
            testDecisionNode.appendEpsilonEdgeTo(updateNode);
        }
        
        if (endOfLoopBodyNode) {
            // If we reached the end of the loop body through normal control flow,
            // continue regularly with the update
            updateNode.appendEpsilonEdgeTo(endOfLoopBodyNode);
        }
        
        return finalNode;
    }
    
    function parseForInStatement(forInStatement: ESTree.ForInStatement, currentNode: FlowNode, context: ParsingContext, label?: string): FlowNode {
        let stringifiedRight = stringify(forInStatement.right);
        
        let variableDeclarator = forInStatement.left.declarations[0];
        let variableName = variableDeclarator.id.name;
        
        let conditionNode = context.createNode()
            .appendTo(currentNode, stringifiedRight);
        
        let startOfLoopBody = context.createNode()
            .appendConditionallyTo(conditionNode, `${variableName} = <next>`, forInStatement.right);
            
        let finalNode = context.createNode()
            .appendConditionallyTo(conditionNode, "<no more>", null);
        
        context.enclosingStatements.push({
            breakTarget: finalNode,
            continueTarget: conditionNode,
            label: label
        });
        
        let endOfLoopBody = parseStatement(forInStatement.body, startOfLoopBody, context);
        
        context.enclosingStatements.pop();
        
        if (endOfLoopBody) {
            conditionNode.appendEpsilonEdgeTo(endOfLoopBody);
        }
        
        return finalNode;
    }
    
    function parseDebuggerStatement(debuggerStatement: ESTree.DebuggerStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        return currentNode;
    }
    
    function parseExpressionStatement(expressionStatement: ESTree.ExpressionStatement, currentNode: FlowNode, context: ParsingContext): FlowNode {
        return parseExpression(expressionStatement.expression, currentNode, context);
    }
    
    function parseExpression(expression: ESTree.Expression, currentNode: FlowNode, context: ParsingContext): FlowNode {
        if (expression.type === ESTree.NodeType.SequenceExpression) {
            return parseSequenceExpression(<ESTree.SequenceExpression>expression, currentNode, context);
        }
        
        let expressionLabel = stringify(expression);
        
        return context.createNode()
            .appendTo(currentNode, expressionLabel);
    }
    
    function parseSequenceExpression(sequenceExpression: ESTree.SequenceExpression, currentNode: FlowNode, context: ParsingContext): FlowNode {
        for (let expression of sequenceExpression.expressions) {
            currentNode = parseExpression(expression, currentNode, context);
        }
        
        return currentNode;
    }
    
    function isAbruptCompletion(statement: ESTree.Statement): boolean {
        switch (statement.type) {
            case ESTree.NodeType.BreakStatement:
            case ESTree.NodeType.ContinueStatement:
            case ESTree.NodeType.ReturnStatement:
                return true;
                
            default:
                return false;
        }
    }
    
    function runOptimizationPasses(graphs: ControlFlowGraph[], options: ParserOptions) {
        for (let graph of graphs) {
            if (options.passes.rewriteConstantConditionalEdges) {
                Passes.rewriteConstantConditionalEdges(graph.entry);
            }
            
            if (options.passes.removeTransitNodes) {
                Passes.removeTransitNodes(graph.entry);
            }
        }
    }
}
