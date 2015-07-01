/// <reference path="../../util/idGenerator.ts" />
/// <reference path="../../estree.ts" />

namespace Styx.Parser.AstPreprocessing {
    interface FunctionExpressionToRewrite {
        name: string;
        functionExpression: ESTree.FunctionExpression;
    }
    
    export function rewriteFunctionExpressions(program: ESTree.Program): ESTree.Program {
        let functionIdGenerator = Util.IdGenerator.create();
        let functionExpressionsToRewrite: FunctionExpressionToRewrite[] = [];
        
        let stringifiedProgram = JSON.stringify(program, visitNode);
        let clonedProgram: ESTree.Program = JSON.parse(stringifiedProgram);
        
        for (let funcToRewrite of functionExpressionsToRewrite) {
            let functionDeclaration: ESTree.Function = {
                type: ESTree.NodeType.FunctionDeclaration,
                id: { type: ESTree.NodeType.Identifier, name: funcToRewrite.name },
                params: clone(funcToRewrite.functionExpression.params),
                body: clone(funcToRewrite.functionExpression.body)
            };
            
            clonedProgram.body.unshift(functionDeclaration);
        }
        
        return clonedProgram;
    
        function visitNode(key: string, value: any): any {
            return value && value.type === ESTree.NodeType.FunctionExpression
                ? rewriteFunctionExpression(value)
                : value;
        }
        
        function rewriteFunctionExpression(functionExpression: ESTree.FunctionExpression): ESTree.Identifier {
            let funcName = "$$func" + functionIdGenerator.generateId();
            
            if (functionExpression.id) {
                funcName += "_" + functionExpression.id.name;
            }
            
            functionExpressionsToRewrite.push({
                name: funcName,
                functionExpression: functionExpression
            });
            
            return {
                type: ESTree.NodeType.Identifier,
                name: funcName
            }
        }
        
        function clone(object: any): any {
            return JSON.parse(JSON.stringify(object));
        }
    }
}
