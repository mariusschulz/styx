import { negateTruthiness } from "../expressions/negator";
import { stringify } from "../expressions/stringifier";

import { parseStatement } from "./statement";

import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseIfStatement };

interface StatementTypeToParserMap {
  [type: string]: (
    statement: ESTree.Statement,
    currentNode: FlowNode,
    context: ParsingContext
  ) => Completion;
}

function parseIfStatement(
  ifStatement: ESTree.IfStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  return ifStatement.alternate === null
    ? parseSimpleIfStatement(ifStatement, currentNode, context)
    : parseIfElseStatement(ifStatement, currentNode, context);
}

function parseSimpleIfStatement(
  ifStatement: ESTree.IfStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let negatedTest = negateTruthiness(ifStatement.test);

  let thenLabel = stringify(ifStatement.test);
  let elseLabel = stringify(negatedTest);

  let thenNode = context
    .createNode()
    .appendConditionallyTo(currentNode, thenLabel, ifStatement.test);

  let thenBranchCompletion = parseStatement(
    ifStatement.consequent,
    thenNode,
    context
  );

  let finalNode = context
    .createNode()
    .appendConditionallyTo(currentNode, elseLabel, negatedTest);

  if (thenBranchCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(thenBranchCompletion.normal);
  }

  return { normal: finalNode };
}

function parseIfElseStatement(
  ifStatement: ESTree.IfStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  // Then branch
  let thenLabel = stringify(ifStatement.test);
  let thenNode = context
    .createNode()
    .appendConditionallyTo(currentNode, thenLabel, ifStatement.test);
  let thenBranchCompletion = parseStatement(
    ifStatement.consequent,
    thenNode,
    context
  );

  // Else branch
  let negatedTest = negateTruthiness(ifStatement.test);
  let elseLabel = stringify(negatedTest);
  let elseNode = context
    .createNode()
    .appendConditionallyTo(currentNode, elseLabel, negatedTest);
  let elseBranchCompletion = parseStatement(
    ifStatement.alternate,
    elseNode,
    context
  );

  let finalNode = context.createNode();

  if (thenBranchCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(thenBranchCompletion.normal);
  }

  if (elseBranchCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(elseBranchCompletion.normal);
  }

  return { normal: finalNode };
}
