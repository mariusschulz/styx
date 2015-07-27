export { exportJson };

import {
    ControlFlowGraph,
    EdgeType,
    FlowProgram,
    NodeType
} from "../flow";

const REPLACER: any = null;
const INDENTATION_STRING = "  ";

function exportJson(flowProgram: FlowProgram): string {
    const program = {
        flowGraph: flattenFlowGraph(flowProgram.flowGraph)
    };

    const functions = flowProgram.functions.map(fun => ({
        id: fun.id,
        name: fun.name,
        flowGraph: flattenFlowGraph(fun.flowGraph)
    }));

    return JSON.stringify({ program, functions }, REPLACER, INDENTATION_STRING);
}

function flattenFlowGraph(flowGraph: ControlFlowGraph) {
    const nodes = flowGraph.nodes.map(node => ({
        id: node.id,
        type: NodeType[node.type]
    }));

    const edges = flowGraph.edges.map(edge => ({
        from: edge.source.id,
        to: edge.target.id,
        type: EdgeType[edge.type],
        label: edge.label,
        data: edge.data
    }));

    return { nodes, edges };
}
