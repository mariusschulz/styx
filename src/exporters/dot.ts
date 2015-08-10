export { exportAsDot };

import {
    ControlFlowGraph,
    EdgeType,
    FlowEdge,
    FlowNode,
    FlowProgram,
    NodeType
} from "../flow";

import { partition } from "../util/ArrayUtil";

function exportAsDot(flowGraph: ControlFlowGraph, graphName: string): string {
    return computeDotLines(flowGraph, graphName).join("\n");
}

function computeDotLines(flowGraph: ControlFlowGraph, graphName: string): string[] {
    let entryAndExitNodeList = flowGraph.nodes
        .filter(isExitNode)
        .map(node => node.id)
        .join(" ");

    let [conditionalEdges, unconditionalEdges] = partition(flowGraph.edges,
        edge => edge.type === EdgeType.Conditional);

    let innerLines = [
        `node [shape = doublecircle] ${entryAndExitNodeList}`,
        "node [shape = circle]",
        "",
        "// Unconditional edges",
        ...unconditionalEdges.map(formatEdge)
    ];

    if (conditionalEdges.length > 0) {
        innerLines.push(
            "",
            "// Conditional edges",
            "edge [color = orange, fontcolor = orange]",
            ...conditionalEdges.map(formatEdge)
        );
    }

    return [
        `// ${graphName}`,
        "digraph control_flow_graph {",
        ...innerLines.map(indent),
        "}"
    ];
}

function isExitNode(node: FlowNode): boolean {
    return node.type === NodeType.ErrorExit
        || node.type === NodeType.SuccessExit;
}

function indent(line: string): string {
    return "    " + line;
}

function formatEdge(edge: FlowEdge): string {
    const from = edge.source.id;
    const to = edge.target.id;
    const escapedLabel = escapeDoubleQuotes(edge.label);
    const attributes = edge.label ? ` [label = " ${escapedLabel}"]` : "";

    return `${from} -> ${to}${attributes}`;
}

function escapeDoubleQuotes(value: string): string {
    return value.replace(/"/g, "\\\"");
}
