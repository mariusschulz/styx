/// <reference path="../estree.ts" />
/// <reference path="../flow.ts" />

module Styx {
    export interface EnclosingStatement {
        label?: string;
        continueTarget: FlowNode;
        breakTarget: FlowNode;
    }
}
