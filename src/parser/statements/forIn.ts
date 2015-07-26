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

const specialIterator: ESTree.Identifier = {
    type: ESTree.NodeType.Identifier,
    name: "$$iterator"
};

function parseForInStatement(forInStatement: ESTree.ForInStatement, currentNode: FlowNode, context: ParsingContext, label?: string): Completion {
    const iteratorInvocation: ESTree.CallExpression = {
        type: ESTree.NodeType.CallExpression,
        callee: specialIterator,
        arguments: [forInStatement.right]
    };

    const objTempName = context.createTemporaryLocalVariableName("iter");
    const iterator: ESTree.Identifier = {
        type: ESTree.NodeType.Identifier,
        name: objTempName
    };

    const objExprTempAssignment: ESTree.AssignmentExpression = {
        type: ESTree.NodeType.AssignmentExpression,
        operator: "=",
        left: iterator,
        right: iteratorInvocation
    }

    let conditionNode = context.createNode()
        .appendTo(currentNode, stringify(objExprTempAssignment));

    let isDoneExpression: ESTree.MemberExpression = {
        type: ESTree.NodeType.MemberExpression,
        computed: false,
        object: iterator,
        property: <ESTree.Identifier>{
            type: ESTree.NodeType.Identifier,
            name: "done"
        }
    };

    let isNotDoneExpression = negateTruthiness(isDoneExpression);

    let startOfLoopBody = context.createNode()
        .appendConditionallyTo(conditionNode, stringify(isNotDoneExpression), isNotDoneExpression);

    let finalNode = context.createNode()
        .appendConditionallyTo(conditionNode, stringify(isDoneExpression), isDoneExpression);

    let variableDeclarator = forInStatement.left.declarations[0];
    let variableName = variableDeclarator.id.name;

    let nextElementCallee: ESTree.MemberExpression = {
        type: ESTree.NodeType.MemberExpression,
        computed: false,
        object: iterator,
        property: <ESTree.Identifier>{
            type: ESTree.NodeType.Identifier,
            name: "next"
        }
    };
    let nextElementExpression: ESTree.CallExpression = {
        type: ESTree.NodeType.CallExpression,
        callee: nextElementCallee,
        arguments: []
    };

    let propertyAssignment = {
        type: ESTree.NodeType.AssignmentExpression,
        operator: "=",
        left: <ESTree.Identifier>{
            type: ESTree.NodeType.Identifier,
            name: variableName
        },
        right: nextElementExpression
    };

    let propertyAssignmentNode = context.createNode()
        .appendTo(startOfLoopBody, stringify(propertyAssignment));

    context.enclosingStatements.push({
        type: EnclosingStatementType.OtherStatement,
        breakTarget: finalNode,
        continueTarget: conditionNode,
        label: label
    });

    let loopBodyCompletion = parseStatement(forInStatement.body, propertyAssignmentNode, context);

    context.enclosingStatements.pop();

    if (loopBodyCompletion.normal) {
        conditionNode.appendEpsilonEdgeTo(loopBodyCompletion.normal);
    }

    return { normal: finalNode };
}
