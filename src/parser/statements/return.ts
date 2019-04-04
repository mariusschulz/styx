import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";
import {
  Completion,
  EdgeType,
  EnclosingStatementType,
  EnclosingTryStatement,
  FlowNode,
  ParsingContext
} from "../../flow";

export { parseReturnStatement };

function parseReturnStatement(
  returnStatement: ESTree.ReturnStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let argument = returnStatement.argument
    ? stringify(returnStatement.argument)
    : "undefined";
  let returnLabel = `return ${argument}`;

  let finalizerCompletion = runFinalizersBeforeReturn(currentNode, context);

  if (!finalizerCompletion.normal) {
    return finalizerCompletion;
  }

  context.currentFlowGraph.successExit.appendTo(
    finalizerCompletion.normal,
    returnLabel,
    returnStatement,
    EdgeType.AbruptCompletion
  );

  return { return: true };
}

function runFinalizersBeforeReturn(
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let enclosingTryStatements = <EnclosingTryStatement[]>(
    context.enclosingStatements
      .enumerateElements()
      .filter(
        statement => statement.type === EnclosingStatementType.TryStatement
      )
  );

  for (let tryStatement of enclosingTryStatements) {
    if (tryStatement.parseFinalizer && !tryStatement.isCurrentlyInFinalizer) {
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

  return { normal: currentNode };
}
