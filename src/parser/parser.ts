import { stringify } from "./expressions/stringifier";

import * as Passes from "./passes/index";

import * as AstPreprocessing from "./preprocessing/functionExpressionRewriter";

import { Stack } from "../collections/stack";
import IdGenerator from "../util/idGenerator";

import * as ESTree from "../estree";
import {
    Completion,
    ControlFlowGraph,
    EnclosingStatement,
    FlowNode,
    FlowProgram,
    NodeType,
    ParsingContext,
    ParserOptions
} from "../flow";

import { parseBlockStatement } from "./statements/block";
import { parseBreakStatement, parseContinueStatement } from "./statements/breakContinue";
import { parseDebuggerStatement } from "./statements/debugger";
import { parseDoWhileStatement } from "./statements/doWhile";
import { parseEmptyStatement } from "./statements/empty";
import { parseExpression, parseExpressionStatement } from "./statements/expression";
import { parseForStatement } from "./statements/for";
import { parseForInStatement } from "./statements/forIn";
import { parseFunctionDeclaration } from "./statements/functionDeclaration";
import { parseIfStatement } from "./statements/if";
import { parseLabeledStatement } from "./statements/labeled";
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

function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode, context: ParsingContext): Completion {
    for (let declarator of declaration.declarations) {
        let initString = stringify(declarator.init);
        let edgeLabel = `${declarator.id.name} = ${initString}`;
        currentNode = context.createNode().appendTo(currentNode, edgeLabel);
    }

    return { normal: currentNode };
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
