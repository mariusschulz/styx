namespace Styx {
    export class ControlFlowGraph {
        entry: FlowNode;

        constructor(entry: FlowNode) {
            this.entry = entry;
        }
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
            let edge = new FlowEdge(this, edgeType, label);
            node.addOutgoingEdge(edge);

            return this;
        }
        
        appendEpsilonEdgeTo(node: FlowNode): FlowNode {
            return this.appendTo(node, "", EdgeType.Epsilon);
        }
    }

    export class FlowEdge {
        target: FlowNode;
        type: EdgeType;
        label: string;

        constructor(target: FlowNode, type: EdgeType, label: string) {
            this.target = target;
            this.type = type;
            this.label = label;
        }
    }
    
    export const enum EdgeType {
        Normal,
        Epsilon,
        Conditional,
        AbruptCompletion
    }
}
