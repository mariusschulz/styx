/// <reference path="../estree.ts" />
module Styx.ExpressionNegator {
    export function safelyNegate(expression: ESTree.Expression): ESTree.Expression {
        if (expression.type === ESTree.NodeType.Literal) {
            let literal = <ESTree.Literal>expression;
            
            if (typeof literal.value === "boolean") {
                return createBooleanLiteral(!literal.value);
            }
        }
        
        throw Error("Not implemented");
    }
    
    function createBooleanLiteral(value: boolean): ESTree.Literal {
        return {
            type: ESTree.NodeType.Literal,
            value: value
        };
    }
}
