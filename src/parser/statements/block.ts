import { parseStatements } from "./statement";

import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseBlockStatement };

function parseBlockStatement(
  blockStatement: ESTree.BlockStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  return parseStatements(blockStatement.body, currentNode, context);
}
