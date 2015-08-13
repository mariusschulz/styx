import * as ESTree from "./estree";
import * as Parser from "./parser/parser";

import {
    EdgeType,
    FlowNode,
    FlowProgram,
    NodeType,
    ParserOptions
} from "./flow";

import { exportAsDot } from "./exporters/dot";
import { exportAsJson } from "./exporters/json";
import { exportAsObject } from "./exporters/object";

export default {
    parse,
    exportAsDot,
    exportAsJson,
    exportAsObject,
    EdgeType,
    FlowNode,
    NodeType
};

function parse(program: ESTree.Program, options?: ParserOptions): FlowProgram {
    if (!isObject(program) || !program.type) {
        throw Error("'program' must be an object with a 'type' property");
    }

    if (program.type !== ESTree.NodeType.Program) {
        throw Error(`The node type '${program.type}' is not supported`);
    }

    var options = normalizeParserOptions(options || {});

    return Parser.parse(program, options);
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
