module Styx {
    export class ControlFlowGraph {
        entry: FlowNode;
        functionDeclarations: FlowNode[];

        constructor(entry: FlowNode) {
            this.entry = entry;
            this.functionDeclarations = [];
        }
        
        addFunction(functionDeclaration: FlowNode) {
            this.functionDeclarations.push(functionDeclaration);
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

        appendTo(node: FlowNode, label?: string): FlowNode {
            let edge = new FlowEdge(this, label);
            node.addOutgoingEdge(edge);

            return this;
        }
    }

    export class FlowEdge {
        target: FlowNode;
        label: string;

        constructor(target: FlowNode, label?: string) {
            this.target = target;
            this.label = label || "";
        }
    }
}
