/// <reference path="../../collections/set.ts" />
/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    export function optimizeEdges(graph: ControlFlowGraph) {
        let optimizedNodes = new Collections.Set<number>();
        optimizeNode(graph.entry, optimizedNodes);
    }
    
    function optimizeNode(node: FlowNode, optimizedNodes: Collections.Set<number>) {
        if (optimizedNodes.contains(node.id)) {
            return;
        }
        
        optimizedNodes.add(node.id);
        
        let hasSingleOutgoingEpsilonEdge = node.outgoingEdges.length === 1 &&
            node.outgoingEdges[0].type === EdgeType.Epsilon;
            
        let isEntryNode = node.id === 1;
        let isTransitNode = node.incomingEdges.length === 1 && hasSingleOutgoingEpsilonEdge; 
        
        if (!isEntryNode && isTransitNode) {
            optimizeTransitNode(node, optimizedNodes);
        }
        
        for (let edge of node.outgoingEdges) {
            optimizeNode(edge.target, optimizedNodes);
        }
    }
    
    function optimizeTransitNode(node: FlowNode, optimizedNodes: Collections.Set<number>) {
        let outgoingEdge = node.outgoingEdges[0];
        let target = outgoingEdge.target;
        
        // We only simplify transit nodes if their removal doesn't lead
        // to a node being directly connected to another node by 2 edges
        if (!isNodeConnectedToTarget(node, target)) {
            mergeIncomingAndOutgoingEdgeOf(node);
        }
        
        // Recursively optimize
        optimizeNode(target, optimizedNodes);
    }
    
    function isNodeConnectedToTarget(node: FlowNode, target: FlowNode): boolean {
        let sourceId = node.incomingEdges[0].source.id;
        
        for (let incomingTargetEdges of target.incomingEdges) {
             if (incomingTargetEdges.source.id === sourceId) {
                 return true;
             }
        }
        
        return false;
    }
    
    function mergeIncomingAndOutgoingEdgeOf(node: FlowNode) {
        let incomingEdge = node.incomingEdges[0];
        let outgoingEdge = node.outgoingEdges[0];
        let target = outgoingEdge.target;
        
        // Redirect edge
        incomingEdge.target = target;
        target.incomingEdges = [incomingEdge];
        
        // Clear node
        node.incomingEdges = [];
        node.outgoingEdges = [];
    }
}
