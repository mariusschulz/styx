import { negateTruthiness } from "./expressions/negator";
import { stringify } from "./expressions/stringifier";

import * as Passes from "./passes/index";

import * as AstPreprocessing from "./preprocessing/functionExpressionRewriter";

import { Stack } from "../collections/stack";
import IdGenerator from "../util/idGenerator";

import * as ESTree from "../estree";
import {
    Completion,
    ControlFlowGraph,
    EdgeType,
    EnclosingStatement,
    EnclosingStatementType,
    EnclosingTryStatement,
    FlowEdge,
    FlowFunction,
    FlowNode,
    FlowProgram,
    NodeType,
    ParsingContext,
    ParserOptions
} from "../flow";

import { parseBreakStatement, parseContinueStatement } from "./statements/breakContinue";
import { parseDebuggerStatement } from "./statements/debugger";
import { parseDoWhileStatement } from "./statements/doWhile";
import { parseExpression, parseExpressionStatement } from "./statements/expression";
import { parseIfStatement } from "./statements/if";
import { parseFunctionDeclaration } from "./statements/functionDeclaration";
import { parseReturnStatement } from "./statements/return";
import { parseSwitchStatement } from "./statements/switch";
import { parseThrowStatement } from "./statements/throw";
import { parseTryStatement } from "./statements/try";
import { parseWhileStatement } from "./statements/while";
import { parseWithStatement } from "./statements/with";

export { parse, parseBlockStatement, parseStatement, parseStatements };

interface StatementTypeToParserMap {
    [type: string]: (statement: ESTree.Statement, currentNode: FlowNode, context: ParsingContext) => Completion;
}

function parse(program: ESTree.Program, options: ParserOptions): FlowProgram {
    let context = createParsingContext();

    let rewrittenProgram = AstPreprocessing.rewriteFunctionExpressions(program);
    let parsedProgram = parseProgram(rewrittenProgram, context);

    // Run optimization passes
    let functionFlowGraphs = context.functions.map(func => func.flowGraph);
    let flowGraphs = [parsedProgram.flowGraph, ...functionFlowGraphs];
    runOptimizationPasses(flowGraphs, options);

    return parsedProgram;
}

function createParsingContext(): ParsingContext {
    let nodeIdGenerator = IdGenerator.create();
    let functionIdGenerator = IdGenerator.create();
    let variableNameIdGenerator = IdGenerator.create();

    return {
        functions: [],
        currentFlowGraph: null,

        enclosingStatements: Stack.create<EnclosingStatement>(),

        createTemporaryLocalVariableName() {
            return "$$temp" + variableNameIdGenerator.generateId();
        },

        createNode(type = NodeType.Normal) {
            let id = nodeIdGenerator.generateId();
            return new FlowNode(id, type);
        },

        createFunctionId() {
            return functionIdGenerator.generateId();
        }
    };
}

function parseProgram(program: ESTree.Program, context: ParsingContext): FlowProgram {
    let entryNode = context.createNode(NodeType.Entry);
    let successExitNode = context.createNode(NodeType.SuccessExit);
    let errorExitNode = context.createNode(NodeType.ErrorExit);

    let programFlowGraph: ControlFlowGraph = {
        entry: entryNode,
        successExit: successExitNode,
        errorExit: errorExitNode,
        nodes: [],
        edges: []
    };

    context.currentFlowGraph = programFlowGraph;
    let completion = parseStatements(program.body, entryNode, context);

    if (completion.normal) {
        successExitNode.appendEpsilonEdgeTo(completion.normal);
    }

    return {
        flowGraph: programFlowGraph,
        functions: context.functions
    };
}

function parseStatements(statements: ESTree.Statement[], currentNode: FlowNode, context: ParsingContext): Completion {
    for (let statement of statements) {
        let completion = parseStatement(statement, currentNode, context);

        if (!completion.normal) {
            // If we encounter an abrupt completion, normal control flow is interrupted
            // and the following statements aren't executed
            return completion;
        }

        currentNode = completion.normal;
    }

    return { normal: currentNode };
}

