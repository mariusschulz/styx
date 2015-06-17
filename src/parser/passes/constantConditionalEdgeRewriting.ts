/// <reference path="../../collections/set.ts" />
/// <reference path="../../util/arrayUtil.ts" />
/// <reference path="../../flow.ts" />

namespace Styx.Passes {
    export function rewriteConstantConditionalEdges(graph: ControlFlowGraph) {
        let visitedNodes = new Collections.Set<number>();
        visitNode(graph.entry, visitedNodes);
    }
    
    function visitNode(node: FlowNode, visitedNodes: Collections.Set<number>) {
        if (visitedNodes.contains(node.id)) {
            return;
        }
        
        visitedNodes.add(node.id);
        
        for (let edge of node.outgoingEdges) {
            inspectEdge(edge);
            visitNode(edge.target, visitedNodes);
        }
    }
    
    function inspectEdge(edge: FlowEdge) {
        if (edge.type !== EdgeType.Conditional) {
            // We only deal with conditional edges in this pass 
            return;
        }
        
        if (edge.data.type === ESTree.NodeType.Literal) {
            let literal = <ESTree.Literal>edge.data;
            
            if (literal.value) {
                // Conditional edges with a constant truthy test are always taken;
                // we can therefore turn them into simple epsilon edges
                turnEdgeIntoEpsilonEdge(edge);
            } else {
                // Conditional edges with a constant falsy test are never taken;
                // we thus remove them entirely
                removeEdge(edge);
            }
        }
    }
    
    function turnEdgeIntoEpsilonEdge(edge: FlowEdge) {
        edge.type = EdgeType.Epsilon;
        edge.label = "";
        edge.data = null;
    }
    
    function removeEdge(edge: FlowEdge) {
        Util.Arrays.removeElementFromArray(edge, edge.source.outgoingEdges);
        Util.Arrays.removeElementFromArray(edge, edge.target.incomingEdges);
    }
}
