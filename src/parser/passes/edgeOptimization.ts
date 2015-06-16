/// <reference path="../../collections/set.ts" />
/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    export function removeTransitNodes(graph: ControlFlowGraph) {
        let optimizedNodes = new Collections.Set<number>();
        optimizeNode(graph.entry, optimizedNodes);
    }
    
    function optimizeNode(node: FlowNode, optimizedNodes: Collections.Set<number>) {
        if (optimizedNodes.contains(node.id)) {
            return;
        }
        
        optimizedNodes.add(node.id);
        
        // We want to simplify transit nodes, but we never remove node #1
        // because it's the entry node of the entire control flow graph
        // and we don't want to mess up references to it
        if (node.incomingEdges.length === 1 &&
            node.outgoingEdges.length === 1 &&
            node.id !== 1) {
            let incomingEdge = node.incomingEdges[0];
            let outgoingEdge = node.outgoingEdges[0];
            
            if (incomingEdge.type === EdgeType.Epsilon ||
                outgoingEdge.type === EdgeType.Epsilon) {
                optimizeTransitNode(node, optimizedNodes);
            }
        }
        
        for (let edge of node.outgoingEdges) {
            optimizeNode(edge.target, optimizedNodes);
        }
    }
    
    function optimizeTransitNode(transitNode: FlowNode, optimizedNodes: Collections.Set<number>) {
        // Remember the transit node's original target
        let originalTarget = transitNode.outgoingEdges[0].target;
        
        if (shouldRemoveTransitNode(transitNode)) {
            removeTransitNode(transitNode);
        }
        
        // Recursively optimize, starting with the original target
        optimizeNode(originalTarget, optimizedNodes);
    }
    
    function shouldRemoveTransitNode(transitNode: FlowNode): boolean {
        let sourceId = transitNode.incomingEdges[0].source.id;
        let target = transitNode.outgoingEdges[0].target;
        
        for (let incomingTargetEdges of target.incomingEdges) {
            // We only simplify transit nodes if their removal doesn't lead
            // to a node being directly connected to another node by 2 edges
            if (incomingTargetEdges.source.id === sourceId) {
                return false;
            }
        }
        
        return true;
    }
    
    function removeTransitNode(transitNode: FlowNode) {
        let incomingEdge = transitNode.incomingEdges[0];
        let outgoingEdge = transitNode.outgoingEdges[0];
        
        let source = incomingEdge.source;
        let target = outgoingEdge.target;
        
        // Decide whether to keep the incoming or the outgoing edge.
        // If both are epsilon edges, it doesn't matter which one to keep.
        let survivingEdge = incomingEdge.type === EdgeType.Epsilon ? outgoingEdge : incomingEdge;
        
        // Redirect surviving edge
        survivingEdge.source = source;
        survivingEdge.target = target;
        
        // Make the surviving edge the only incoming/outgoing edge
        source.outgoingEdges = [survivingEdge];
        target.incomingEdges = [survivingEdge];
        
        // Clear node
        transitNode.incomingEdges = [];
        transitNode.outgoingEdges = [];
    }
}
