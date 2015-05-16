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
        
        if (expression.type === ESTree.NodeType.UnaryExpression) {
            return stringifyUnaryExpression(<ESTree.UnaryExpression>expression);
        }
        
        if (expression.type === ESTree.NodeType.BinaryExpression) {
            return stringifyBinaryExpression(<ESTree.BinaryExpression>expression);
        }
        
        if (expression.type === ESTree.NodeType.LogicalExpression) {
            return stringifyLogicalExpression(<ESTree.LogicalExpression>expression);
        }
        
        if (expression.type === ESTree.NodeType.AssignmentExpression) {
            return stringifyAssignmentExpression(<ESTree.AssignmentExpression>expression);
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
    
    function stringifyBinaryExpression(expression: ESTree.BinaryExpression): string {
        let leftString = stringify(expression.left);
        let rightString = stringify(expression.right);
        
        if (needsParenthesizing(expression.left)) {
            leftString = parenthesize(leftString);
        }
        
        if (needsParenthesizing(expression.right)) {
            rightString = parenthesize(rightString);
        }
        
        return `${leftString} ${expression.operator} ${rightString}`;
    }
    
    function stringifyUnaryExpression(expression: ESTree.UnaryExpression): string {
        let operator = expression.operator;
        let argument = stringify(expression.argument);
        let joiner = operator.length > 1 ? " " : "";
        
        return expression.prefix
            ? operator + joiner + argument
            : argument + joiner + operator;
    }
    
    function stringifyLogicalExpression(expression: ESTree.LogicalExpression): string {
        let leftString = stringify(expression.left);
        let rightString = stringify(expression.right);
        
        if (needsParenthesizing(expression.left)) {
            leftString = parenthesize(leftString);
        }
        
        if (needsParenthesizing(expression.right)) {
            rightString = parenthesize(rightString);
        }
        
        return `${leftString} ${expression.operator} ${rightString}`;
    }
    
    function stringifyAssignmentExpression(expression: ESTree.AssignmentExpression): string {
        let leftString = stringify(expression.left);
        let rightString = stringify(expression.right);
        
        return `${leftString} ${expression.operator} ${rightString}`;
    }
    
    function needsParenthesizing(expression: ESTree.Expression): boolean {
        return [
            ESTree.NodeType.BinaryExpression,
            ESTree.NodeType.LogicalExpression
        ].indexOf(expression.type) > -1;
    }
    
    function parenthesize(value: string): string {
        return `(${value})`;
    }
}
