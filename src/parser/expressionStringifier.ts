/// <reference path="../estree.ts" />

module Styx.ExpressionStringifier {
    export function stringify(expression: ESTree.Expression): string {
        if (expression.type === ESTree.NodeType.ArrayExpression) {
            return stringifyArrayExpression(<ESTree.ArrayExpression>expression);
        }
        
        if (expression.type === ESTree.NodeType.ObjectExpression) {
            return stringifyObjectExpression(<ESTree.ObjectExpression>expression);
        }
        
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
        
        if (expression.type === ESTree.NodeType.CallExpression) {
            return stringifyCallExpression(<ESTree.CallExpression>expression);
        }
        
        if (expression.type === ESTree.NodeType.NewExpression) {
            return stringifyNewExpression(<ESTree.NewExpression>expression);
        }
        
        if (expression.type === ESTree.NodeType.MemberExpression) {
            return stringifyMemberExpression(<ESTree.MemberExpression>expression);
        }
        
        return "<UNEXPECTED>";
    }
    
    function stringifyArrayExpression(expression: ESTree.ArrayExpression): string {
        let arrayLiteral = "";        
        let isFirst = true;
        let previousElementWasNull = false;
        
        for (let element of expression.elements) {
            if (!isFirst && !previousElementWasNull) {
                arrayLiteral += ",";
            }
            
            if (element === null) {
                arrayLiteral += ",";
                previousElementWasNull = true;
            } else {                
                arrayLiteral += ExpressionStringifier.stringify(element);
                previousElementWasNull = false;
            }
            
            isFirst = false;
        }
        
        return `[${arrayLiteral}]`;
    }
    
    function stringifyObjectExpression(objectExpression: ESTree.ObjectExpression): string {
        let properties = objectExpression.properties.map(property => {
            let key = ExpressionStringifier.stringify(property.key);
            let value = ExpressionStringifier.stringify(property.value);
            
            return `${key}: ${value}`;
        }).join(", ");
        
        return `{ ${properties} }`;
    }
    
    function stringifyLiteral(literal: ESTree.Literal): string {
        let value = literal.value;
        
        return typeof value === "string"
            ? `"${value}"`
            : value === null
                ? "null"
                : value.toString();
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
        let stringifiedArgument = stringify(expression.argument);
        let joiner = operator.length > 1 ? " " : "";
        
        if (needsParenthesizing(expression.argument)) {
            stringifiedArgument = parenthesize(stringifiedArgument);
        }
        
        return expression.prefix
            ? operator + joiner + stringifiedArgument
            : stringifiedArgument + joiner + operator;
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
    
    function stringifyCallExpression(expression: ESTree.CallExpression): string {        
        let calleeString = ExpressionStringifier.stringify(expression.callee);
        let argsString = expression.arguments
            .map(arg => ExpressionStringifier.stringify(arg))
            .join(", ");
        
        return `${calleeString}(${argsString})`;
    }
    
    function stringifyNewExpression(expression: ESTree.NewExpression): string {        
        let callExpression = stringifyCallExpression(expression);
        
        return `new ${callExpression}`;
    }
    
    function stringifyMemberExpression(expression: ESTree.MemberExpression): string {
        let objectString = stringify(expression.object);
        let propertyString = stringify(expression.property);
        
        return expression.computed
            ? `${objectString}[${propertyString}]`
            : `${objectString}.${propertyString}`;
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
