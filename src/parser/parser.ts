/// <reference path="../estree.ts"/>
/// <reference path="../flow.ts"/>
/// <reference path="../util/idGenerator.ts"/>
/// <reference path="../collections/stack.ts"/>
/// <reference path="enclosingStatement.ts"/>
/// <reference path="expressions/negator.ts"/>
/// <reference path="expressions/stringifier.ts"/>
/// <reference path="passes/edgeOptimization.ts"/>

namespace Styx {
    const stringify = Expressions.Stringifier.stringify;
    const negateTruthiness = Expressions.Negator.negateTruthiness;
    
    interface StatementTypeToParserMap {
        [type: string]: (statement: ESTree.Statement, currentNode: FlowNode) => FlowNode;
    }
    
    export class Parser {
        public controlFlowGraph: ControlFlowGraph;
        
        private idGenerator: Util.IdGenerator;
        private enclosingStatements: Collections.Stack<EnclosingStatement>;
        
        constructor(program: ESTree.Program) {
            this.idGenerator = Util.createIdGenerator();
            this.enclosingStatements = new Collections.Stack<EnclosingStatement>();
            
            this.controlFlowGraph = this.parseProgram(program);
            Passes.removeTransitNodes(this.controlFlowGraph);
        }
    
        private parseProgram(program: ESTree.Program): ControlFlowGraph {
            let entryNode = this.createNode();
            
            this.parseStatements(program.body, entryNode);
    
            return {
                entry: entryNode
            };
        }
    
        private parseStatements(statements: ESTree.Statement[], currentNode: FlowNode): FlowNode {
            for (let statement of statements) {
                currentNode = this.parseStatement(statement, currentNode);
                
                if (Parser.isAbruptCompletion(statement)) {
                    // If we encounter an abrupt completion, normal control flow is interrupted
                    // and the following statements aren't executed
                    return currentNode;
                }
            }
            
            return currentNode;
        }
    
        private parseStatement(statement: ESTree.Statement, currentNode: FlowNode): FlowNode {
            if (statement === null) {
                return currentNode;
            }
            
            let statementParsers: StatementTypeToParserMap = {
                [ESTree.NodeType.EmptyStatement]: this.parseEmptyStatement,
                [ESTree.NodeType.BlockStatement]: this.parseBlockStatement,
                [ESTree.NodeType.VariableDeclaration]: this.parseVariableDeclaration,
                [ESTree.NodeType.IfStatement]: this.parseIfStatement,
                [ESTree.NodeType.LabeledStatement]: this.parseLabeledStatement,
                [ESTree.NodeType.BreakStatement]: this.parseBreakStatement,
                [ESTree.NodeType.ContinueStatement]: this.parseContinueStatement,
                [ESTree.NodeType.WithStatement]: this.parseWithStatement,
                [ESTree.NodeType.SwitchStatement]: this.parseSwitchStatement,
                [ESTree.NodeType.WhileStatement]: this.parseWhileStatement,
                [ESTree.NodeType.DoWhileStatement]: this.parseDoWhileStatement,
                [ESTree.NodeType.ForStatement]: this.parseForStatement,
                [ESTree.NodeType.ForInStatement]: this.parseForInStatement,
                [ESTree.NodeType.DebuggerStatement]: this.parseDebuggerStatement,
                [ESTree.NodeType.ExpressionStatement]: this.parseExpressionStatement
            };
            
            let parsingMethod = statementParsers[statement.type];
            
            if (!parsingMethod) {
                throw Error(`Encountered unsupported statement type '${statement.type}'`);
            }
            
            return parsingMethod.call(this, statement, currentNode);
        }
        
        private parseEmptyStatement(emptyStatement: ESTree.EmptyStatement, currentNode: FlowNode): FlowNode {
            return this.createNode().appendTo(currentNode, "(empty)");
        }
        
        private parseBlockStatement(blockStatement: ESTree.BlockStatement, currentNode: FlowNode): FlowNode {
            return this.parseStatements(blockStatement.body, currentNode);
        }
    
        private parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode): FlowNode {
            for (let declarator of declaration.declarations) {
                let initString = stringify(declarator.init);
                let edgeLabel = `${declarator.id.name} = ${initString}`;
                currentNode = this.createNode().appendTo(currentNode, edgeLabel);
            }
    
            return currentNode;
        }
    
