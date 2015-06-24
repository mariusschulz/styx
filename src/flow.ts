namespace Styx {
    export interface FlowProgram {
        flowGraph: ControlFlowGraph;
        functions: FlowFunction[];
    }

    export interface FlowFunction {
        id: number;
        name: string;
        flowGraph: ControlFlowGraph;
    }
    
    export interface ControlFlowGraph {
        entry: FlowNode;
        successExit: FlowNode;
    }
    
    export interface FlowEdge {
        source: FlowNode;
        target: FlowNode;
        type: EdgeType;
        label: string;
        data: ESTree.Expression;
    }

    export class FlowNode {
        id: number;
        isEntryNode: boolean;
        incomingEdges: FlowEdge[];
        outgoingEdges: FlowEdge[];

        constructor(id: number) {
            this.id = id;
            this.isEntryNode = false;
            this.incomingEdges = [];
            this.outgoingEdges = [];
        }

        appendTo(node: FlowNode, label: string, edgeType = EdgeType.Normal, edgeData: ESTree.Expression = null): FlowNode {
            let edge: FlowEdge = {
                source: node,
                target: this,
                type: edgeType,
                label: label,
                data: edgeData
            };
            
            node.outgoingEdges.push(edge);
            this.incomingEdges.push(edge);

            return this;
        }
        
        appendConditionallyTo(node: FlowNode, label: string, condition: ESTree.Expression): FlowNode {
            return this.appendTo(node, label, EdgeType.Conditional, condition);
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
