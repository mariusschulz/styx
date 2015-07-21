export { exportJson };

import {
    ControlFlowGraph,
    EdgeType,
    FlowProgram,
    NodeType,
} from "../flow";

interface FlatFlowNode {
    id: number;
    type: NodeType;
}

interface FlatFlowEdge {
    from: number;
    to: number;
    type: EdgeType;
}

interface FlatControlFlowGraph {
    nodes: FlatFlowNode[];
    edges: FlatFlowEdge[];
}

function exportJson(flowProgram: FlowProgram): string {
    const program = {
        flowGraph: flattenFlowGraph(flowProgram.flowGraph)
    };

    const functions = flowProgram.functions.map(fun => ({
        id: fun.id,
        name: fun.name,
        flowGraph: flattenFlowGraph(fun.flowGraph)
    }));

    return JSON.stringify({ program, functions }, null, 2);
}

function flattenFlowGraph(flowGraph: ControlFlowGraph): FlatControlFlowGraph {
    const nodes = flowGraph.nodes.map(node => ({
        id: node.id,
        type: node.type
    }));

    const edges = flowGraph.edges.map(edge => ({
        from: edge.source.id,
        to: edge.target.id,
        type: edge.type
    }));

    return { nodes, edges };
}
