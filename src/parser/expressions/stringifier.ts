/// <reference path="../../estree.ts" />

namespace Styx.Expressions.Stringifier {
    type StringificationFunction = (expression: ESTree.Expression) => string;
    
    interface ExpressionToStringMap {
        [key: string]: StringificationFunction;
    }
    
    export function stringify(expression: ESTree.Expression): string {        
        let stringifiers: ExpressionToStringMap = {
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
    
    function stringifyArrayExpression(arrayExpression: ESTree.ArrayExpression): string {
        let arrayLiteral = "";        
        let isFirst = true;
        let previousElementWasNull = false;
        
        for (let element of arrayExpression.elements) {
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
    
    function stringifyAssignmentExpression(assignmentExpression: ESTree.AssignmentExpression): string {
        let leftString = stringify(assignmentExpression.left);
        let rightString = stringify(assignmentExpression.right);
        
        return `${leftString} ${assignmentExpression.operator} ${rightString}`;
    }
    
    function stringifyBinaryExpression(binaryExpression: ESTree.BinaryExpression): string {
        let leftString = stringify(binaryExpression.left);
        let rightString = stringify(binaryExpression.right);
        
        if (needsParenthesizing(binaryExpression.left)) {
            leftString = parenthesize(leftString);
        }
        
        if (needsParenthesizing(binaryExpression.right)) {
            rightString = parenthesize(rightString);
        }
        
        return `${leftString} ${binaryExpression.operator} ${rightString}`;
    }
    
    function stringifyCallExpression(callExpression: ESTree.CallExpression): string {        
        let calleeString = stringify(callExpression.callee);
        let argsString = callExpression.arguments
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
    
    function stringifyLogicalExpression(logicalExpression: ESTree.LogicalExpression): string {
        let leftString = stringify(logicalExpression.left);
        let rightString = stringify(logicalExpression.right);
        
        if (needsParenthesizing(logicalExpression.left)) {
            leftString = parenthesize(leftString);
        }
        
        if (needsParenthesizing(logicalExpression.right)) {
            rightString = parenthesize(rightString);
        }
        
        return `${leftString} ${logicalExpression.operator} ${rightString}`;
    }
    
    function stringifyMemberExpression(memberExpression: ESTree.MemberExpression): string {
        let objectString = stringify(memberExpression.object);
        let propertyString = stringify(memberExpression.property);
        
        return memberExpression.computed
            ? `${objectString}[${propertyString}]`
            : `${objectString}.${propertyString}`;
    }
    
    function stringifyNewExpression(newExpression: ESTree.NewExpression): string {        
        let callExpression = stringifyCallExpression(newExpression);
        
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
    
    function stringifyThisExpression(thisExpression: ESTree.ThisExpression): string {
        return "this";
    }
    
    function stringifyUnaryExpression(unaryExpression: ESTree.UnaryExpression): string {
        let operator = unaryExpression.operator;
        let stringifiedArgument = stringify(unaryExpression.argument);
        let joiner = operator.length > 1 ? " " : "";
        
        if (needsParenthesizing(unaryExpression.argument)) {
            stringifiedArgument = parenthesize(stringifiedArgument);
        }
        
        return unaryExpression.prefix
            ? operator + joiner + stringifiedArgument
            : stringifiedArgument + joiner + operator;
    }
    
    function stringifyUpdateExpression(updateExpression: ESTree.UpdateExpression): string {
        return updateExpression.prefix
            ? updateExpression.operator + stringify(updateExpression.argument)
            : stringify(updateExpression.argument) + updateExpression.operator;
    }
    
    function needsParenthesizing(expression: ESTree.Expression): boolean {
        switch (expression.type) {
            case ESTree.NodeType.AssignmentExpression:
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
