import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseExpression, parseExpressionStatement };

function parseExpressionStatement(
  expressionStatement: ESTree.ExpressionStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  return {
    normal: parseExpression(
      expressionStatement.expression,
      currentNode,
      context
    )
  };
}

function parseExpression(
  expression: ESTree.Expression,
  currentNode: FlowNode,
  context: ParsingContext
): FlowNode {
  if (expression.type === ESTree.NodeType.SequenceExpression) {
    return parseSequenceExpression(
      <ESTree.SequenceExpression>expression,
      currentNode,
      context
    );
  }

  return context
    .createNode()
    .appendTo(currentNode, stringify(expression), expression);
}

function parseSequenceExpression(
  sequenceExpression: ESTree.SequenceExpression,
  currentNode: FlowNode,
  context: ParsingContext
): FlowNode {
  for (let expression of sequenceExpression.expressions) {
    currentNode = parseExpression(expression, currentNode, context);
  }

  return currentNode;
}
