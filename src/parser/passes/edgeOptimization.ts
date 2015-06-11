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
        
        let isTransitNode = node.incomingEdges.length === 1 && node.outgoingEdges.length === 1; 
        let isEntryNode = node.id === 1;
        
        if (isTransitNode && !isEntryNode) {
            let outgoingEdge = node.outgoingEdges[0];
            let target = outgoingEdge.target;
            
            if (outgoingEdge.type === EdgeType.Epsilon) {
                let sourceAlreadyConnectedToTarget = false;
                
                for (let incomingTargetEdges of target.incomingEdges) {
                     if (incomingTargetEdges.source.id === node.incomingEdges[0].source.id) {
                         sourceAlreadyConnectedToTarget = true;
                         break;
                     }
                }
                
                if (!sourceAlreadyConnectedToTarget) {                
                    let incomingEdge = node.incomingEdges[0];
                    
                    // Redirect edge
                    incomingEdge.target = target;
                    target.incomingEdges = [incomingEdge];
                    
                    // Clear node
                    node.incomingEdges = [];
                    node.outgoingEdges = [];
                
                    // Recursively optimize
                    optimizeNode(target, optimizedNodes);
                }
            }
        }
        
        for (let edge of node.outgoingEdges) {
            optimizeNode(edge.target, optimizedNodes);
        }
    }
}
