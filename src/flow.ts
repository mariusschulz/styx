namespace Styx {
    export interface ControlFlowGraph {
        entry: FlowNode;
    }

    export interface FlowEdge {
        target: FlowNode;
        type: EdgeType;
        label: string;
    }

    export class FlowNode {
        id: number;
        outgoingEdges: FlowEdge[];

        constructor(id: number) {
            this.id = id;
            this.outgoingEdges = [];
        }

        addOutgoingEdge(edge: FlowEdge) {
            this.outgoingEdges.push(edge);
        }

        appendTo(node: FlowNode, label: string, edgeType = EdgeType.Normal): FlowNode {
            node.addOutgoingEdge({
                target: this,
                type: edgeType,
                label: label
            });

            return this;
        }
        
        appendEpsilonEdgeTo(node: FlowNode): FlowNode {
            return this.appendTo(node, "", EdgeType.Epsilon);
        }
    }
    
    export const enum EdgeType {
        Normal,
        Epsilon,
        Conditional,
        AbruptCompletion
    }
}
