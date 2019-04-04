export { exportAsObject };

import { ControlFlowGraph, EdgeType, FlowProgram, NodeType } from "../flow";

function exportAsObject(flowProgram: FlowProgram) {
  let program = {
    flowGraph: flattenFlowGraph(flowProgram.flowGraph)
  };

  let functions = flowProgram.functions.map(fun => ({
    id: fun.id,
    name: fun.name,
    flowGraph: flattenFlowGraph(fun.flowGraph)
  }));

  return { program, functions };
}

function flattenFlowGraph(flowGraph: ControlFlowGraph) {
  let nodes = flowGraph.nodes.map(node => ({
    id: node.id,
    type: NodeType[node.type]
  }));

  let edges = flowGraph.edges.map(edge => ({
    from: edge.source.id,
    to: edge.target.id,
    type: EdgeType[edge.type],
    label: edge.label,
    data: edge.data
  }));

  return { nodes, edges };
}
