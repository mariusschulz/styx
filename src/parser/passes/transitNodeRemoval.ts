import { NumericSet } from "../../collections/numericSet";
import * as ArrayUtils from "../../util/arrayUtil";

import { ControlFlowGraph, EdgeType, FlowNode, NodeType } from "../../flow";

export { removeTransitNodes };

function removeTransitNodes(graph: ControlFlowGraph) {
  let visitedNodes = NumericSet.create();
  optimizeNode(graph.entry, visitedNodes);
}

function optimizeNode(node: FlowNode, visitedNodes: NumericSet) {
  if (visitedNodes.contains(node.id)) {
    return;
  }

  visitedNodes.add(node.id);

  // Remember target nodes for later traversal
  let targetNodes = node.outgoingEdges.map(edge => edge.target);

  // We want to simplify transit nodes, but we only ever remove normal nodes
  // because we don't want to mess up references to entry or exit nodes
  if (
    node.incomingEdges.length === 1 &&
    node.outgoingEdges.length === 1 &&
    node.type === NodeType.Normal
  ) {
    let incomingEdge = node.incomingEdges[0];
    let outgoingEdge = node.outgoingEdges[0];

    if (
      incomingEdge.type === EdgeType.Epsilon ||
      outgoingEdge.type === EdgeType.Epsilon
    ) {
      optimizeTransitNode(node, visitedNodes);
    }
  }

  for (let target of targetNodes) {
    optimizeNode(target, visitedNodes);
  }
}

function optimizeTransitNode(transitNode: FlowNode, visitedNodes: NumericSet) {
  // Remember the transit node's original target
  let originalTarget = transitNode.outgoingEdges[0].target;

  if (shouldRemoveTransitNode(transitNode)) {
    removeTransitNode(transitNode);
  }

  // Recursively optimize, starting with the original target
  optimizeNode(originalTarget, visitedNodes);
}

function shouldRemoveTransitNode(transitNode: FlowNode): boolean {
  let sourceId = transitNode.incomingEdges[0].source.id;
  let target = transitNode.outgoingEdges[0].target;

  for (let incomingTargetEdges of target.incomingEdges) {
    // We only simplify transit nodes if their removal doesn't lead
    // to a node being directly connected to another node by 2 edges
    if (incomingTargetEdges.source.id === sourceId) {
      return false;
    }
  }

  return true;
}

function removeTransitNode(transitNode: FlowNode) {
  let incomingEdge = transitNode.incomingEdges[0];
  let outgoingEdge = transitNode.outgoingEdges[0];

  let source = incomingEdge.source;
  let target = outgoingEdge.target;

  // Decide whether to keep the incoming or the outgoing edge.
  // If both are epsilon edges, it doesn't matter which one to keep.
  let [edgeToKeep, edgeToRemove] =
    incomingEdge.type === EdgeType.Epsilon
      ? [outgoingEdge, incomingEdge]
      : [incomingEdge, outgoingEdge];

  // Redirect surviving edge
  edgeToKeep.source = source;
  edgeToKeep.target = target;

  // Delete both edges from the source
  ArrayUtils.removeElementFromArray(edgeToRemove, source.outgoingEdges);
  ArrayUtils.removeElementFromArray(edgeToKeep, source.outgoingEdges);

  // Delete both edges from the target
  ArrayUtils.removeElementFromArray(edgeToRemove, target.incomingEdges);
  ArrayUtils.removeElementFromArray(edgeToKeep, target.incomingEdges);

  // Add the new edge to both source and target
  source.outgoingEdges.push(edgeToKeep);
  target.incomingEdges.push(edgeToKeep);

  // Clear node
  transitNode.incomingEdges = [];
  transitNode.outgoingEdges = [];
}
