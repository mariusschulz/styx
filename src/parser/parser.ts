import { stringify } from "./expressions/stringifier";

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

import { runOptimizationPasses } from "./passes/index";

import { parseStatements } from "./statements/statement";

export { parse };

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
