namespace Styx {
    export interface ControlFlowGraph {
        entry: FlowNode;
    }

    export interface FlowEdge {
        source: FlowNode;
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

        appendTo(node: FlowNode, label: string, edgeType = EdgeType.Normal): FlowNode {
            node.outgoingEdges.push({
                source: node,
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
        Normal = 0,
        Epsilon = 1,
        Conditional = 2,
        AbruptCompletion = 3
    }
}
