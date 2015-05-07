/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="builder/controlFlowGraphBuilder.ts"/>
/// <reference path="estree.ts"/>
/// <reference path="types.ts"/>

module Styx {
    export function parse(node: ESTree.Node): ControlFlowGraph {
        if (!_.isObject(node) || !node.type) {
            throw Error("Invalid node: 'type' property required");
        }

        if (node.type !== ESTree.NodeType.Program) {
            throw Error(`The node type '${node.type}' is not supported`);
        }

        var program = <ESTree.Program>node;
        var controlFlowGraph = ControlFlowGraphBuilder.constructGraphFor(program);
                    
        return controlFlowGraph;
    }
}
