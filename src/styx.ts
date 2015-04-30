///<reference path="../definitions/lodash.d.ts"/>
///<reference path="estree.ts"/>
///<reference path="types.ts"/>

module Styx {
    export function parse(node: ESTree.Node): ControlFlowGraph {
        if (!_.isObject(node) || !node.type) {
            throw Error("Invalid node: 'type' property required");
        }

        if (node.type === ESTree.NodeType.Program) {
            return parseProgram(<ESTree.Program>node);
        }

        throw Error(`The node type '${node.type}' is not supported`);
    }

    function parseProgram(program: ESTree.Program): ControlFlowGraph {
        var cfg = new ControlFlowGraph();
        let currentFlowNode = cfg.entry;

        for (let statement of program.body) {
            if (statement.type === ESTree.NodeType.EmptyStatement) {
                let flowNode = new FlowNode();
                let edge = new FlowEdge(flowNode);
                currentFlowNode.addOutgoingEdge(edge);
                currentFlowNode = flowNode;
            } else {
                throw Error(`Encountered unsupported statement type '${statement.type}'`);
            }
        }

        return cfg;
    }
}
