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
        if (!isObject(node) || !node.type) {
            throw Error("'node' must be an object with a 'type' property");
        }

        if (node.type !== ESTree.NodeType.Program) {
            throw Error(`The node type '${node.type}' is not supported`);
        }
        
        var combinedOptions = combineOptionsWithDefaults(options);
        var parser = new Parser(<ESTree.Program>node, combinedOptions);
                    
        return parser.controlFlowGraph;
    }
    
    function isObject(value: any): boolean {
        return typeof value === "object" && !!value;
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
