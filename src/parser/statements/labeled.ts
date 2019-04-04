import { parseDoWhileStatement } from "./doWhile";
import { parseForStatement } from "./for";
import { parseForInStatement } from "./forIn";
import { parseSwitchStatement } from "./switch";
import { parseWhileStatement } from "./while";

import { parseStatement } from "./statement";

import * as ESTree from "../../estree";
import {
  Completion,
  EnclosingStatement,
  EnclosingStatementType,
  FlowNode,
  ParsingContext
} from "../../flow";

export { parseLabeledStatement };

function parseLabeledStatement(
  labeledStatement: ESTree.LabeledStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let body = labeledStatement.body;
  let label = labeledStatement.label.name;

  switch (body.type) {
    case ESTree.NodeType.BlockStatement:
    case ESTree.NodeType.IfStatement:
    case ESTree.NodeType.TryStatement:
    case ESTree.NodeType.WithStatement:
      return parseLabeledEnclosingStatement(
        labeledStatement,
        currentNode,
        context,
        label
      );

    case ESTree.NodeType.SwitchStatement:
      return parseSwitchStatement(
        <ESTree.SwitchStatement>body,
        currentNode,
        context,
        label
      );

    case ESTree.NodeType.WhileStatement:
      return parseWhileStatement(
        <ESTree.WhileStatement>body,
        currentNode,
        context,
        label
      );

    case ESTree.NodeType.DoWhileStatement:
      return parseDoWhileStatement(
        <ESTree.DoWhileStatement>body,
        currentNode,
        context,
        label
      );

    case ESTree.NodeType.ForStatement:
      return parseForStatement(
        <ESTree.ForStatement>body,
        currentNode,
        context,
        label
      );

    case ESTree.NodeType.ForInStatement:
      return parseForInStatement(
        <ESTree.ForInStatement>body,
        currentNode,
        context,
        label
      );

    default:
      // If we didn't encounter an enclosing statement,
      // the label is irrelevant for control flow and we thus don't track it.
      return parseStatement(body, currentNode, context);
  }
}

function parseLabeledEnclosingStatement(
  labeledStatement: ESTree.LabeledStatement,
  currentNode: FlowNode,
  context: ParsingContext,
  label: string
): Completion {
  let finalNode = context.createNode();

  let enclosingStatement: EnclosingStatement = {
    type: EnclosingStatementType.OtherStatement,
    breakTarget: finalNode,
    continueTarget: null,
    label: label
  };

  context.enclosingStatements.push(enclosingStatement);
  let bodyCompletion = parseStatement(
    labeledStatement.body,
    currentNode,
    context
  );
  context.enclosingStatements.pop();

  if (bodyCompletion.normal) {
    finalNode.appendEpsilonEdgeTo(bodyCompletion.normal);
    return { normal: finalNode };
  }

  return bodyCompletion;
}