        private parseLabeledStatement(labeledStatement: ESTree.LabeledStatement, currentNode: FlowNode): FlowNode {
            let body = labeledStatement.body;
            let label = labeledStatement.label.name;
            
            switch (body.type) {
                case ESTree.NodeType.BlockStatement:
                    let finalNode = this.createNode();
                    
                    let enclosingStatement: EnclosingStatement = {
                        breakTarget: finalNode,
                        continueTarget: null,
                        label: label
                    };
                    
                    this.enclosingStatements.push(enclosingStatement);
                    let endOfStatementBodyNode = this.parseBlockStatement(<ESTree.BlockStatement>body, currentNode);
                    this.enclosingStatements.pop();
                                        
                    return finalNode.appendEpsilonEdgeTo(endOfStatementBodyNode);
                
                case ESTree.NodeType.SwitchStatement:
                    return this.parseSwitchStatement(<ESTree.SwitchStatement>body, currentNode, label);
                    
                case ESTree.NodeType.WhileStatement:
                    return this.parseWhileStatement(<ESTree.WhileStatement>body, currentNode, label);
                
                case ESTree.NodeType.DoWhileStatement:
                    return this.parseDoWhileStatement(<ESTree.DoWhileStatement>body, currentNode, label);
                
                case ESTree.NodeType.ForStatement:
                    return this.parseForStatement(<ESTree.ForStatement>body, currentNode, label);
                
                case ESTree.NodeType.ForInStatement:
                    return this.parseForInStatement(<ESTree.ForInStatement>body, currentNode, label);
                    
                default:
                    // If we didn't encounter an enclosing statement,
                    // the label is irrelevant for control flow and we thus don't track it.
                    return this.parseStatement(body, currentNode);
            }
        }
    
