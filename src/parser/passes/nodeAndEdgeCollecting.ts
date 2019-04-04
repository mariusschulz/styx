import { NumericMap } from "../../collections/numericMap";

import { ControlFlowGraph, FlowEdge, FlowNode } from "../../flow";

export { collectNodesAndEdges };

function collectNodesAndEdges(graph: ControlFlowGraph) {
  graph.nodes = collectNodes(graph.entry);
  graph.edges = collectEdges(graph.nodes);
}

function collectNodes(graphEntry: FlowNode): FlowNode[] {
  let nodes = NumericMap.create<FlowNode>();
  walkGraphAndCollectNodes(graphEntry, nodes);

  return nodes.values();
}

function walkGraphAndCollectNodes(
  currentNode: FlowNode,
  nodes: NumericMap<FlowNode>
) {
  if (nodes.containsKey(currentNode.id)) {
    return;
  }

  nodes.set(currentNode.id, currentNode);

  for (let outgoingEdge of currentNode.outgoingEdges) {
    walkGraphAndCollectNodes(outgoingEdge.target, nodes);
  }
}

function collectEdges(nodes: FlowNode[]): FlowEdge[] {
  let edges: FlowEdge[] = [];

  for (let node of nodes) {
    edges.push(...node.outgoingEdges);
  }

  return edges;
}
