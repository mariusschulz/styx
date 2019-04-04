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

export { parseDoWhileStatement };

function parseDoWhileStatement(
  doWhileStatement: ESTree.DoWhileStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  label?: string
): Completion {
  // Truthy test (enter loop)
  let truthyCondition = doWhileStatement.test;
  let truthyConditionLabel = stringify(truthyCondition);

  // Falsy test (exit loop)
  let falsyCondition = negateTruthiness(truthyCondition);
  let falsyConditionLabel = stringify(falsyCondition);

  let testNode = context.createNode();
  let finalNode = context.createNode();

  context.enclosingStatements.push({
    type: EnclosingStatementType.OtherStatement,
    continueTarget: testNode,
    breakTarget: finalNode,
    label: label
  });

  let loopBodyCompletion = parseStatement(
    doWhileStatement.body,
    currentNode,
    context
  );

  context.enclosingStatements.pop();

  currentNode.appendConditionallyTo(
    testNode,
    truthyConditionLabel,
    truthyCondition
  );
  finalNode.appendConditionallyTo(
    testNode,
    falsyConditionLabel,
    falsyCondition
  );

  if (loopBodyCompletion.normal) {
    testNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
  }

  return { normal: finalNode };
}
