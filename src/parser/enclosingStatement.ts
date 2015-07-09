import * as ESTree from "../estree";
import { FlowNode } from "../flow";

export interface Completion {
    normal?: FlowNode;
    break?: boolean;
    continue?: boolean;
    return?: boolean;
    throw?: boolean;
};

export const enum EnclosingStatementType {
    TryStatement,
    OtherStatement
}

export interface EnclosingStatement {
    type: EnclosingStatementType;
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
