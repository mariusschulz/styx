module Styx {
    export class ControlFlowGraph {
        entry: FlowNode;

        constructor() {
            this.entry = new FlowNode();
        }
    }

    export class FlowNode {
        next: FlowNode[];
    }
}
