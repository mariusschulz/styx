/// <reference path="../../estree.ts" />

module Styx.Expressions.Stringifier {
    type StringificationFunction = (expression: ESTree.Expression) => string;
    
    interface StringificationMap {
        [key: string]: StringificationFunction;
    }
    
    export function stringify(expression: ESTree.Expression): string {        
        let stringifiers: StringificationMap = {
            [ESTree.NodeType.ArrayExpression]: stringifyArrayExpression,
            [ESTree.NodeType.AssignmentExpression]: stringifyAssignmentExpression,
            [ESTree.NodeType.BinaryExpression]: stringifyBinaryExpression,
            [ESTree.NodeType.CallExpression]: stringifyCallExpression,
            [ESTree.NodeType.Identifier]: stringifyIdentifier,
            [ESTree.NodeType.Literal]: stringifyLiteral,            
            [ESTree.NodeType.LogicalExpression]: stringifyLogicalExpression,
            [ESTree.NodeType.MemberExpression]: stringifyMemberExpression,
            [ESTree.NodeType.NewExpression]: stringifyNewExpression,
            [ESTree.NodeType.ObjectExpression]: stringifyObjectExpression,
            [ESTree.NodeType.SequenceExpression]: stringifySequenceExpression,
            [ESTree.NodeType.ThisExpression]: stringifyThisExpression,
            [ESTree.NodeType.UnaryExpression]: stringifyUnaryExpression,
            [ESTree.NodeType.UpdateExpression]: stringifyUpdateExpression
        };
        
        let stringifier = stringifiers[expression.type];
        
        return stringifier
            ? stringifier(expression)
            : "<UNEXPECTED>";
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
                arrayLiteral += stringify(element);
                previousElementWasNull = false;
            }
            
            isFirst = false;
        }
        
        return `[${arrayLiteral}]`;
    }
    
    function stringifyAssignmentExpression(expression: ESTree.AssignmentExpression): string {
        let leftString = stringify(expression.left);
        let rightString = stringify(expression.right);
        
        return `${leftString} ${expression.operator} ${rightString}`;
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
    
    function stringifyCallExpression(expression: ESTree.CallExpression): string {        
        let calleeString = stringify(expression.callee);
        let argsString = expression.arguments
            .map(arg => stringify(arg))
            .join(", ");
        
        return `${calleeString}(${argsString})`;
    }
    
    function stringifyIdentifier(identifier: ESTree.Identifier): string {
        return identifier.name;
    }
    
    function stringifyLiteral(literal: ESTree.Literal): string {
        let value = literal.value;
        
        return typeof value === "string"
            ? `"${value}"`
            : value === null
                ? "null"
                : value.toString();
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
    
    function stringifyMemberExpression(expression: ESTree.MemberExpression): string {
        let objectString = stringify(expression.object);
        let propertyString = stringify(expression.property);
        
        return expression.computed
            ? `${objectString}[${propertyString}]`
            : `${objectString}.${propertyString}`;
    }
    
    function stringifyNewExpression(expression: ESTree.NewExpression): string {        
        let callExpression = stringifyCallExpression(expression);
        
        return `new ${callExpression}`;
    }
    
    function stringifyObjectExpression(objectExpression: ESTree.ObjectExpression): string {
        let properties = objectExpression.properties.map(property => {
            let key = stringify(property.key);
            let value = stringify(property.value);
            
            return `${key}: ${value}`;
        }).join(", ");
        
        return `{ ${properties} }`;
    }
    
    function stringifySequenceExpression(sequenceExpression: ESTree.SequenceExpression): string {
        let commaSeparatedExpressions = sequenceExpression.expressions
            .map(Expressions.Stringifier.stringify)
            .join(", ");
        
        return parenthesize(commaSeparatedExpressions);
    }
    
    function stringifyThisExpression(expression: ESTree.ThisExpression): string {
        return "this";
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
    
    function stringifyUpdateExpression(expression: ESTree.UpdateExpression): string {
        return expression.prefix
            ? expression.operator + stringify(expression.argument)
            : stringify(expression.argument) + expression.operator;
    }
    
    function needsParenthesizing(expression: ESTree.Expression): boolean {
        switch (expression.type) {
            case ESTree.NodeType.BinaryExpression:
            case ESTree.NodeType.LogicalExpression:
                return true;
            
            default:
                return false;
        }
    }
    
    function parenthesize(value: string): string {
        return `(${value})`;
    }
}
