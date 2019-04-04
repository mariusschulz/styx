import { parseVariableDeclaration } from "../declarations/variable";

import { negateTruthiness } from "../expressions/negator";
import { stringify } from "../expressions/stringifier";

import { parseExpression } from "./expression";
import { parseStatement } from "./statement";

import * as ESTree from "../../estree";
import {
  Completion,
  EnclosingStatementType,
  FlowNode,
  ParsingContext
} from "../../flow";

export { parseForStatement };

function parseForStatement(
  forStatement: ESTree.ForStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  label?: string
): Completion {
  let testDecisionNode = parseInit(forStatement.init, currentNode, context)
    .normal;

  // Create nodes for loop cornerstones
  let beginOfLoopBodyNode = context.createNode();
  let updateNode = context.createNode();
  let finalNode = context.createNode();

  if (forStatement.test) {
    // If the loop has a test expression,
    // we need to add truthy and falsy edges
    let truthyCondition = forStatement.test;
    let falsyCondition = negateTruthiness(truthyCondition);

    // Create edges labels
    let truthyConditionLabel = stringify(truthyCondition);
    let falsyConditionLabel = stringify(falsyCondition);

    // Add truthy and falsy edges
    beginOfLoopBodyNode.appendConditionallyTo(
      testDecisionNode,
      truthyConditionLabel,
      truthyCondition
    );
    finalNode.appendConditionallyTo(
      testDecisionNode,
      falsyConditionLabel,
      falsyCondition
    );
  } else {
    // If the loop doesn't have a test expression,
    // the loop body starts unconditionally after the initialization
    beginOfLoopBodyNode.appendEpsilonEdgeTo(testDecisionNode);
  }

  context.enclosingStatements.push({
    type: EnclosingStatementType.OtherStatement,
    continueTarget: updateNode,
    breakTarget: finalNode,
    label: label
  });

  let loopBodyCompletion = parseStatement(
    forStatement.body,
    beginOfLoopBodyNode,
    context
  );

  context.enclosingStatements.pop();

  if (forStatement.update) {
    // If the loop has an update expression,
    // parse it and append it to the end of the loop body
    let endOfUpdateNode = parseExpression(
      forStatement.update,
      updateNode,
      context
    );
    testDecisionNode.appendEpsilonEdgeTo(endOfUpdateNode);
  } else {
    // If the loop doesn't have an update expression,
    // treat the update node as a dummy and point it to the test node
    testDecisionNode.appendEpsilonEdgeTo(updateNode);
  }

  if (loopBodyCompletion.normal) {
    // If we reached the end of the loop body through normal control flow,
    // continue regularly with the update
    updateNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
  }

  return { normal: finalNode };
}

function parseInit(
  init: ESTree.VariableDeclaration | ESTree.Expression,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  if (init === null) {
    return { normal: currentNode };
  }

  if (init.type === ESTree.NodeType.VariableDeclaration) {
    return parseVariableDeclaration(
      <ESTree.VariableDeclaration>init,
      currentNode,
      context
    );
  }

  return {
    normal: parseExpression(<ESTree.Expression>init, currentNode, context)
  };
}
