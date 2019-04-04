import * as ESTree from "../../estree";

import {
  createLiteral,
  createUnaryNegationExpression
} from "../../estreeFactory";

export { negateTruthiness };

let equalityComparisonOperators = ["==", "===", "!=", "!=="];

function negateTruthiness(expression: ESTree.Expression): ESTree.Expression {
  if (expression.type === ESTree.NodeType.Literal) {
    let literal = <ESTree.Literal>expression;

    if (typeof literal.value === "boolean") {
      return createLiteral(!literal.value);
    }
  } else if (expression.type === ESTree.NodeType.UnaryExpression) {
    let unaryExpression = <ESTree.UnaryExpression>expression;

    if (unaryExpression.operator === "!") {
      return unaryExpression.argument;
    }
  } else if (expression.type === ESTree.NodeType.BinaryExpression) {
    let binaryExpression = <ESTree.BinaryExpression>expression;

    if (equalityComparisonOperators.indexOf(binaryExpression.operator) > -1) {
      return invertEqualityComparisonOperator(binaryExpression);
    }
  } else if (expression.type === ESTree.NodeType.LogicalExpression) {
    return invertLogicalExpression(<ESTree.LogicalExpression>expression);
  }

  return createUnaryNegationExpression(expression);
}

function invertEqualityComparisonOperator(
  binaryExpression: ESTree.BinaryExpression
): ESTree.BinaryExpression {
  let isNegated = binaryExpression.operator.charAt(0) === "!";
  let firstCharOfInvertedOperator = isNegated ? "=" : "!";
  let restOfInvertedOperator = binaryExpression.operator.substr(1);

  return {
    type: ESTree.NodeType.BinaryExpression,
    operator: firstCharOfInvertedOperator + restOfInvertedOperator,
    left: binaryExpression.left,
    right: binaryExpression.right
  };
}

function invertLogicalExpression(
  logicalExpression: ESTree.LogicalExpression
): ESTree.LogicalExpression {
  // The only two logical operators are && and ||
  let invertedOperator = logicalExpression.operator === "&&" ? "||" : "&&";

  return {
    type: ESTree.NodeType.LogicalExpression,
    operator: invertedOperator,

    // Perform simplification according to De Morgan's laws
    left: negateTruthiness(logicalExpression.left),
    right: negateTruthiness(logicalExpression.right)
  };
}
