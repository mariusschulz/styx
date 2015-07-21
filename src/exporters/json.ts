import { FlowProgram } from "../flow";

export { exportJson };

function exportJson(program: FlowProgram): string {
    let nodes = program.flowGraph.nodes.map(node => ({
        id: node.id,
        type: node.type
    }));

    let edges = program.flowGraph.edges.map(edge => ({
        from: edge.source.id,
        to: edge.target.id,
        type: edge.type
    }));

    return JSON.stringify({ nodes, edges }, null, 2);
}
