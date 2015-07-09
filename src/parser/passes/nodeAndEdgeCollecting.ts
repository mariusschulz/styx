/// <reference path="../../collections/numericMap.ts" />
/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    export function collectNodesAndEdges(graph: ControlFlowGraph) {
        graph.nodes = collectNodes(graph.entry);
        graph.edges = collectEdges(graph.nodes);
    }

    function collectNodes(graphEntry: FlowNode): FlowNode[] {
        let nodes = Collections.NumericMap.create<FlowNode>();
        walkGraphAndCollectNodes(graphEntry, nodes);

        return nodes.values();
    }

    function walkGraphAndCollectNodes(currentNode: FlowNode, nodes: Collections.NumericMap<FlowNode>) {
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
}
