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
        
        if (expression.type === ESTree.NodeType.LogicalExpression) {
            return stringifyLogicalExpression(<ESTree.LogicalExpression>expression);
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
    
    function stringifyLogicalExpression(expression: ESTree.LogicalExpression): string {
        let leftString = stringify(expression.left);
        let rightString = stringify(expression.right);
        
        if (expression.left.type === ESTree.NodeType.LogicalExpression) {
            leftString = parenthesize(leftString);
        }
        
        if (expression.right.type === ESTree.NodeType.LogicalExpression) {
            rightString = parenthesize(rightString);
        }
        
        return `${leftString} ${expression.operator} ${rightString}`;
    }
    
    function parenthesize(value: string): string {
        return `(${value})`;
    }
}
