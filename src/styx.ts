/// <reference path="../definitions/lodash.d.ts"/>
/// <reference path="parser/parser.ts"/>
/// <reference path="estree.ts"/>
/// <reference path="flow.ts"/>

namespace Styx {
    export interface ParserOptions {
        passes?: {
            removeTransitNodes?: boolean,
            rewriteConstantConditionalEdges?: boolean
        }
    }
    
    export function parse(node: ESTree.Node, options: ParserOptions = {}): ControlFlowGraph {
        if (!_.isObject(node) || !node.type) {
            throw Error("Invalid node: 'type' property required");
        }

        if (node.type !== ESTree.NodeType.Program) {
            throw Error(`The node type '${node.type}' is not supported`);
        }
        
        var combinedOptions = combineOptionsWithDefaults(options);
        var parser = new Parser(<ESTree.Program>node, combinedOptions);
                    
        return parser.controlFlowGraph;
    }
    
    function combineOptionsWithDefaults(options: ParserOptions): ParserOptions {
        return {
            passes: {
                removeTransitNodes: options.passes && options.passes.removeTransitNodes,
                rewriteConstantConditionalEdges: options.passes && options.passes.rewriteConstantConditionalEdges
            }
        };
    }
}
