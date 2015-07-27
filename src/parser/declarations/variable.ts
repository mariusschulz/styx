import { stringify } from "../expressions/stringifier";

import * as ESTree from "../../estree";
import { createAssignmentExpression } from "../../estreeFactory";

import {
    Completion,
    FlowNode,
    ParsingContext
} from "../../flow";

export { parseVariableDeclaration };

function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode, context: ParsingContext): Completion {
    for (let declarator of declaration.declarations) {
        const declaratorInitialization = createAssignmentExpression({
            left: declarator.id,
            right: declarator.init
        });

        currentNode = context.createNode()
            .appendTo(currentNode, stringify(declaratorInitialization), declaratorInitialization);
    }

    return { normal: currentNode };
}
