/// <reference path="../../estree.ts" />

namespace Styx.Expressions.Stringifier {
    interface ExpressionToStringMap {
        [key: string]: (expression: ESTree.Expression) => string;
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
        let stringifiedElements = "";        
        let isFirstElement = true;
        let previousElementWasNull = false;
        
        for (let element of arrayExpression.elements) {
            if (!isFirstElement && !previousElementWasNull) {
                stringifiedElements += ",";
            }
            
            if (element === null) {
                stringifiedElements += ",";
                previousElementWasNull = true;
            } else {                
                stringifiedElements += stringify(element);
                previousElementWasNull = false;
            }
            
            isFirstElement = false;
        }
        
        return `[${stringifiedElements}]`;
    }
    
    function stringifyAssignmentExpression(assignmentExpression: ESTree.AssignmentExpression): string {
        let stringifiedLeft = stringify(assignmentExpression.left);
        let stringifiedRight = stringify(assignmentExpression.right);
        
        return `${stringifiedLeft} ${assignmentExpression.operator} ${stringifiedRight}`;
    }
    
    function stringifyBinaryExpression(binaryExpression: ESTree.BinaryExpression): string {
        let stringifiedLeft = stringify(binaryExpression.left);
        let stringifiedRight = stringify(binaryExpression.right);
        
        if (needsParenthesizing(binaryExpression.left)) {
            stringifiedLeft = parenthesize(stringifiedLeft);
        }
        
        if (needsParenthesizing(binaryExpression.right)) {
            stringifiedRight = parenthesize(stringifiedRight);
        }
        
        return `${stringifiedLeft} ${binaryExpression.operator} ${stringifiedRight}`;
    }
    
    function stringifyCallExpression(callExpression: ESTree.CallExpression): string {        
        let stringifiedCallee = stringify(callExpression.callee);
        let stringifiedArguments = callExpression.arguments
            .map(arg => stringify(arg))
            .join(", ");
        
        return `${stringifiedCallee}(${stringifiedArguments})`;
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
        let stringifiedLeft = stringify(logicalExpression.left);
        let stringifiedRight = stringify(logicalExpression.right);
        
        if (needsParenthesizing(logicalExpression.left)) {
            stringifiedLeft = parenthesize(stringifiedLeft);
        }
        
        if (needsParenthesizing(logicalExpression.right)) {
            stringifiedRight = parenthesize(stringifiedRight);
        }
        
        return `${stringifiedLeft} ${logicalExpression.operator} ${stringifiedRight}`;
    }
    
    function stringifyMemberExpression(memberExpression: ESTree.MemberExpression): string {
        let stringifiedObject = stringify(memberExpression.object);
        let stringifiedProperty = stringify(memberExpression.property);
        
        return memberExpression.computed
            ? `${stringifiedObject}[${stringifiedProperty}]`
            : `${stringifiedObject}.${stringifiedProperty}`;
    }
    
    function stringifyNewExpression(newExpression: ESTree.NewExpression): string {        
        let stringifiedCall = stringifyCallExpression(newExpression);
        
        return `new ${stringifiedCall}`;
    }
    
    function stringifyObjectExpression(objectExpression: ESTree.ObjectExpression): string {
        let properties = objectExpression.properties.map(property => {
            let stringifiedKey = stringify(property.key);
            let stringifiedValue = stringify(property.value);
            
            return `${stringifiedKey}: ${stringifiedValue}`;
        }).join(", ");
        
        return `{ ${properties} }`;
    }
    
    function stringifySequenceExpression(sequenceExpression: ESTree.SequenceExpression): string {
        let stringifiedExpressions = sequenceExpression.expressions
            .map(Expressions.Stringifier.stringify)
            .join(", ");
        
        return parenthesize(stringifiedExpressions);
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
