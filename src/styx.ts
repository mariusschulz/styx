import * as ESTree from "./estree";
import { FlowProgram, ParserOptions } from "./flow";
import * as Parser from "./parser/parser";

export { parse };
export * from "./flow";

function parse(node: ESTree.Program, options?: ParserOptions): FlowProgram {
    if (!isObject(node) || !node.type) {
        throw Error("'node' must be an object with a 'type' property");
    }

    if (node.type !== ESTree.NodeType.Program) {
        throw Error(`The node type '${node.type}' is not supported`);
    }

    var options = normalizeParserOptions(options || {});

    return Parser.parse(node, options);
}

function isObject(value: any): boolean {
    return typeof value === "object" && value !== null;
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
