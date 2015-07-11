import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";
import {
    Completion,
    FlowNode,
    ParsingContext
} from "../../flow";

export { parseVariableDeclaration };

function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode, context: ParsingContext): Completion {
    for (let declarator of declaration.declarations) {
        let initString = stringify(declarator.init);
        let edgeLabel = `${declarator.id.name} = ${initString}`;
        currentNode = context.createNode().appendTo(currentNode, edgeLabel);
    }

    return { normal: currentNode };
}
