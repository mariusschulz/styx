import { parseFunctionDeclaration } from "../declarations/function";
import { parseVariableDeclaration } from "../declarations/variable";

import { parseBlockStatement } from "./block";
import { parseBreakStatement, parseContinueStatement } from "./breakContinue";
import { parseDebuggerStatement } from "./debugger";
import { parseDoWhileStatement } from "./doWhile";
import { parseEmptyStatement } from "./empty";
import { parseExpression, parseExpressionStatement } from "./expression";
import { parseForStatement } from "./for";
import { parseForInStatement } from "./forIn";
import { parseIfStatement } from "./if";
import { parseLabeledStatement } from "./labeled";
import { parseReturnStatement } from "./return";
import { parseSwitchStatement } from "./switch";
import { parseThrowStatement } from "./throw";
import { parseTryStatement } from "./try";
import { parseWhileStatement } from "./while";
import { parseWithStatement } from "./with";

import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseStatement, parseStatements };

interface StatementTypeToParserMap {
  [type: string]: (
    statement: ESTree.Statement,
    currentNode: FlowNode,
    context: ParsingContext
  ) => Completion;
}

function parseStatements(
  statements: ESTree.Statement[],
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  for (let statement of statements) {
    let completion = parseStatement(statement, currentNode, context);

    if (!completion.normal) {
      // If we encounter an abrupt completion, normal control flow is interrupted
      // and the following statements aren't executed
      return completion;
    }

    currentNode = completion.normal;
  }

  return { normal: currentNode };
}

function parseStatement(
  statement: ESTree.Statement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  let statementParsers: StatementTypeToParserMap = {
    [ESTree.NodeType.BlockStatement]: parseBlockStatement,
    [ESTree.NodeType.BreakStatement]: parseBreakStatement,
    [ESTree.NodeType.ContinueStatement]: parseContinueStatement,
    [ESTree.NodeType.DebuggerStatement]: parseDebuggerStatement,
    [ESTree.NodeType.DoWhileStatement]: parseDoWhileStatement,
    [ESTree.NodeType.EmptyStatement]: parseEmptyStatement,
    [ESTree.NodeType.ExpressionStatement]: parseExpressionStatement,
    [ESTree.NodeType.ForInStatement]: parseForInStatement,
    [ESTree.NodeType.ForStatement]: parseForStatement,
    [ESTree.NodeType.FunctionDeclaration]: parseFunctionDeclaration,
    [ESTree.NodeType.IfStatement]: parseIfStatement,
    [ESTree.NodeType.LabeledStatement]: parseLabeledStatement,
    [ESTree.NodeType.ReturnStatement]: parseReturnStatement,
    [ESTree.NodeType.SwitchStatement]: parseSwitchStatement,
    [ESTree.NodeType.ThrowStatement]: parseThrowStatement,
    [ESTree.NodeType.TryStatement]: parseTryStatement,
    [ESTree.NodeType.VariableDeclaration]: parseVariableDeclaration,
    [ESTree.NodeType.WhileStatement]: parseWhileStatement,
    [ESTree.NodeType.WithStatement]: parseWithStatement
  };

  let parsingMethod = statementParsers[statement.type];

  if (!parsingMethod) {
    throw Error(`Encountered unsupported statement type "${statement.type}"`);
  }

  return parsingMethod(statement, currentNode, context);
}
