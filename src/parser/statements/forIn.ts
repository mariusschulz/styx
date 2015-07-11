import { stringify } from "../expressions/stringifier";

import { parseStatement } from "../parser";

import * as ESTree from "../../estree";
import {
    Completion,
    EnclosingStatementType,
    FlowNode,
    ParsingContext
} from "../../flow";

export { parseForInStatement };

function parseForInStatement(forInStatement: ESTree.ForInStatement, currentNode: FlowNode, context: ParsingContext, label?: string): Completion {
    let stringifiedRight = stringify(forInStatement.right);

    let variableDeclarator = forInStatement.left.declarations[0];
    let variableName = variableDeclarator.id.name;

    let conditionNode = context.createNode()
        .appendTo(currentNode, stringifiedRight);

    let startOfLoopBody = context.createNode()
        .appendConditionallyTo(conditionNode, `${variableName} = <next>`, forInStatement.right);

    let finalNode = context.createNode()
        .appendConditionallyTo(conditionNode, "<no more>", null);

    context.enclosingStatements.push({
        type: EnclosingStatementType.OtherStatement,
        breakTarget: finalNode,
        continueTarget: conditionNode,
        label: label
    });

    let loopBodyCompletion = parseStatement(forInStatement.body, startOfLoopBody, context);

    context.enclosingStatements.pop();

    if (loopBodyCompletion.normal) {
        conditionNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
    }

    return { normal: finalNode };
}
