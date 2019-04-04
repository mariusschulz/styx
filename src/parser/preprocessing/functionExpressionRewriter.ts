import * as ESTree from "../../estree";

import IdGenerator from "../../util/idGenerator";

export { rewriteFunctionExpressions };

interface RewrittenFunction {
  name: string;
  functionExpression: ESTree.FunctionExpression;
}

function rewriteFunctionExpressions(program: ESTree.Program): ESTree.Program {
  let functionIdGenerator = IdGenerator.create();
  let functionExpressionsToRewrite: RewrittenFunction[] = [];

  // We're making use of the built-in `JSON.stringify` method here
  // because it accepts a `replacer` callback as its second parameter.
  // That callback gets passed every key and value that's being stringified
  // and can return a different value that's included in the JSON string
  // instead of the original value.
  //
  // This is a poor man's AST visitor, if you will. The idea is that
  // we can easily detect every AST node of type `FunctionExpression` this way.
  // When we encounter such a function expression, we keep track of it
  // and replace the corresponding AST node by a new unique identifier.
  //
  // After the entire program has been visited, we prepend to the program body
  // a function declaration for every function expression we've encountered.
  let stringifiedProgram = JSON.stringify(program, visitNode);

  // The original program is not modified; instead, a clone is created
  let clonedProgram: ESTree.Program = JSON.parse(stringifiedProgram);

  prependFunctionDeclarationsToProgramBody(
    functionExpressionsToRewrite,
    clonedProgram
  );

  return clonedProgram;

  function visitNode(key: string, value: any): any {
    return value && value.type === ESTree.NodeType.FunctionExpression
      ? rewriteFunctionExpression(value)
      : value;
  }

  function rewriteFunctionExpression(
    functionExpression: ESTree.FunctionExpression
  ): ESTree.Identifier {
    let funcId = functionIdGenerator.generateId();
    let nameSuffix = functionExpression.id
      ? "_" + functionExpression.id.name
      : "";
    let funcName = `$$func${funcId}${nameSuffix}`;

    const stringifiedFunctionExpressionBody = JSON.stringify(
      functionExpression.body,
      visitNode
    );
    let rewrittenFunctionExpression = clone(functionExpression);
    rewrittenFunctionExpression.body = JSON.parse(
      stringifiedFunctionExpressionBody
    );

    functionExpressionsToRewrite.push({
      name: funcName,
      functionExpression: rewrittenFunctionExpression
    });

    return {
      type: ESTree.NodeType.Identifier,
      name: funcName
    };
  }
}

function prependFunctionDeclarationsToProgramBody(
  rewrittenFunctions: RewrittenFunction[],
  program: ESTree.Program
) {
  for (let rewrittenFunc of rewrittenFunctions) {
    let functionDeclaration: ESTree.Function = {
      type: ESTree.NodeType.FunctionDeclaration,
      id: {
        type: ESTree.NodeType.Identifier,
        name: rewrittenFunc.name
      },
      params: clone(rewrittenFunc.functionExpression.params),
      body: clone(rewrittenFunc.functionExpression.body)
    };

    program.body.unshift(functionDeclaration);
  }
}

function clone<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}
