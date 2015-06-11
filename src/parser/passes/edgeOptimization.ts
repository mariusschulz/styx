/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    export function optimizeEdges(graph: ControlFlowGraph) {
        optimizeNode(graph.entry);
    }
    
    function optimizeNode(node: FlowNode) {
        console.log(`Optimizing node ${node.id} ...`);
        
        if (node.incomingEdges.length === 1 && node.outgoingEdges.length === 1) {
            let [incomingEdge] = node.incomingEdges;
            let [outgoingEdge] = node.outgoingEdges;
            
            if (outgoingEdge.type === EdgeType.Epsilon) {
                incomingEdge.target = outgoingEdge.target;
                node.incomingEdges = [];
                node.outgoingEdges = [];
            }
        }
        
        for (let edge of node.outgoingEdges) {
            optimizeNode(edge.target);
        }
    }
}
