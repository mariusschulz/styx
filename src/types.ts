module Styx {
    export class ControlFlowGraph {
        entry: FlowNode;

        constructor() {
            this.entry = new FlowNode();
        }
    }

    export class FlowNode {
        outgoingEdges: FlowNode[];

        constructor() {
            this.outgoingEdges = [];
        }
    }

    export class FlowEdge {
        target: FlowNode;

        constructor(target: FlowNode) {
            this.target = target;
        }
    }
}
