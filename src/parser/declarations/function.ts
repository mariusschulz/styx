import { negateTruthiness } from "../expressions/negator";
import { stringify } from "../expressions/stringifier";

import { parseBlockStatement } from "../statements/block";

import { Stack } from "../../collections/stack";

import * as ESTree from "../../estree";
import {
    Completion,
    EdgeType,
    EnclosingStatement,
    FlowFunction,
    FlowNode,
    NodeType,
    ParsingContext
} from "../../flow";

export { parseFunctionDeclaration };

function parseFunctionDeclaration(functionDeclaration: ESTree.Function, currentNode: FlowNode, context: ParsingContext): Completion {
    let entryNode = context.createNode(NodeType.Entry);
    let successExitNode = context.createNode(NodeType.SuccessExit);
    let errorExitNode = context.createNode(NodeType.ErrorExit);

    let func: FlowFunction = {
        id: context.createFunctionId(),
        name: functionDeclaration.id.name,
        flowGraph: {
            entry: entryNode,
            successExit: successExitNode,
            errorExit: errorExitNode,
            nodes: [],
            edges: []
        }
    };

    let functionContext: ParsingContext = {
        functions: context.functions,
        currentFlowGraph: func.flowGraph,

        enclosingStatements: Stack.create<EnclosingStatement>(),

        createTemporaryLocalVariableName: context.createTemporaryLocalVariableName,
        createNode: context.createNode,
        createFunctionId: context.createFunctionId
    };

    let completion = parseBlockStatement(functionDeclaration.body, entryNode, functionContext);

    if (completion.normal) {
        // If we reached this point, the function didn't end with an explicit return statement.
        // Thus, an implicit "undefined" is returned.
        let undefinedReturnValue: ESTree.Identifier = {
            type: ESTree.NodeType.Identifier,
            name: "undefined"
        };

        let returnStatement: ESTree.ReturnStatement = {
            type: ESTree.NodeType.ReturnStatement,
            argument: undefinedReturnValue
        };

        func.flowGraph.successExit
            .appendTo(completion.normal, "return undefined", EdgeType.AbruptCompletion, returnStatement);
    }

    context.functions.push(func);

    return { normal: currentNode };
}
