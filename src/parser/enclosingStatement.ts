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

    export interface __EnclosingStatement {
        label: string;
        continueTarget: FlowNode;
        breakTarget: FlowNode;
    }

    export interface EnclosingTryStatement {
        isCurrentlyInTryBlock: boolean;
        isCurrentlyInFinalizer: boolean;
        handler: ESTree.CatchClause;
        handlerBodyEntry: FlowNode;
        parseFinalizer: () => Finalizer;
    }

    export type EnclosingStatement = __EnclosingStatement | EnclosingTryStatement;

    export interface Finalizer {
        bodyEntry: FlowNode;
        bodyCompletion: Completion;
    }
}
