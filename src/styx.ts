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
    
    export function parse(node: ESTree.Node, options?: ParserOptions): FlowProgram {
        if (!isObject(node) || !node.type) {
            throw Error("'node' must be an object with a 'type' property");
        }

        if (node.type !== ESTree.NodeType.Program) {
            throw Error(`The node type '${node.type}' is not supported`);
        }
        
        var combinedOptions = normalizeParserOptions(options || {});
        var parser = new Parser(<ESTree.Program>node, combinedOptions);
        
        return parser.program;
    }
    
    function isObject(value: any): boolean {
        return typeof value === "object" && !!value;
    }
    
    function normalizeParserOptions(options: ParserOptions): ParserOptions {
        let passes = options.passes;
        
        return {
            passes: {
                removeTransitNodes: passes === true || passes && passes.removeTransitNodes,
                rewriteConstantConditionalEdges: passes === true || passes && passes.rewriteConstantConditionalEdges
            }
        };
    }
}
