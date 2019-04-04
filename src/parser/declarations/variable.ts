import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";
import { createAssignmentExpression } from "../../estreeFactory";

import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseVariableDeclaration };

function parseVariableDeclaration(
  declaration: ESTree.VariableDeclaration,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  for (let declarator of declaration.declarations) {
    let declarationExpression = declarator.init
      ? createAssignmentExpressionFrom(declarator)
      : declarator.id;

    currentNode = context
      .createNode()
      .appendTo(currentNode, stringify(declarationExpression), declarator);
  }

  return { normal: currentNode };
}

function createAssignmentExpressionFrom(
  declarator: ESTree.VariableDeclarator
): ESTree.Expression {
  return createAssignmentExpression({
    left: declarator.id,
    right: declarator.init
  });
}