function parseStatement(statement: ESTree.Statement, currentNode: FlowNode, context: ParsingContext): Completion {
    if (statement === null) {
        return { normal: currentNode };
    }

    let statementParsers: StatementTypeToParserMap = {
        [ESTree.NodeType.BlockStatement]: parseBlockStatement,
        [ESTree.NodeType.BreakStatement]: parseBreakStatement,
        [ESTree.NodeType.ContinueStatement]: parseContinueStatement,
        [ESTree.NodeType.DebuggerStatement]: parseDebuggerStatement,
        [ESTree.NodeType.DoWhileStatement]: parseDoWhileStatement,
        [ESTree.NodeType.EmptyStatement]: parseEmptyStatement,
        [ESTree.NodeType.ExpressionStatement]: parseExpressionStatement,
        [ESTree.NodeType.ForInStatement]: parseForInStatement,
        [ESTree.NodeType.ForStatement]: parseForStatement,
        [ESTree.NodeType.FunctionDeclaration]: parseFunctionDeclaration,
        [ESTree.NodeType.IfStatement]: parseIfStatement,
        [ESTree.NodeType.LabeledStatement]: parseLabeledStatement,
        [ESTree.NodeType.ReturnStatement]: parseReturnStatement,
        [ESTree.NodeType.SwitchStatement]: parseSwitchStatement,
        [ESTree.NodeType.ThrowStatement]: parseThrowStatement,
        [ESTree.NodeType.TryStatement]: parseTryStatement,
        [ESTree.NodeType.VariableDeclaration]: parseVariableDeclaration,
        [ESTree.NodeType.WhileStatement]: parseWhileStatement,
        [ESTree.NodeType.WithStatement]: parseWithStatement
    };

    let parsingMethod = statementParsers[statement.type];

    if (!parsingMethod) {
        throw Error(`Encountered unsupported statement type '${statement.type}'`);
    }

    return parsingMethod(statement, currentNode, context);
}

function parseEmptyStatement(emptyStatement: ESTree.EmptyStatement, currentNode: FlowNode, context: ParsingContext): Completion {
    return {
        normal: context.createNode().appendTo(currentNode, "(empty)")
    };
}

function parseBlockStatement(blockStatement: ESTree.BlockStatement, currentNode: FlowNode, context: ParsingContext): Completion {
    return parseStatements(blockStatement.body, currentNode, context);
}

function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode, context: ParsingContext): Completion {
    for (let declarator of declaration.declarations) {
        let initString = stringify(declarator.init);
        let edgeLabel = `${declarator.id.name} = ${initString}`;
        currentNode = context.createNode().appendTo(currentNode, edgeLabel);
    }

    return { normal: currentNode };
}

function parseLabeledStatement(labeledStatement: ESTree.LabeledStatement, currentNode: FlowNode, context: ParsingContext): Completion {
    let body = labeledStatement.body;
    let label = labeledStatement.label.name;

    switch (body.type) {
        case ESTree.NodeType.BlockStatement:
        case ESTree.NodeType.IfStatement:
        case ESTree.NodeType.TryStatement:
        case ESTree.NodeType.WithStatement:
            let finalNode = context.createNode();

            let enclosingStatement: EnclosingStatement = {
                type: EnclosingStatementType.OtherStatement,
                breakTarget: finalNode,
                continueTarget: null,
                label: label
            };

            context.enclosingStatements.push(enclosingStatement);
            let bodyCompletion = parseStatement(body, currentNode, context);
            context.enclosingStatements.pop();

            if (bodyCompletion.normal) {
                finalNode.appendEpsilonEdgeTo(bodyCompletion.normal);
                return { normal: finalNode };
            }

            return bodyCompletion;

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

function parseForStatement(forStatement: ESTree.ForStatement, currentNode: FlowNode, context: ParsingContext, label?: string): Completion {
    // Parse initialization
    let testDecisionNode = parseStatement(forStatement.init, currentNode, context).normal;

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
        beginOfLoopBodyNode.appendConditionallyTo(testDecisionNode, truthyConditionLabel, truthyCondition);
        finalNode.appendConditionallyTo(testDecisionNode, falsyConditionLabel, falsyCondition);
    } else {
        // If the loop doesn't have a test expression,
        // the loop body starts unconditionally after the initialization
        beginOfLoopBodyNode.appendEpsilonEdgeTo(testDecisionNode);
    }

    context.enclosingStatements.push({
        type: EnclosingStatementType.OtherStatement,
        continueTarget: updateNode,
        breakTarget: finalNode,
        label: label
    });

    let loopBodyCompletion = parseStatement(forStatement.body, beginOfLoopBodyNode, context);

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

    if (loopBodyCompletion.normal) {
        // If we reached the end of the loop body through normal control flow,
        // continue regularly with the update
        updateNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
    }

    return { normal: finalNode };
}

function parseForInStatement(forInStatement: ESTree.ForInStatement, currentNode: FlowNode, context: ParsingContext, label?: string): Completion {
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
        type: EnclosingStatementType.OtherStatement,
        breakTarget: finalNode,
        continueTarget: conditionNode,
        label: label
    });

    let loopBodyCompletion = parseStatement(forInStatement.body, startOfLoopBody, context);

    context.enclosingStatements.pop();

    if (loopBodyCompletion.normal) {
        conditionNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
    }

    return { normal: finalNode };
}

function runOptimizationPasses(graphs: ControlFlowGraph[], options: ParserOptions) {
    for (let graph of graphs) {
        if (options.passes.rewriteConstantConditionalEdges) {
            Passes.rewriteConstantConditionalEdges(graph);
        }

        Passes.removeUnreachableNodes(graph);

        if (options.passes.removeTransitNodes) {
            Passes.removeTransitNodes(graph);
        }

        Passes.collectNodesAndEdges(graph);
    }
}
