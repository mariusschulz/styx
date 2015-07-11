import { parseBlockStatement } from "../parser";

import * as ESTree from "../../estree";
import {
    Completion,
    EnclosingStatementType,
    EnclosingTryStatement,
    FlowNode,
    ParsingContext
} from "../../flow";

export { parseTryStatement };

function parseTryStatement(tryStatement: ESTree.TryStatement, currentNode: FlowNode, context: ParsingContext): Completion {
    let handler = tryStatement.handlers[0];
    let finalizer = tryStatement.finalizer;

    let parseFinalizer = () => {
        let finalizerBodyEntry = context.createNode();
        let finalizerBodyCompletion = parseBlockStatement(finalizer, finalizerBodyEntry, context);

        return {
            bodyEntry: finalizerBodyEntry,
            bodyCompletion: finalizerBodyCompletion
        };
    };

    let handlerBodyEntry = handler ? context.createNode() : null;

    let enclosingTryStatement: EnclosingTryStatement = {
        label: null,
        breakTarget: null,
        continueTarget: null,

        type: EnclosingStatementType.TryStatement,
        isCurrentlyInTryBlock: false,
        isCurrentlyInFinalizer: false,
        handler: handler,
        handlerBodyEntry,
        parseFinalizer: finalizer ? parseFinalizer : null
    };

    context.enclosingStatements.push(enclosingTryStatement);

    enclosingTryStatement.isCurrentlyInTryBlock = true;
    let tryBlockCompletion = parseBlockStatement(tryStatement.block, currentNode, context);
    enclosingTryStatement.isCurrentlyInTryBlock = false;

    let handlerBodyCompletion = handler ? parseBlockStatement(handler.body, handlerBodyEntry, context) : null;

    context.enclosingStatements.pop();

    // try/catch production
    if (handler && !finalizer) {
        let finalNode = context.createNode();

        if (tryBlockCompletion.normal) {
            finalNode.appendEpsilonEdgeTo(tryBlockCompletion.normal);
        }

        if (handlerBodyCompletion.normal) {
            finalNode.appendEpsilonEdgeTo(handlerBodyCompletion.normal);
        }

        return { normal: finalNode };
    }

    // try/finally production
    if (!handler && finalizer) {
        if (!tryBlockCompletion.normal) {
            return tryBlockCompletion;
        }

        let finalizer = parseFinalizer();
        finalizer.bodyEntry.appendEpsilonEdgeTo(tryBlockCompletion.normal);

        if (finalizer.bodyCompletion.normal) {
            let finalNode = context.createNode();
            finalNode.appendEpsilonEdgeTo(finalizer.bodyCompletion.normal);

            return { normal: finalNode };
        }

        return finalizer.bodyCompletion;
    }

    // try/catch/finally production
    let finalNode = context.createNode();

    if (tryBlockCompletion.normal) {
        let finalizer = parseFinalizer();
        finalizer.bodyEntry.appendEpsilonEdgeTo(tryBlockCompletion.normal);

        if (finalizer.bodyCompletion.normal) {
            finalNode.appendEpsilonEdgeTo(finalizer.bodyCompletion.normal);
            return { normal: finalNode };
        }

        return finalizer.bodyCompletion;
    }

    if (handlerBodyCompletion.normal) {
        let finalizer = parseFinalizer();
        finalizer.bodyEntry.appendEpsilonEdgeTo(handlerBodyCompletion.normal);

        if (finalizer.bodyCompletion.normal) {
            finalNode.appendEpsilonEdgeTo(finalizer.bodyCompletion.normal);
            return { normal: finalNode };
        }

        return finalizer.bodyCompletion;
    }

    return { normal: finalNode };
}
