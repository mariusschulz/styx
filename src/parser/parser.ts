import { Stack } from "../collections/stack";
import IdGenerator from "../util/idGenerator";

import { runOptimizationPasses } from "./passes/index";
import * as AstPreprocessing from "./preprocessing/functionExpressionRewriter";
import { parseStatements } from "./statements/statement";

import * as ESTree from "../estree";
import {
  ControlFlowGraph,
  EnclosingStatement,
  FlowNode,
  FlowProgram,
  NodeType,
  ParsingContext,
  ParserOptions
} from "../flow";

export { parse };

function parse(program: ESTree.Program, options: ParserOptions): FlowProgram {
  let context = createParsingContext();

  let rewrittenProgram = AstPreprocessing.rewriteFunctionExpressions(program);
  let parsedProgram = parseProgram(rewrittenProgram, context);

  let functionFlowGraphs = parsedProgram.functions.map(func => func.flowGraph);
  let flowGraphs = [parsedProgram.flowGraph, ...functionFlowGraphs];
  runOptimizationPasses(flowGraphs, options);

  return parsedProgram;
}

function parseProgram(
  program: ESTree.Program,
  context: ParsingContext
): FlowProgram {
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

function createParsingContext(): ParsingContext {
  let nodeIdGenerator = IdGenerator.create();
  let functionIdGenerator = IdGenerator.create();
  let variableNameIdGenerator = IdGenerator.create();

  return {
    functions: [],
    currentFlowGraph: null,

    enclosingStatements: Stack.create<EnclosingStatement>(),

    createTemporaryLocalVariableName(name) {
      const id = variableNameIdGenerator.generateId();

      return `$$${name}${id}`;
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
