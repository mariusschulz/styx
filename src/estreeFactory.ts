import * as ESTree from "./estree";

export function createAssignmentExpression({ left, right }: { left: ESTree.Identifier, right: ESTree.Expression }): ESTree.AssignmentExpression {
    return {
        type: ESTree.NodeType.AssignmentExpression,
        operator: "=",
        left,
        right
    };
}

export function createCallExpression(callee: ESTree.Expression, args: ESTree.Expression[] = []): ESTree.CallExpression {
    return {
        type: ESTree.NodeType.CallExpression,
        callee,
        arguments: args
    };
}

export function createIdentifier(name: string): ESTree.Identifier {
    return {
        type: ESTree.NodeType.Identifier,
        name
    };
}
