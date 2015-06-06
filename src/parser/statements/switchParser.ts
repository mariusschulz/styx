/// <reference path="../../delegateTypes.ts"/>
/// <reference path="../../estree.ts"/>
/// <reference path="../../flow.ts"/>

namespace Styx.Statements {
    export class SwitchParser {
        private createNode: Func<FlowNode>;
        
        constructor(createNode: Func<FlowNode>) {
            this.createNode = createNode;
        }
        
        parseSwitchStatement(switchStatement: ESTree.SwitchStatement, currentNode: FlowNode): FlowNode {
            return this.createNode().appendTo(currentNode, "switch");
        }        
    }
}
