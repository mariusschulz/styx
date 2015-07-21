export { exportDot };

import {
    ControlFlowGraph,
    EdgeType,
    FlowProgram,
    NodeType,
} from "../flow";

function exportDot(flowProgram: FlowProgram, functionId = 0): string {
    const flowGraph = findFlowGraphForId(flowProgram, functionId);

    let output = "";

    return output;
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
