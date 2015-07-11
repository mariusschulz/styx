import { negateTruthiness } from "../expressions/negator";
import { stringify } from "../expressions/stringifier";

import { parseStatements } from "../parser";

import * as ESTree from "../../estree";
import {
    Completion,
    EnclosingStatementType,
    FlowNode,
    ParsingContext
} from "../../flow";

export { parseSwitchStatement };

interface CaseBlock {
    caseClausesA: ESTree.SwitchCase[];
    defaultCase: ESTree.SwitchCase;
    caseClausesB: ESTree.SwitchCase[];
}

function parseSwitchStatement(switchStatement: ESTree.SwitchStatement, currentNode: FlowNode, context: ParsingContext, label?: string): Completion {
    const switchExpression = context.createTemporaryLocalVariableName();

    let stringifiedDiscriminant = stringify(switchStatement.discriminant);
    let exprRef = `${switchExpression} = ${stringifiedDiscriminant}`;
    let evaluatedDiscriminantNode = context.createNode().appendTo(currentNode, exprRef);

    let finalNode = context.createNode();

    context.enclosingStatements.push({
        type: EnclosingStatementType.OtherStatement,
        breakTarget: finalNode,
        continueTarget: null,
        label: label
    });

    let { caseClausesA, defaultCase, caseClausesB } = partitionCases(switchStatement.cases);
    let caseClauses = [...caseClausesA, ...caseClausesB];

    let stillSearchingNode = evaluatedDiscriminantNode;
    let endOfPreviousCaseBody: Completion = null;
    let firstNodeOfClauseListB: FlowNode = null;

    for (let caseClause of caseClauses) {
        let truthyCondition = {
            type: ESTree.NodeType.BinaryExpression,
            left: { type: ESTree.NodeType.Identifier, name: switchExpression },
            right: caseClause.test,
            operator: "==="
        };

        let beginOfCaseBody = context.createNode()
            .appendConditionallyTo(stillSearchingNode, stringify(truthyCondition), truthyCondition);

        if (caseClause === caseClausesB[0]) {
            firstNodeOfClauseListB = beginOfCaseBody;
        }

        if (endOfPreviousCaseBody && endOfPreviousCaseBody.normal) {
            // We reached the end of the case through normal control flow,
            // which means there was no 'break' statement at the end.
            // We therefore fall through from the previous case!
            beginOfCaseBody.appendEpsilonEdgeTo(endOfPreviousCaseBody.normal);
        }

        endOfPreviousCaseBody = parseStatements(caseClause.consequent, beginOfCaseBody, context);

        let falsyCondition = negateTruthiness(truthyCondition);
        stillSearchingNode = context.createNode()
            .appendConditionallyTo(stillSearchingNode, stringify(falsyCondition), falsyCondition);
    }

    if (endOfPreviousCaseBody && endOfPreviousCaseBody.normal) {
        // If the last case didn't end with an abrupt completion,
        // connect it to the final node and resume normal control flow.
        finalNode.appendEpsilonEdgeTo(endOfPreviousCaseBody.normal);
    }

    if (defaultCase) {
        let defaultCaseCompletion = parseStatements(defaultCase.consequent, stillSearchingNode, context);

        if (defaultCaseCompletion.normal) {
            let nodeAfterDefaultCase = firstNodeOfClauseListB || finalNode;
            nodeAfterDefaultCase.appendEpsilonEdgeTo(defaultCaseCompletion.normal);
        }
    } else {
        // If there's no default case, the switch statements isn't necessarily exhaustive.
        // Therefore, if no match is found, no clause's statement list is executed
        // and control flow resumes normally after the switch statement.
        finalNode.appendEpsilonEdgeTo(stillSearchingNode);
    }

    context.enclosingStatements.pop();

    return { normal: finalNode };
}

function partitionCases(cases: ESTree.SwitchCase[]): CaseBlock {
    let caseClausesA: ESTree.SwitchCase[] = [];
    let defaultCase: ESTree.SwitchCase = null;
    let caseClausesB: ESTree.SwitchCase[] = [];

    let isInCaseClausesA = true;

    for (let switchCase of cases) {
        if (switchCase.test === null) {
            // We found the default case
            defaultCase = switchCase;
            isInCaseClausesA = false;
        } else {
            (isInCaseClausesA ? caseClausesA : caseClausesB).push(switchCase);
        }
    }

    return { caseClausesA, defaultCase, caseClausesB };
}
