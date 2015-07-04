/// <reference path="../estree.ts" />
/// <reference path="../flow.ts" />

namespace Styx {
    export interface Completion {
        normal?: FlowNode;
        break?: any;
        continue?: any;
        return?: any;
        throw?: any;
    };
    
    export interface EnclosingStatement {
        label: string;
        continueTarget: FlowNode;
        breakTarget: FlowNode;
    }
    
    export interface EnclosingTryStatement {
        handlerBodyEntry: FlowNode;
        finalizerBodyEntry: FlowNode;
        finalizerBodyCompletion: Completion;
    }
}
