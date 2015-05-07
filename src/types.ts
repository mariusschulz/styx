module Styx {
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

        appendTo(node: FlowNode, ...otherNodes: FlowNode[]): FlowNode {
            let nodes = [node, ...otherNodes];
    
            for (let node of nodes) {
                let edge = new FlowEdge(this);
                node.addOutgoingEdge(edge);
            }
    
            return this;
        }
    }

    export class FlowEdge {
        target: FlowNode;

        constructor(target: FlowNode) {
            this.target = target;
        }
    }
}
