/// <reference path="../../util/arrayUtil.ts" />
/// <reference path="../../collections/numericMap.ts" />
/// <reference path="../../collections/numericSet.ts" />
/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    export function removeUnreachableNodes(graph: ControlFlowGraph) {
        // First, traverse the graph following only outgoing edges
        // to find and collect all reachable nodes
        let reachableNodes = Collections.NumericMap.create<FlowNode>();
        collectReachableNodes(graph.entry, reachableNodes);

        // Now, traverse the entire graph following edges in both directions
        // to find and collect all unreachable nodes
        let unreachableNodes = Collections.NumericMap.create<FlowNode>();
        let visitedNodes = Collections.NumericSet.create();

        for (let { value: reachableNode } of reachableNodes.entries()) {
            collectUnreachableNodes(reachableNode, reachableNodes, unreachableNodes, visitedNodes);
        }

        // Finally, delete unreachable (normal) nodes and their edges
        for (let { value: unreachableNode } of unreachableNodes.entries()) {
            if (unreachableNode.type === NodeType.Normal) {
                removeUnreachableNode(unreachableNode);
            }
        }
    }

    function collectReachableNodes(currentNode: FlowNode, reachableNodes: Collections.NumericMap<FlowNode>) {
        if (reachableNodes.containsKey(currentNode.id)) {
            return;
        }

        reachableNodes.set(currentNode.id, currentNode);

        for (let outgoingEdge of currentNode.outgoingEdges) {
            collectReachableNodes(outgoingEdge.target, reachableNodes);
        }
    }

    function collectUnreachableNodes(node: FlowNode,
        reachableNodes: Collections.NumericMap<FlowNode>,
        unreachableNodes: Collections.NumericMap<FlowNode>,
        visitedNodes: Collections.NumericSet) {
        if (visitedNodes.contains(node.id)) {
            return;
        }

        visitedNodes.add(node.id);

        if (!reachableNodes.containsKey(node.id)) {
            unreachableNodes.set(node.id, node);
        }

        for (let incomingEdge of node.incomingEdges) {
            collectUnreachableNodes(incomingEdge.source, reachableNodes, unreachableNodes, visitedNodes);
        }

        for (let outgoingEdge of node.outgoingEdges) {
            collectUnreachableNodes(outgoingEdge.target, reachableNodes, unreachableNodes, visitedNodes);
        }
    }

    function removeUnreachableNode(node: FlowNode) {
        for (let incomingEdge of node.incomingEdges) {
            Util.Arrays.removeElementFromArray(incomingEdge, incomingEdge.source.outgoingEdges);
        }

        for (let outgoingEdge of node.outgoingEdges) {
            Util.Arrays.removeElementFromArray(outgoingEdge, outgoingEdge.target.incomingEdges);
        }

        node.incomingEdges = [];
        node.outgoingEdges = [];
    }
}
