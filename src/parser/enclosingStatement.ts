/// <reference path="../estree.ts" />
/// <reference path="../flow.ts" />

namespace Styx {
    export interface Completion {
        normal?: FlowNode;
        break?: boolean;
        continue?: boolean;
        return?: boolean;
        throw?: boolean;
    };

    export const enum EnclosingStatementType {
        __EnclosingStatement,
        TryStatement
    }

    export interface EnclosingStatement {
        type: EnclosingStatementType;
    }

    export interface __EnclosingStatement extends EnclosingStatement {
        label: string;
        continueTarget: FlowNode;
        breakTarget: FlowNode;
    }

    export interface EnclosingTryStatement extends EnclosingStatement {
        isCurrentlyInTryBlock: boolean;
        isCurrentlyInFinalizer: boolean;
        handler: ESTree.CatchClause;
        handlerBodyEntry: FlowNode;
        parseFinalizer: () => Finalizer;
    }

    export interface Finalizer {
        bodyEntry: FlowNode;
        bodyCompletion: Completion;
    }
}
