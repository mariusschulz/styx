import * as ESTree from "../../estree";

export { stringify };

interface ExpressionToStringMap {
  [key: string]: (expression: ESTree.Expression) => string;
}

function stringify(expression: ESTree.Expression): string {
  let stringifiers: ExpressionToStringMap = {
    [ESTree.NodeType.ArrayExpression]: stringifyArrayExpression,
    [ESTree.NodeType.AssignmentExpression]: stringifyAssignmentExpression,
    [ESTree.NodeType.BinaryExpression]: stringifyBinaryExpression,
    [ESTree.NodeType.CallExpression]: stringifyCallExpression,
    [ESTree.NodeType.ConditionalExpression]: stringifyConditionalExpression,
    [ESTree.NodeType.Identifier]: stringifyIdentifier,
    [ESTree.NodeType.Literal]: stringifyLiteral,
    [ESTree.NodeType.LogicalExpression]: stringifyLogicalExpression,
    [ESTree.NodeType.MemberExpression]: stringifyMemberExpression,
    [ESTree.NodeType.NewExpression]: stringifyNewExpression,
    [ESTree.NodeType.ObjectExpression]: stringifyObjectExpression,
    [ESTree.NodeType.SequenceExpression]: stringifySequenceExpression,
    [ESTree.NodeType.ThisExpression]: stringifyThisExpression,
    [ESTree.NodeType.UnaryExpression]: stringifyUnaryExpression,
    [ESTree.NodeType.UpdateExpression]: stringifyUpdateExpression
  };

  let stringifier = stringifiers[expression.type];

  return stringifier ? stringifier(expression) : "<UNEXPECTED>";
}

function stringifyArrayExpression(
  arrayExpression: ESTree.ArrayExpression
): string {
  let stringifiedElements = "";
  let isFirstElement = true;
  let previousElementWasNull = false;

  for (let element of arrayExpression.elements) {
    if (!isFirstElement && !previousElementWasNull) {
      stringifiedElements += ",";
    }

    if (element === null) {
      stringifiedElements += ",";
      previousElementWasNull = true;
    } else {
      stringifiedElements += stringify(element);
      previousElementWasNull = false;
    }

    isFirstElement = false;
  }

  return `[${stringifiedElements}]`;
}

function stringifyAssignmentExpression(
  assignmentExpression: ESTree.AssignmentExpression
): string {
  let left = stringify(assignmentExpression.left);
  let right = stringify(assignmentExpression.right);

  return `${left} ${assignmentExpression.operator} ${right}`;
}

function stringifyBinaryExpression(
  binaryExpression: ESTree.BinaryExpression
): string {
  let left = stringify(binaryExpression.left);
  let right = stringify(binaryExpression.right);

  if (needsParenthesizing(binaryExpression.left)) {
    left = parenthesize(left);
  }

  if (needsParenthesizing(binaryExpression.right)) {
    right = parenthesize(right);
  }

  return `${left} ${binaryExpression.operator} ${right}`;
}

function stringifyCallExpression(
  callExpression: ESTree.CallExpression
): string {
  let callee = stringify(callExpression.callee);
  let args = callExpression.arguments.map(arg => stringify(arg)).join(", ");

  return `${callee}(${args})`;
}

function stringifyConditionalExpression(
  conditionalExpression: ESTree.ConditionalExpression
): string {
  let test = stringify(conditionalExpression.test);
  let consequent = stringify(conditionalExpression.consequent);
  let alternate = stringify(conditionalExpression.alternate);

  if (needsParenthesizing(conditionalExpression.consequent)) {
    consequent = parenthesize(consequent);
  }

  if (needsParenthesizing(conditionalExpression.alternate)) {
    alternate = parenthesize(alternate);
  }

  return `${test} ? ${consequent} : ${alternate}`;
}

function stringifyIdentifier(identifier: ESTree.Identifier): string {
  return identifier.name;
}

function stringifyLiteral(literal: ESTree.Literal): string {
  return literal.raw;
}

function stringifyLogicalExpression(
  logicalExpression: ESTree.LogicalExpression
): string {
  let left = stringify(logicalExpression.left);
  let right = stringify(logicalExpression.right);

  if (needsParenthesizing(logicalExpression.left)) {
    left = parenthesize(left);
  }

  if (needsParenthesizing(logicalExpression.right)) {
    right = parenthesize(right);
  }

  return `${left} ${logicalExpression.operator} ${right}`;
}

function stringifyMemberExpression(
  memberExpression: ESTree.MemberExpression
): string {
  const object = stringify(memberExpression.object);
  const property = stringify(memberExpression.property);

  const left = needsParenthesizing(memberExpression.object)
    ? parenthesize(object)
    : object;

  return memberExpression.computed
    ? `${left}[${property}]`
    : `${left}.${property}`;
}

function stringifyNewExpression(newExpression: ESTree.NewExpression): string {
  let call = stringifyCallExpression(newExpression);

  return `new ${call}`;
}

function stringifyObjectExpression(
  objectExpression: ESTree.ObjectExpression
): string {
  if (objectExpression.properties.length === 0) {
    return "{}";
  }

  const properties = objectExpression.properties
    .map(property => {
      let key = stringify(property.key);
      let value = stringify(property.value);

      return `${key}: ${value}`;
    })
    .join(",\n    ");

  return `{\n    ${properties}\n}`;
}

function stringifySequenceExpression(
  sequenceExpression: ESTree.SequenceExpression
): string {
  let expressions = sequenceExpression.expressions.map(stringify).join(", ");

  return parenthesize(expressions);
}

function stringifyThisExpression(
  thisExpression: ESTree.ThisExpression
): string {
  return "this";
}

function stringifyUnaryExpression(
  unaryExpression: ESTree.UnaryExpression
): string {
  let operator = unaryExpression.operator;
  let argument = stringify(unaryExpression.argument);
  let joiner = operator.length > 1 ? " " : "";

  if (needsParenthesizing(unaryExpression.argument)) {
    argument = parenthesize(argument);
  }

  return unaryExpression.prefix
    ? operator + joiner + argument
    : argument + joiner + operator;
}

function stringifyUpdateExpression(
  updateExpression: ESTree.UpdateExpression
): string {
  return updateExpression.prefix
    ? updateExpression.operator + stringify(updateExpression.argument)
    : stringify(updateExpression.argument) + updateExpression.operator;
}

function needsParenthesizing(expression: ESTree.Expression): boolean {
  switch (expression.type) {
    case ESTree.NodeType.AssignmentExpression:
    case ESTree.NodeType.BinaryExpression:
    case ESTree.NodeType.ConditionalExpression:
    case ESTree.NodeType.LogicalExpression:
      return true;

    default:
      return false;
  }
}

function parenthesize(value: string): string {
  return `(${value})`;
}
