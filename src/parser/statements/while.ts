import { negateTruthiness } from "../expressions/negator";
import { stringify } from "../expressions/stringifier";

import { parseStatement } from "./statement";

import * as ESTree from "../../estree";
import {
  Completion,
  EnclosingStatementType,
  FlowNode,
  ParsingContext
} from "../../flow";

export { parseWhileStatement };

function parseWhileStatement(
  whileStatement: ESTree.WhileStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  label?: string
): Completion {
  // Truthy test (enter loop)
  let truthyCondition = whileStatement.test;
  let truthyConditionLabel = stringify(truthyCondition);

  // Falsy test (exit loop)
  let falsyCondition = negateTruthiness(truthyCondition);
  let falsyConditionLabel = stringify(falsyCondition);

  let loopBodyNode = context
    .createNode()
    .appendConditionallyTo(currentNode, truthyConditionLabel, truthyCondition);
  let finalNode = context.createNode();

  context.enclosingStatements.push({
    type: EnclosingStatementType.OtherStatement,
    continueTarget: currentNode,
    breakTarget: finalNode,
    label: label
  });

  let loopBodyCompletion = parseStatement(
    whileStatement.body,
    loopBodyNode,
    context
  );

  if (loopBodyCompletion.normal) {
    currentNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
  }

  context.enclosingStatements.pop();

  finalNode.appendConditionallyTo(
    currentNode,
    falsyConditionLabel,
    falsyCondition
  );

  return { normal: finalNode };
}
