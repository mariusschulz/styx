///<reference path="../definitions/lodash.d.ts"/>
///<reference path="estree.ts"/>
///<reference path="types.ts"/>

module Styx {
    export function parse(node: ESTree.Node): ControlFlowGraph {
        if (!_.isObject(node) || !node.type) {
            throw Error("Invalid node: 'type' property required");
        }

        if (node.type === "Program") {
            return parseProgram(<ESTree.Program>node);
        }

        throw Error(`The node type '${node.type}' is not supported`);
    }

    function parseProgram(program: ESTree.Program): ControlFlowGraph {
        return new ControlFlowGraph();
    }
}
