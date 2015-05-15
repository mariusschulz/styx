/// <reference path="../estree.ts" />
module Styx.ExpressionStringifier {
    export function stringify(expression: ESTree.Expression): string {
        if (expression.type === ESTree.NodeType.Literal) {
            return stringifyLiteral(<ESTree.Literal>expression);
        }
        
        if (expression.type === ESTree.NodeType.Identifier) {
            return stringifyIdentifier(<ESTree.Identifier>expression);
        }
        
        if (expression.type === ESTree.NodeType.UpdateExpression) {
            return stringifyUpdateExpression(<ESTree.UpdateExpression>expression);
        }
        
        return "<UNEXPECTED>";
    }
    
    function stringifyLiteral(literal: ESTree.Literal): string {
        return typeof literal.value === "string"
            ? `"${literal.value}"`
            : literal.value.toString();
    }
    
    function stringifyIdentifier(identifier: ESTree.Identifier): string {
        return identifier.name;
    }
    
    function stringifyUpdateExpression(expression: ESTree.UpdateExpression): string {
        return expression.prefix
            ? expression.operator + stringify(expression.argument)
            : stringify(expression.argument) + expression.operator;
    }
}
