export { exportDot };

import {
    ControlFlowGraph,
    FlowEdge,
    FlowProgram
} from "../flow";

const INDENT = "    ";

function exportDot(flowProgram: FlowProgram, functionId = 0): string {
    const flowGraph = findFlowGraphForId(flowProgram, functionId);

    let edgeLines = flowGraph.edges.map(formatEdge).map(indent);

    let outputLines = [
        "digraph control_flow_graph {",
        ...edgeLines,
        "}"
    ];

    return outputLines.join("\n");
}

function indent(line: string): string {
    return INDENT + line;
}

function formatEdge(edge: FlowEdge): string {
    return `${edge.source.id} -> ${edge.target.id} [ label = "${edge.label}" ]`;
}

function findFlowGraphForId(flowProgram: FlowProgram, functionId: number): ControlFlowGraph {
    if (!functionId) {
        return flowProgram.flowGraph;
    }

    for (let fun of flowProgram.functions) {
        if (fun.id === functionId) {
            return fun.flowGraph;
        }
    }

    throw Error(`Couldn't find function with id ${functionId}`);
}
