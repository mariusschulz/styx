/// <reference path="../estree.ts" />

module Styx.ExpressionNegator {
    export function safelyNegate(expression: ESTree.Expression): ESTree.Expression {
        if (expression.type === ESTree.NodeType.Literal) {
            let literal = <ESTree.Literal>expression;
            
            if (typeof literal.value === "boolean") {
                return createBooleanLiteral(!literal.value);
            }
        }
        
        return wrapInUnaryNegationExpression(expression);
    }
    
    function createBooleanLiteral(value: boolean): ESTree.Literal {
        return {
            type: ESTree.NodeType.Literal,
            value: value
        };
    }
    
    function wrapInUnaryNegationExpression(expression: ESTree.Expression): ESTree.UnaryExpression {
        return {
            type: ESTree.NodeType.UnaryExpression,
            operator: "!",
            prefix: true,
            argument: expression
        };
    }
}
