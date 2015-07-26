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

export { parseForInStatement };


function parseForInStatement(forInStatement: ESTree.ForInStatement, currentNode: FlowNode, context: ParsingContext, label?: string): Completion {
    const iteratorFunctionIdentifier = createIdentifier("$$iterator");
    const iteratorCall = createCallExpression(iteratorFunctionIdentifier, [forInStatement.right])

    const iteratorName = context.createTemporaryLocalVariableName("iter");
    const iteratorIdentifier = createIdentifier(iteratorName);
    const iteratorAssignment = createAssignmentExpression({
        left: iteratorIdentifier,
        right: iteratorCall
    });

    const conditionNode = context.createNode()
        .appendTo(currentNode, stringify(iteratorAssignment));

    const isDoneExpression: ESTree.MemberExpression = {
        type: ESTree.NodeType.MemberExpression,
        computed: false,
        object: iteratorIdentifier,
        property: createIdentifier("done")
    };

    const isNotDoneExpression = negateTruthiness(isDoneExpression);

    const startOfLoopBody = context.createNode()
        .appendConditionallyTo(conditionNode, stringify(isNotDoneExpression), isNotDoneExpression);

    const finalNode = context.createNode()
        .appendConditionallyTo(conditionNode, stringify(isDoneExpression), isDoneExpression);

    const variableDeclarator = forInStatement.left.declarations[0];
    const variableName = variableDeclarator.id.name;

    const nextElementCallee: ESTree.MemberExpression = {
        type: ESTree.NodeType.MemberExpression,
        computed: false,
        object: iteratorIdentifier,
        property: createIdentifier("next")
    };

    const propertyAssignment = createAssignmentExpression({
        left: createIdentifier(variableName),
        right: createCallExpression(nextElementCallee)
    });

    const propertyAssignmentNode = context.createNode()
        .appendTo(startOfLoopBody, stringify(propertyAssignment));

    context.enclosingStatements.push({
        type: EnclosingStatementType.OtherStatement,
        breakTarget: finalNode,
        continueTarget: conditionNode,
        label: label
    });

    const loopBodyCompletion = parseStatement(forInStatement.body, propertyAssignmentNode, context);

    context.enclosingStatements.pop();

    if (loopBodyCompletion.normal) {
        conditionNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
    }

    return { normal: finalNode };
}

function createAssignmentExpression({ left, right }: { left: ESTree.Identifier, right: ESTree.Expression }): ESTree.AssignmentExpression {
    return {
        type: ESTree.NodeType.AssignmentExpression,
        operator: "=",
        left,
        right
    };
}

function createCallExpression(callee: ESTree.Expression, args: ESTree.Expression[] = []): ESTree.CallExpression {
    return {
        type: ESTree.NodeType.CallExpression,
        callee,
        arguments: args
    };
}

function createIdentifier(name: string): ESTree.Identifier {
    return {
        type: ESTree.NodeType.Identifier,
        name
    };
}
