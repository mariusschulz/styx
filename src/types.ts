module Styx {
    export class ControlFlowGraph {
        entry: FlowNode;

        constructor() {
            this.entry = new FlowNode();
        }
    }

    export class FlowNode {
        outgoingEdges: FlowEdge[];

        constructor() {
            this.outgoingEdges = [];
        }

        addOutgoingEdge(edge: FlowEdge) {
            this.outgoingEdges.push(edge);
        }
    }

    export class FlowEdge {
        target: FlowNode;

        constructor(target: FlowNode) {
            this.target = target;
        }
    }
}
