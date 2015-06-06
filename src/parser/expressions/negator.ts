/// <reference path="../../estree.ts" />

namespace Styx.Expressions.Negator {
    const equalityComparisonOperators = ["==", "===", "!=", "!=="];
    
    export function negateTruthiness(expression: ESTree.Expression): ESTree.Expression {
        if (expression.type === ESTree.NodeType.Literal) {
            let literal = <ESTree.Literal>expression;
            
            if (typeof literal.value === "boolean") {
                return createBooleanLiteral(!literal.value);
            }
        } else if (expression.type === ESTree.NodeType.UnaryExpression) {
            let unaryExpression = <ESTree.UnaryExpression>expression;
            
            if (unaryExpression.operator === "!") {
                return unaryExpression.argument;
            }
        } else if (expression.type === ESTree.NodeType.BinaryExpression) {
            let binaryExpression = <ESTree.BinaryExpression>expression;
            
            if (equalityComparisonOperators.indexOf(binaryExpression.operator) > -1) {
                return invertEqualityComparisonOperator(binaryExpression);
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
    
    function invertEqualityComparisonOperator(binaryExpression: ESTree.BinaryExpression): ESTree.BinaryExpression {
        let isNegated = binaryExpression.operator.charAt(0) === "!";
        let firstCharOfInvertedOperator = isNegated ? "=" : "!";
        let restOfInvertedOperator = binaryExpression.operator.substr(1);
        
        return {
            type: ESTree.NodeType.BinaryExpression,
            operator: firstCharOfInvertedOperator + restOfInvertedOperator,
            left: binaryExpression.left,
            right: binaryExpression.right            
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
