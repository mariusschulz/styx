/// <reference path="../estree.ts"/>
/// <reference path="../types.ts"/>
/// <reference path="../util/idGenerator.ts"/>
/// <reference path="expressionNegator.ts"/>
/// <reference path="expressionStringifier.ts"/>

module Styx {
    interface ConstructionContext {
        createNode: () => FlowNode;
    }
    
    export class ControlFlowGraphBuilder {
        public controlFlowGraph: ControlFlowGraph;
        
        private idGenerator: Util.IdGenerator;
        
        constructor(private program: ESTree.Program) {
            this.idGenerator = Util.createIdGenerator();
            
            this.controlFlowGraph = this.parseProgram(program);
        }
    
        parseProgram(program: ESTree.Program): ControlFlowGraph {
            let entryNode = this.createNode();
            let flowGraph = new ControlFlowGraph(entryNode);
    
            this.parseStatements(program.body, flowGraph.entry);
    
            return flowGraph;
        }
    
        parseStatements(statements: ESTree.Statement[], currentNode: FlowNode): FlowNode {
            for (let statement of statements) {
                currentNode = this.parseStatement(statement, currentNode);
            }
            
            return currentNode;
        }
    
        parseStatement(statement: ESTree.Statement, currentNode: FlowNode): FlowNode {
            if (statement.type === ESTree.NodeType.EmptyStatement) {
                return this.createNode()
                    .appendTo(currentNode, "(empty)");
            }
            
            if (statement.type === ESTree.NodeType.BlockStatement) {
                let blockStatement = <ESTree.BlockStatement>statement;
                return this.parseStatements(blockStatement.body, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.VariableDeclaration) {
                let declaration = <ESTree.VariableDeclaration>statement;
                return this.parseVariableDeclaration(declaration, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.IfStatement) {
                let ifStatement = <ESTree.IfStatement>statement;
                return this.parseIfStatement(ifStatement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.WhileStatement) {
                let whileStatement = <ESTree.WhileStatement>statement;
                return this.parseWhileStatement(whileStatement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.DoWhileStatement) {
                let doWhileStatement = <ESTree.DoWhileStatement>statement;
                return this.parseDoWhileStatement(doWhileStatement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.ForStatement) {
                let forStatement = <ESTree.ForStatement>statement;
                return this.parseForStatement(forStatement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.ExpressionStatement) {
                let expressionStatement = <ESTree.ExpressionStatement>statement;
                return this.parseExpression(expressionStatement.expression, currentNode);
            }
            
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }
    
        parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode): FlowNode {
            for (let declarator of declaration.declarations) {
                let initString = ExpressionStringifier.stringify(declarator.init);
                let edgeLabel = `${declarator.id.name} = ${initString}`;
                currentNode = this.createNode().appendTo(currentNode, edgeLabel);
            }
    
            return currentNode;
        }
    
        parseIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            return ifStatement.alternate === null
                ? this.parseSimpleIfStatement(ifStatement, currentNode)
                : this.parseIfElseStatement(ifStatement, currentNode);
        }
    
        parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            let ifNode = this.createNode().appendTo(currentNode);
            let endOfIfBranch = this.parseStatement(ifStatement.consequent, ifNode);
            
            return this.createNode()
                .appendTo(currentNode)
                .appendTo(endOfIfBranch);
        }
    
        parseIfElseStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            // Then branch
            let thenCondition = ifStatement.test;
            let thenLabel = ExpressionStringifier.stringify(thenCondition);
            let thenNode = this.createNode().appendTo(currentNode, thenLabel);
            let endOfThenBranch = this.parseStatement(ifStatement.consequent, thenNode);
            
            // Else branch
            let elseCondition = ExpressionNegator.safelyNegate(thenCondition);
            let elseLabel = ExpressionStringifier.stringify(elseCondition); 
            let elseNode = this.createNode().appendTo(currentNode, elseLabel);
            let endOfElseBranch = this.parseStatement(ifStatement.alternate, elseNode);
            
            return this.createNode()
                .appendTo(endOfThenBranch)
                .appendTo(endOfElseBranch);
        }
        
        parseWhileStatement(whileStatement: ESTree.WhileStatement, currentNode: FlowNode): FlowNode {
            let loopBodyNode = this.createNode().appendTo(currentNode, "Pos");        
            let endOfLoopBodyNode = this.parseStatement(whileStatement.body, loopBodyNode);
            currentNode.appendTo(endOfLoopBodyNode);
            
            return this.createNode()
                .appendTo(currentNode, "Neg");
        }
        
        parseDoWhileStatement(doWhileStatement: ESTree.DoWhileStatement, currentNode: FlowNode): FlowNode {
            let endOfLoopBodyNode = this.parseStatement(doWhileStatement.body, currentNode);
            currentNode.appendTo(endOfLoopBodyNode, "Pos");
            
            return this.createNode()
                .appendTo(endOfLoopBodyNode, "Neg");
        }
        
        parseForStatement(forStatement: ESTree.ForStatement, currentNode: FlowNode): FlowNode {
            let preLoopNode = this.parseStatement(forStatement.init, currentNode);
            
            let conditionTrueLabel = ExpressionStringifier.stringify(forStatement.test);
            let conditionFalseLabel = `!(${conditionTrueLabel})`;
            
            let loopBodyNode = this.createNode().appendTo(preLoopNode, conditionTrueLabel);
            let endOfLoopBodyNode = this.parseStatement(forStatement.body, loopBodyNode);
            
            let updateExpression = this.parseExpression(forStatement.update, endOfLoopBodyNode);
            preLoopNode.appendTo(updateExpression);
            
            return this.createNode().appendTo(preLoopNode, conditionFalseLabel);
        }
        
        parseExpression(expression: ESTree.Expression, currentNode: FlowNode): FlowNode {
            if (expression.type === ESTree.NodeType.AssignmentExpression) {
                let assignmentExpression = <ESTree.AssignmentExpression>expression;
                return this.parseAssignmentExpression(assignmentExpression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.UpdateExpression) {
                let updateExpression = <ESTree.UpdateExpression>expression;
                return this.parseUpdateExpression(updateExpression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.SequenceExpression) {
                let sequenceExpression = <ESTree.SequenceExpression>expression;
                return this.parseSequenceExpression(sequenceExpression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.CallExpression) {
                let callExpression = <ESTree.CallExpression>expression;
                return this.parseCallExpression(callExpression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.NewExpression) {
                let newExpression = <ESTree.NewExpression>expression;
                return this.parseNewExpression(newExpression, currentNode);
            }
            
            throw Error(`Encountered unsupported expression type '${expression.type}'`);
        }
        
        parseAssignmentExpression(assignmentExpression: ESTree.AssignmentExpression, currentNode: FlowNode): FlowNode {
            let leftString = ExpressionStringifier.stringify(assignmentExpression.left);
            let rightString = ExpressionStringifier.stringify(assignmentExpression.right);
            
            return this.createNode()
                .appendTo(currentNode, `${leftString} = ${rightString}`);
        }
        
        parseUpdateExpression(expression: ESTree.UpdateExpression, currentNode: FlowNode): FlowNode {
            let stringifiedUpdate = ExpressionStringifier.stringify(expression);
            
            return this.createNode().appendTo(currentNode, stringifiedUpdate);
        }
        
        parseSequenceExpression(sequenceExpression: ESTree.SequenceExpression, currentNode: FlowNode): FlowNode {
            for (let expression of sequenceExpression.expressions) {
                currentNode = this.parseExpression(expression, currentNode);
            }
            
            return currentNode;
        }
        
        parseCallExpression(callExpression: ESTree.CallExpression, currentNode: FlowNode): FlowNode {
            let callLabel = ExpressionStringifier.stringify(callExpression);

            return this.createNode()
                .appendTo(currentNode, callLabel);
        }
        
        parseNewExpression(newExpression: ESTree.NewExpression, currentNode: FlowNode): FlowNode {
            let newLabel = ExpressionStringifier.stringify(newExpression);
            
            return this.createNode()
                .appendTo(currentNode, newLabel);
        }
        
        private createNode(): FlowNode {
            return new FlowNode(this.idGenerator.makeNew());
        }
    }
}
