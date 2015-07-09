/// <reference path="../../util/arrayUtil.ts" />
/// <reference path="../../collections/numericSet.ts" />
/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    interface NodeLookup {
        [nodeId: number]: FlowNode;
        [nodeId: string]: FlowNode;
    }

    export function removeUnreachableNodes(graphEntry: FlowNode) {
        let reachableNodes: NodeLookup = {};
        collectReachableNodes(graphEntry, reachableNodes);

        let unreachableNodes: NodeLookup = {};
        let visitedNodes = Collections.NumericSet.create();

        for (let nodeId of Object.keys(reachableNodes)) {
            collectUnreachableNodes(reachableNodes[nodeId], reachableNodes, unreachableNodes, visitedNodes);
        }

        for (let nodeId of Object.keys(unreachableNodes)) {
            let unreachableNode = unreachableNodes[nodeId];

            if (unreachableNode.type === NodeType.Normal) {
                removeUnreachableNode(unreachableNode);
            }
        }
    }

    function collectReachableNodes(currentNode: FlowNode, reachableNodes: NodeLookup) {
        if (reachableNodes.hasOwnProperty(currentNode.id.toString())) {
            return;
        }

        reachableNodes[currentNode.id] = currentNode;

        for (let outgoingEdge of currentNode.outgoingEdges) {
            collectReachableNodes(outgoingEdge.target, reachableNodes);
        }
    }

    function collectUnreachableNodes(node: FlowNode, reachableNodes: NodeLookup, unreachableNodes: NodeLookup, visitedNodes: Collections.NumericSet) {
        if (visitedNodes.contains(node.id)) {
            return;
        }

        visitedNodes.add(node.id);

        if (!reachableNodes.hasOwnProperty(node.id.toString())) {
            unreachableNodes[node.id] = node;
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
