import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";

import { createAssignmentExpression } from "../../estreeFactory";

import {
  Completion,
  EdgeType,
  EnclosingStatementType,
  EnclosingTryStatement,
  FlowNode,
  ParsingContext
} from "../../flow";

export { parseThrowStatement };

function parseThrowStatement(
  throwStatement: ESTree.ThrowStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let throwLabel = "throw " + stringify(throwStatement.argument);
  let enclosingStatements = context.enclosingStatements.enumerateElements();

  let foundHandler = false;

  for (let statement of enclosingStatements) {
    if (statement.type !== EnclosingStatementType.TryStatement) {
      continue;
    }

    let tryStatement = <EnclosingTryStatement>statement;

    if (tryStatement.handler && tryStatement.isCurrentlyInTryBlock) {
      let handlerVariableAssignment = createAssignmentExpression({
        left: tryStatement.handler.param,
        right: throwStatement.argument
      });

      let assignmentNode = context
        .createNode()
        .appendTo(
          currentNode,
          stringify(handlerVariableAssignment),
          handlerVariableAssignment
        );

      tryStatement.handlerBodyEntry.appendEpsilonEdgeTo(assignmentNode);

      foundHandler = true;
      break;
    } else if (
      tryStatement.parseFinalizer &&
      !tryStatement.isCurrentlyInFinalizer
    ) {
      tryStatement.isCurrentlyInFinalizer = true;
      let finalizer = tryStatement.parseFinalizer();
      tryStatement.isCurrentlyInFinalizer = false;

      finalizer.bodyEntry.appendEpsilonEdgeTo(currentNode);

      if (finalizer.bodyCompletion.normal) {
        currentNode = finalizer.bodyCompletion.normal;
      } else {
        return finalizer.bodyCompletion;
      }
    }
  }

  if (!foundHandler) {
    context.currentFlowGraph.errorExit.appendTo(
      currentNode,
      throwLabel,
      throwStatement,
      EdgeType.AbruptCompletion
    );
  }

  return { throw: true };
}
