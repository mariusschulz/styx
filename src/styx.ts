import * as ESTree from "./estree";
import { FlowProgram, ParserOptions } from "./flow";
import * as Parser from "./parser/parser";

export { parse };
export { exportAsDot } from "./exporters/dot";
export { exportAsJson } from "./exporters/json";
export { exportAsObject } from "./exporters/object";
export * from "./flow";

function parse(program: ESTree.Program, options?: ParserOptions): FlowProgram {
  if (!isObject(program) || !program.type) {
    throw Error("'program' must be an object with a 'type' property");
  }

  if (program.type !== ESTree.NodeType.Program) {
    throw Error(`The node type '${program.type}' is not supported`);
  }

  var normalizedOptions = normalizeParserOptions(options);

  return Parser.parse(program, normalizedOptions);
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function normalizeParserOptions(options: ParserOptions): ParserOptions {
  let removeTransitNodes: boolean;
  let rewriteConstantConditionalEdges: boolean;

  if (typeof options === "undefined") {
    removeTransitNodes = true;
    rewriteConstantConditionalEdges = true;
  } else {
    let passes = options.passes;

    removeTransitNodes =
      passes === true || (passes && passes.removeTransitNodes);
    rewriteConstantConditionalEdges =
      passes === true || (passes && passes.rewriteConstantConditionalEdges);
  }

  return {
    passes: {
      removeTransitNodes,
      rewriteConstantConditionalEdges
    }
  };
}
