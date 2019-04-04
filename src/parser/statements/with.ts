import { stringify } from "../expressions/stringifier";

import { parseStatement } from "./statement";

import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseWithStatement };

function parseWithStatement(
  withStatement: ESTree.WithStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let stringifiedExpression = stringify(withStatement.object);
  let expressionNode = context
    .createNode()
    .appendTo(currentNode, stringifiedExpression, withStatement);

  return parseStatement(withStatement.body, expressionNode, context);
}
