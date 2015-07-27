export { exportJson };

import {
    ControlFlowGraph,
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
        type: stringifyNodeType(node.type)
    }));

    const edges = flowGraph.edges.map(edge => ({
        from: edge.source.id,
        to: edge.target.id,
        type: edge.type
    }));

    return { nodes, edges };
}

function stringifyNodeType(nodeType: NodeType): string {
    switch (nodeType) {
        case NodeType.Entry: return "entry";
        case NodeType.ErrorExit: return "error_exit";
        case NodeType.Normal: return "normal";
        case NodeType.SuccessExit: return "success_exit";
        default: throw Error(`Unknown node type "${nodeType}"`);
    }
}
