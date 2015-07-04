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
    
    export interface EnclosingStatement {
        label: string;
        continueTarget: FlowNode;
        breakTarget: FlowNode;
    }
    
    export interface EnclosingTryStatement {
        handlerBodyEntry: FlowNode;
        handlerBodyCompletion: Completion;
    }
    
    export interface EnclosingFinalizer {
        parseFinalizer: () => Finalizer;
    }
    
    export interface Finalizer {
        bodyEntry: FlowNode;
        bodyCompletion: Completion;
    }
}
