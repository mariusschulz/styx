import * as ESTree from "../../estree";

import { NumericSet } from "../../collections/numericSet";
import * as ArrayUtils from "../../util/arrayUtil";

import { ControlFlowGraph, EdgeType, FlowEdge, FlowNode } from "../../flow";

export function rewriteConstantConditionalEdges(graph: ControlFlowGraph) {
  let visitedNodes = NumericSet.create();
  let edgesToRemove: FlowEdge[] = [];

  visitNode(graph.entry, visitedNodes, edgesToRemove);

  for (let edge of edgesToRemove) {
    removeEdge(edge);
  }
}

function visitNode(
  node: FlowNode,
  visitedNodes: NumericSet,
  edgesToRemove: FlowEdge[]
) {
  if (visitedNodes.contains(node.id)) {
    return;
  }

  visitedNodes.add(node.id);

  for (let edge of node.outgoingEdges) {
    inspectEdge(edge, edgesToRemove);
    visitNode(edge.target, visitedNodes, edgesToRemove);
  }
}

function inspectEdge(edge: FlowEdge, edgesToRemove: FlowEdge[]) {
  if (
    edge.type !== EdgeType.Conditional ||
    edge.data == null ||
    !isCompileTimeConstant(edge.data)
  ) {
    // We only deal with conditional edges that have a condition
    // whose truthiness we can safely determine at compile-time
    return;
  }

  if (isAlwaysTruthy(edge.data)) {
    // Conditional edges with a constant truthy test are always taken;
    // we can therefore turn them into simple epsilon edges
    turnEdgeIntoEpsilonEdge(edge);
  } else {
    // Conditional edges with a constant falsy test are never taken;
    // we thus remove this edge after walking the entire graph
    edgesToRemove.push(edge);
  }
}

function isCompileTimeConstant(expression: ESTree.Expression): boolean {
  switch (expression.type) {
    case ESTree.NodeType.Literal:
      return true;

    case ESTree.NodeType.UnaryExpression:
      let unaryExpression = <ESTree.UnaryExpression>expression;
      return (
        unaryExpression.operator === "!" &&
        isCompileTimeConstant(unaryExpression.argument)
      );

    default:
      return false;
  }
}

function isAlwaysTruthy(expression: ESTree.Expression): boolean {
  switch (expression.type) {
    case ESTree.NodeType.Literal:
      return !!(<ESTree.Literal>expression).value;

    case ESTree.NodeType.UnaryExpression:
      let unaryExpression = <ESTree.UnaryExpression>expression;

      if (unaryExpression.operator !== "!") {
        throw Error("This branch shouldn't have been reached");
      }

      return !isAlwaysTruthy(unaryExpression.argument);

    default:
      throw Error("This case shouldn't have been reached");
  }
}

function turnEdgeIntoEpsilonEdge(edge: FlowEdge) {
  edge.type = EdgeType.Epsilon;
  edge.label = "";
  edge.data = null;
}

function removeEdge(edge: FlowEdge) {
  ArrayUtils.removeElementFromArray(edge, edge.source.outgoingEdges);
  ArrayUtils.removeElementFromArray(edge, edge.target.incomingEdges);
}
