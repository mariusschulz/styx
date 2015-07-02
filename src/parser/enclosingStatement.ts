/// <reference path="../estree.ts" />
/// <reference path="../flow.ts" />

namespace Styx {
    export interface EnclosingStatement {
        label: string;
        continueTarget: FlowNode;
        breakTarget: FlowNode;
    }
    
    export interface EnclosingTryStatement {
        handlerBodyEntry: FlowNode;
        finalizerBodyEntry: FlowNode;
    }
}
