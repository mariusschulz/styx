import {
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    Expression,
    Identifier,
    NodeType
} from "./estree";

export function createAssignmentExpression({ left, right }: { left: Identifier, right: Expression }): AssignmentExpression {
    return {
        type: NodeType.AssignmentExpression,
        operator: "=",
        left,
        right
    };
}

export function createIdentityComparisonExpression({ left, right }: { left: Expression, right: Expression }): BinaryExpression {
    return {
        type: NodeType.BinaryExpression,
        operator: "===",
        left,
        right
    };
}

export function createCallExpression(callee: Expression, args: Expression[] = []): CallExpression {
    return {
        type: NodeType.CallExpression,
        callee,
        arguments: args
    };
}

export function createIdentifier(name: string): Identifier {
    return {
        type: NodeType.Identifier,
        name
    };
}
