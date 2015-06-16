/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="parser/parser.ts"/>
/// <reference path="estree.ts"/>
/// <reference path="flow.ts"/>

namespace Styx {
    export interface ParserOptions {
        passes?: {
            removeTransitNodes?: boolean
        }
    }
    
    export function parse(node: ESTree.Node, options?: ParserOptions): ControlFlowGraph {
        if (!_.isObject(node) || !node.type) {
            throw Error("Invalid node: 'type' property required");
        }

        if (node.type !== ESTree.NodeType.Program) {
            throw Error(`The node type '${node.type}' is not supported`);
        }

        var program = <ESTree.Program>node;
        var parser = new Parser(program, options);
                    
        return parser.controlFlowGraph;
    }
}