        private parseIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            return ifStatement.alternate === null
                ? this.parseSimpleIfStatement(ifStatement, currentNode)
                : this.parseIfElseStatement(ifStatement, currentNode);
        }
    
        private parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            let negatedTest = negateTruthiness(ifStatement.test);
            
            let thenLabel = stringify(ifStatement.test);
            let elseLabel = stringify(negatedTest);
            
            let thenNode = this.createNode()
                .appendTo(currentNode, thenLabel, EdgeType.Conditional);
            
            let endOfThenBranch = this.parseStatement(ifStatement.consequent, thenNode);
            
            let finalNode = this.createNode()
                .appendTo(currentNode, elseLabel, EdgeType.Conditional);
            
            if (endOfThenBranch) {
                finalNode.appendEpsilonEdgeTo(endOfThenBranch);
            }
            
            return finalNode;
        }
    
        private parseIfElseStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            // Then branch
            let thenLabel = stringify(ifStatement.test);
            let thenNode = this.createNode().appendTo(currentNode, thenLabel, EdgeType.Conditional);
            let endOfThenBranch = this.parseStatement(ifStatement.consequent, thenNode);
            
            // Else branch
            let negatedTest = negateTruthiness(ifStatement.test);
            let elseLabel = stringify(negatedTest); 
            let elseNode = this.createNode().appendTo(currentNode, elseLabel, EdgeType.Conditional);
            let endOfElseBranch = this.parseStatement(ifStatement.alternate, elseNode);
            
            let finalNode = this.createNode();
            
            if (endOfThenBranch) {
                finalNode.appendEpsilonEdgeTo(endOfThenBranch);
            }
            
            if (endOfElseBranch) {
                finalNode.appendEpsilonEdgeTo(endOfElseBranch);
            }
            
            return finalNode;
        }
        
        private parseBreakStatement(breakStatement: ESTree.BreakStatement, currentNode: FlowNode): FlowNode {
            let label = breakStatement.label ? breakStatement.label.name : void 0;
            let enclosingStatement = label
                ? this.enclosingStatements.find(statement => statement.label === label)
                : this.enclosingStatements.peek();
            
            enclosingStatement.breakTarget.appendTo(currentNode, "break", EdgeType.AbruptCompletion);
            
            return null;
        }
        
        private parseContinueStatement(continueStatement: ESTree.ContinueStatement, currentNode: FlowNode): FlowNode {
            let label = continueStatement.label ? continueStatement.label.name : void 0;
            let enclosingStatement = label
                ? this.enclosingStatements.find(statement => statement.label === label)
                : this.enclosingStatements.peek();
            
            if (enclosingStatement.continueTarget === null) {
                throw new Error(`Illegal continue target detected: "${label}" does not label an enclosing iteration statement`);
            }
            
            enclosingStatement.continueTarget.appendTo(currentNode, "continue", EdgeType.AbruptCompletion);
            
            return null;
        }
        
        private parseWithStatement(withStatement: ESTree.WithStatement, currentNode: FlowNode): FlowNode {
            let stringifiedExpression = stringify(withStatement.object);
            let expressionNode = this.createNode().appendTo(currentNode, stringifiedExpression); 
            
            return this.parseStatement(withStatement.body, expressionNode);
        }
        
        private parseSwitchStatement(switchStatement: ESTree.SwitchStatement, currentNode: FlowNode, label?: string): FlowNode {
            const switchExpression = "$switch";
            
            let stringifiedDiscriminant = stringify(switchStatement.discriminant);
            let exprRef = `${switchExpression} = ${stringifiedDiscriminant}`;
            let evaluatedDiscriminantNode = this.createNode().appendTo(currentNode, exprRef);
            
            let finalNode = this.createNode(); 
            
            this.enclosingStatements.push({
                breakTarget: finalNode,
                continueTarget: null,
                label: label
            });
            
            let endOfPreviousCase: FlowNode = void 0;
            
            for (let switchCase of switchStatement.cases) {
                let isDefaultCase = switchCase.test === null;
                let caseEdgeLabel = isDefaultCase
                    ? "<default>"
                    : `${switchExpression} === ${stringify(switchCase.test)}`;
                
                let caseBody = this.createNode()
                    .appendTo(evaluatedDiscriminantNode, caseEdgeLabel, EdgeType.Conditional);
                
                if (endOfPreviousCase) {
                    caseBody.appendEpsilonEdgeTo(endOfPreviousCase);
                }
                
                endOfPreviousCase = this.parseStatements(switchCase.consequent, caseBody);
            }
            
            this.enclosingStatements.pop();
            
            if (endOfPreviousCase) {
                finalNode.appendEpsilonEdgeTo(endOfPreviousCase);
            }
            
            return finalNode;
        }
        
        private parseWhileStatement(whileStatement: ESTree.WhileStatement, currentNode: FlowNode, label?: string): FlowNode {
            // Truthy test (enter loop)
            let truthyCondition = whileStatement.test;
            let truthyConditionLabel = stringify(truthyCondition);
            
            // Falsy test (exit loop)
            let falsyCondition = negateTruthiness(truthyCondition);
            let falsyConditionLabel = stringify(falsyCondition);
            
            let loopBodyNode = this.createNode().appendTo(currentNode, truthyConditionLabel, EdgeType.Conditional);
            let finalNode = this.createNode();
            
            this.enclosingStatements.push({
                continueTarget: currentNode,
                breakTarget: finalNode,
                label: label
            });
            
            let endOfLoopBodyNode = this.parseStatement(whileStatement.body, loopBodyNode);
            
            if (endOfLoopBodyNode) {
                currentNode.appendEpsilonEdgeTo(endOfLoopBodyNode);
            }
            
            this.enclosingStatements.pop();
            
            return finalNode
                .appendTo(currentNode, falsyConditionLabel, EdgeType.Conditional);
        }
        
        private parseDoWhileStatement(doWhileStatement: ESTree.DoWhileStatement, currentNode: FlowNode, label?: string): FlowNode {
            // Truthy test (enter loop)
            let truthyCondition = doWhileStatement.test;
            let truthyConditionLabel = stringify(truthyCondition);
            
            // Falsy test (exit loop)
            let falsyCondition = negateTruthiness(truthyCondition);            
            let falsyConditionLabel = stringify(falsyCondition);
            
            let testNode = this.createNode();
            let finalNode = this.createNode();
            
            this.enclosingStatements.push({
                continueTarget: testNode,
                breakTarget: finalNode,
                label: label
            });
            
            let endOfLoopBodyNode = this.parseStatement(doWhileStatement.body, currentNode);
            
            this.enclosingStatements.pop();
            
            currentNode.appendTo(testNode, truthyConditionLabel, EdgeType.Conditional);
            finalNode.appendTo(testNode, falsyConditionLabel, EdgeType.Conditional);
            
            if (endOfLoopBodyNode) {
                testNode.appendEpsilonEdgeTo(endOfLoopBodyNode);
            }
            
            return finalNode;
        }
        
        private parseForStatement(forStatement: ESTree.ForStatement, currentNode: FlowNode, label?: string): FlowNode {
            // Parse initialization
            let testDecisionNode = this.parseStatement(forStatement.init, currentNode);
            
            // Create nodes for loop cornerstones
            let beginOfLoopBodyNode = this.createNode();
            let updateNode = this.createNode();
            let finalNode = this.createNode();
            
            if (forStatement.test) {
                // If the loop has a test expression,
                // we need to add truthy and falsy edges
                let truthyCondition = forStatement.test;
                let falsyCondition = negateTruthiness(truthyCondition);
                
                // Create edges labels
                let truthyConditionLabel = stringify(truthyCondition);                
                let falsyConditionLabel = stringify(falsyCondition);
                
                // Add truthy and falsy edges
                beginOfLoopBodyNode.appendTo(testDecisionNode, truthyConditionLabel, EdgeType.Conditional)
                finalNode.appendTo(testDecisionNode, falsyConditionLabel, EdgeType.Conditional);
            } else {
                // If the loop doesn't have a test expression,
                // the loop body starts unconditionally after the initialization
                beginOfLoopBodyNode.appendEpsilonEdgeTo(testDecisionNode);
            }
            
            // Begin loop context
            this.enclosingStatements.push({
                continueTarget: updateNode,
                breakTarget: finalNode,
                label: label
            });
            
            // Parse body
            let endOfLoopBodyNode = this.parseStatement(forStatement.body, beginOfLoopBodyNode);
            
            // End loop context
            this.enclosingStatements.pop();
            
            if (forStatement.update) {
                // If the loop has an update expression,
                // parse it and append it to the end of the loop body
                let endOfUpdateNode = this.parseExpression(forStatement.update, updateNode);
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
        
        private parseForInStatement(forInStatement: ESTree.ForInStatement, currentNode: FlowNode, label?: string): FlowNode {
            let stringifiedRight = stringify(forInStatement.right);
            
            let variableDeclarator = forInStatement.left.declarations[0];
            let variableName = variableDeclarator.id.name;
            
            let conditionNode = this.createNode()
                .appendTo(currentNode, stringifiedRight);
            
            let startOfLoopBody = this.createNode()
                .appendTo(conditionNode, `${variableName} = <next>`, EdgeType.Conditional);
                
            let finalNode = this.createNode()
                .appendTo(conditionNode, "<no more>", EdgeType.Conditional);
            
            this.enclosingStatements.push({
                breakTarget: finalNode,
                continueTarget: conditionNode,
                label: label
            });
            
            let endOfLoopBody = this.parseStatement(forInStatement.body, startOfLoopBody);
            
            this.enclosingStatements.pop();
            
            if (endOfLoopBody) {
                conditionNode.appendEpsilonEdgeTo(endOfLoopBody);
            }
            
            return finalNode;
        }
        
        private parseDebuggerStatement(debuggerStatement: ESTree.DebuggerStatement, currentNode: FlowNode): FlowNode {
            return currentNode;
        }
        
        private parseExpressionStatement(expressionStatement: ESTree.ExpressionStatement, currentNode: FlowNode): FlowNode {
            return this.parseExpression(expressionStatement.expression, currentNode);
        }
        
        private parseExpression(expression: ESTree.Expression, currentNode: FlowNode): FlowNode {
            if (expression.type === ESTree.NodeType.SequenceExpression) {
                return this.parseSequenceExpression(<ESTree.SequenceExpression>expression, currentNode);
            }
            
            let expressionLabel = stringify(expression);
            
            return this.createNode()
                .appendTo(currentNode, expressionLabel);
        }
        
        private parseSequenceExpression(sequenceExpression: ESTree.SequenceExpression, currentNode: FlowNode): FlowNode {
            for (let expression of sequenceExpression.expressions) {
                currentNode = this.parseExpression(expression, currentNode);
            }
            
            return currentNode;
        }
        
        private static isAbruptCompletion(statement: ESTree.Statement): boolean {
            switch (statement.type) {
                case ESTree.NodeType.BreakStatement:
                case ESTree.NodeType.ContinueStatement:
                    return true;
                    
                default:
                    return false;
            }
        }
        
        private createNode(): FlowNode {
            return new FlowNode(this.idGenerator.makeNew());
        }
    }
}
