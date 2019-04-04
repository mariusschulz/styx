import { stringify } from "../expressions/stringifier";

import { parseBlockStatement } from "../statements/block";

import { Stack } from "../../collections/stack";

import * as ESTree from "../../estree";

import {
  createAssignmentExpression,
  createIdentifier,
  createLiteral
} from "../../estreeFactory";

import {
  Completion,
  EdgeType,
  EnclosingStatement,
  FlowFunction,
  FlowNode,
  NodeType,
  ParsingContext
} from "../../flow";

export { parseFunctionDeclaration };

function parseFunctionDeclaration(
  functionDeclaration: ESTree.Function,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let entryNode = context.createNode(NodeType.Entry);
  let successExitNode = context.createNode(NodeType.SuccessExit);
  let errorExitNode = context.createNode(NodeType.ErrorExit);

  let func: FlowFunction = {
    id: context.createFunctionId(),
    name: functionDeclaration.id.name,
    flowGraph: {
      entry: entryNode,
      successExit: successExitNode,
      errorExit: errorExitNode,
      nodes: [],
      edges: []
    }
  };

  let functionContext: ParsingContext = {
    functions: context.functions,
    currentFlowGraph: func.flowGraph,

    enclosingStatements: Stack.create<EnclosingStatement>(),

    createTemporaryLocalVariableName: context.createTemporaryLocalVariableName,
    createNode: context.createNode,
    createFunctionId: context.createFunctionId
  };

  let endOfParamAssignments = explicitlyAssignParameterValues(
    functionDeclaration,
    entryNode,
    context
  );

  let completion = parseBlockStatement(
    functionDeclaration.body,
    endOfParamAssignments,
    functionContext
  );

  if (completion.normal) {
    // If we reached this point, the function didn't end with an explicit return statement.
    // Thus, an implicit "undefined" is returned.
    let undefinedReturnValue: ESTree.Identifier = {
      type: ESTree.NodeType.Identifier,
      name: "undefined"
    };

    let returnStatement: ESTree.ReturnStatement = {
      type: ESTree.NodeType.ReturnStatement,
      argument: undefinedReturnValue
    };

    func.flowGraph.successExit.appendTo(
      completion.normal,
      "return undefined",
      returnStatement,
      EdgeType.AbruptCompletion
    );
  }

  context.functions.push(func);

  return { normal: currentNode };
}

function explicitlyAssignParameterValues(
  functionDeclaration: ESTree.Function,
  currentNode: FlowNode,
  context: ParsingContext
): FlowNode {
  let specialParamsArray = createIdentifier("$$params");

  functionDeclaration.params.forEach((param, index) => {
    let indexedParamAccess: ESTree.MemberExpression = {
      type: ESTree.NodeType.MemberExpression,
      computed: true,
      object: specialParamsArray,
      property: createLiteral(index)
    };

    let paramAssignment = createAssignmentExpression({
      left: param,
      right: indexedParamAccess
    });

    currentNode = context
      .createNode()
      .appendTo(currentNode, stringify(paramAssignment), paramAssignment);
  });

  return currentNode;
}
