/// <reference path="../estree.ts"/>
/// <reference path="../types.ts"/>
/// <reference path="../util/idGenerator.ts"/>
/// <reference path="../util/stack.ts"/>
/// <reference path="enclosingIterationStatement.ts"/>
/// <reference path="expressionNegator.ts"/>
/// <reference path="expressionStringifier.ts"/>

module Styx {
    export class ControlFlowGraphBuilder {
        public controlFlowGraph: ControlFlowGraph;
        
        private idGenerator: Util.IdGenerator;
        private enclosingIterationStatements: Util.Stack<EnclosingIterationStatement>;
        
        constructor(private program: ESTree.Program) {
            this.idGenerator = Util.createIdGenerator();
            this.enclosingIterationStatements = new Util.Stack<EnclosingIterationStatement>();
            
            this.controlFlowGraph = this.parseProgram(program);
        }
    
        private parseProgram(program: ESTree.Program): ControlFlowGraph {
            let entryNode = this.createNode();
            let flowGraph = new ControlFlowGraph(entryNode);
    
            this.parseStatements(program.body, flowGraph.entry);
    
            return flowGraph;
        }
    
        private parseStatements(statements: ESTree.Statement[], currentNode: FlowNode): FlowNode {
            for (let statement of statements) {
                currentNode = this.parseStatement(statement, currentNode);
                
                if (statement.type === ESTree.NodeType.BreakStatement) {
                    return currentNode;
                }
            }
            
            return currentNode;
        }
    
        private parseStatement(statement: ESTree.Statement, currentNode: FlowNode): FlowNode {
            if (statement === null || statement.type === ESTree.NodeType.DebuggerStatement) {
                return currentNode;
            }
            
            if (statement.type === ESTree.NodeType.EmptyStatement) {
                return this.parseEmptyStatement(<ESTree.EmptyStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.BlockStatement) {
                return this.parseBlockStatement(<ESTree.BlockStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.VariableDeclaration) {
                return this.parseVariableDeclaration(<ESTree.VariableDeclaration>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.IfStatement) {
                return this.parseIfStatement(<ESTree.IfStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.BreakStatement) {
                return this.parseBreakStatement(<ESTree.BreakStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.WhileStatement) {
                return this.parseWhileStatement(<ESTree.WhileStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.DoWhileStatement) {
                return this.parseDoWhileStatement(<ESTree.DoWhileStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.ForStatement) {
                return this.parseForStatement(<ESTree.ForStatement>statement, currentNode);
            }
            
            if (statement.type === ESTree.NodeType.ExpressionStatement) {
                return this.parseExpressionStatement(<ESTree.ExpressionStatement>statement, currentNode);
            }
            
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }
        
        private parseEmptyStatement(emptyStatement: ESTree.EmptyStatement, currentNode: FlowNode): FlowNode {
            return this.createNode().appendTo(currentNode, "(empty)");
        }
        
        private parseBlockStatement(blockStatement: ESTree.BlockStatement, currentNode: FlowNode): FlowNode {
            return this.parseStatements(blockStatement.body, currentNode);
        }
    
        private parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentNode: FlowNode): FlowNode {
            for (let declarator of declaration.declarations) {
                let initString = ExpressionStringifier.stringify(declarator.init);
                let edgeLabel = `${declarator.id.name} = ${initString}`;
                currentNode = this.createNode().appendTo(currentNode, edgeLabel);
            }
    
            return currentNode;
        }
    
        private parseIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            return ifStatement.alternate === null
                ? this.parseSimpleIfStatement(ifStatement, currentNode)
                : this.parseIfElseStatement(ifStatement, currentNode);
        }
    
        private parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            let truthyCondition = ifStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let thenNode = this.createNode().appendTo(currentNode, truthyConditionLabel);
            let endOfThenBranch = this.parseStatement(ifStatement.consequent, thenNode);
            
            let finalNode = this.createNode()
                .appendTo(currentNode, falsyConditionLabel);
            
            if (endOfThenBranch) {
                finalNode.appendTo(endOfThenBranch);
            }
            
            return finalNode;
        }
    
        private parseIfElseStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
            // Then branch
            let thenCondition = ifStatement.test;
            let thenLabel = ExpressionStringifier.stringify(thenCondition);
            let thenNode = this.createNode().appendTo(currentNode, thenLabel);
            let endOfThenBranch = this.parseStatement(ifStatement.consequent, thenNode);
            
            // Else branch
            let elseCondition = ExpressionNegator.negateTruthiness(thenCondition);
            let elseLabel = ExpressionStringifier.stringify(elseCondition); 
            let elseNode = this.createNode().appendTo(currentNode, elseLabel);
            let endOfElseBranch = this.parseStatement(ifStatement.alternate, elseNode);
            
            let finalNode = this.createNode();
            
            if (endOfThenBranch) {
                finalNode.appendTo(endOfThenBranch);
            }
            
            if (endOfElseBranch) {
                finalNode.appendTo(endOfElseBranch);
            }
            
            return finalNode;
        }
        
        private parseBreakStatement(breakStatement: ESTree.BreakStatement, currentNode: FlowNode): FlowNode {
            let enclosingLoop = this.enclosingIterationStatements.peek();
            enclosingLoop.finalNode.appendTo(currentNode, "break");
            
            return null;
        }
        
        private parseWhileStatement(whileStatement: ESTree.WhileStatement, currentNode: FlowNode): FlowNode {
            // Truthy test (enter loop)
            let truthyCondition = whileStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            // Falsy test (exit loop)
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);            
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let loopBodyNode = this.createNode().appendTo(currentNode, truthyConditionLabel);
            let finalNode = this.createNode();
            
            this.enclosingIterationStatements.push({
                iterationStatement: whileStatement,
                finalNode: finalNode
            });
            
            let endOfLoopBodyNode = this.parseStatement(whileStatement.body, loopBodyNode);
            
            if (endOfLoopBodyNode) {
                currentNode.appendTo(endOfLoopBodyNode);
            }
            
            this.enclosingIterationStatements.pop();
            
            return finalNode
                .appendTo(currentNode, falsyConditionLabel);
        }
        
        private parseDoWhileStatement(doWhileStatement: ESTree.DoWhileStatement, currentNode: FlowNode): FlowNode {
            // Truthy test (enter loop)
            let truthyCondition = doWhileStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            // Falsy test (exit loop)
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);            
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let finalNode = this.createNode();
            
            this.enclosingIterationStatements.push({
                iterationStatement: doWhileStatement,
                finalNode: finalNode
            });
            
            let endOfLoopBodyNode = this.parseStatement(doWhileStatement.body, currentNode);
            
            this.enclosingIterationStatements.pop();
            
            if (endOfLoopBodyNode) {
                currentNode.appendTo(endOfLoopBodyNode, truthyConditionLabel);
                finalNode.appendTo(endOfLoopBodyNode, falsyConditionLabel);
            }
            
            return finalNode;
        }
        
        private parseForStatement(forStatement: ESTree.ForStatement, currentNode: FlowNode): FlowNode {
            return forStatement.test === null
                ? this.parseForStatementWithoutTest(forStatement, currentNode)
                : this.parseForStatementWithTest(forStatement, currentNode);
        }
        
        private parseForStatementWithTest(forStatement: ESTree.ForStatement, currentNode: FlowNode): FlowNode {
            let conditionNode = this.parseStatement(forStatement.init, currentNode);
            
            let truthyCondition = forStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let loopBodyNode = this.createNode().appendTo(conditionNode, truthyConditionLabel);
            
            let finalNode = this.createNode();
            
            this.enclosingIterationStatements.push({
                iterationStatement: forStatement,
                finalNode: finalNode
            });
            
            let endOfLoopBodyNode = this.parseStatement(forStatement.body, loopBodyNode);
            
            this.enclosingIterationStatements.pop();
            
            if (endOfLoopBodyNode) {
                if (forStatement.update === null) {
                    conditionNode.appendTo(endOfLoopBodyNode);
                } else {
                    let updateExpression = this.parseExpression(forStatement.update, endOfLoopBodyNode);
                    conditionNode.appendTo(updateExpression);
                }
            }
            
            return finalNode.appendTo(conditionNode, falsyConditionLabel);
        }
        
        private parseForStatementWithoutTest(forStatement: ESTree.ForStatement, currentNode: FlowNode): FlowNode {
            let loopStartNode = this.parseStatement(forStatement.init, currentNode);            
            let finalNode = this.createNode();
            
            this.enclosingIterationStatements.push({
                iterationStatement: forStatement,
                finalNode: finalNode
            });
            
            let endOfLoopBodyNode = this.parseStatement(forStatement.body, loopStartNode);
            
            this.enclosingIterationStatements.pop();
            
            if (endOfLoopBodyNode) {
                if (forStatement.update === null) {
                    loopStartNode.appendTo(endOfLoopBodyNode);
                } else {
                    let updateExpression = this.parseExpression(forStatement.update, endOfLoopBodyNode);
                    loopStartNode.appendTo(updateExpression);
                }
            }
            
            return finalNode;
        }
        
        private parseExpressionStatement(expressionStatement: ESTree.ExpressionStatement, currentNode: FlowNode): FlowNode {
            return this.parseExpression(expressionStatement.expression, currentNode);
        }
        
        private parseExpression(expression: ESTree.Expression, currentNode: FlowNode): FlowNode {
            if (expression.type === ESTree.NodeType.AssignmentExpression) {
                return this.parseAssignmentExpression(<ESTree.AssignmentExpression>expression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.UpdateExpression) {
                return this.parseUpdateExpression(<ESTree.UpdateExpression>expression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.SequenceExpression) {
                return this.parseSequenceExpression(<ESTree.SequenceExpression>expression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.CallExpression) {
                return this.parseCallExpression(<ESTree.CallExpression>expression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.NewExpression) {
                return this.parseNewExpression(<ESTree.NewExpression>expression, currentNode);
            }
            
            throw Error(`Encountered unsupported expression type '${expression.type}'`);
        }
        
        private parseAssignmentExpression(assignmentExpression: ESTree.AssignmentExpression, currentNode: FlowNode): FlowNode {
            let leftString = ExpressionStringifier.stringify(assignmentExpression.left);
            let rightString = ExpressionStringifier.stringify(assignmentExpression.right);
            let assignmentLabel = `${leftString} ${assignmentExpression.operator} ${rightString}`;
            
            return this.createNode().appendTo(currentNode, assignmentLabel);
        }
        
        private parseUpdateExpression(expression: ESTree.UpdateExpression, currentNode: FlowNode): FlowNode {
            let stringifiedUpdate = ExpressionStringifier.stringify(expression);
            
            return this.createNode().appendTo(currentNode, stringifiedUpdate);
        }
        
        private parseSequenceExpression(sequenceExpression: ESTree.SequenceExpression, currentNode: FlowNode): FlowNode {
            for (let expression of sequenceExpression.expressions) {
                currentNode = this.parseExpression(expression, currentNode);
            }
            
            return currentNode;
        }
        
        private parseCallExpression(callExpression: ESTree.CallExpression, currentNode: FlowNode): FlowNode {
            let callLabel = ExpressionStringifier.stringify(callExpression);

            return this.createNode()
                .appendTo(currentNode, callLabel);
        }
        
        private parseNewExpression(newExpression: ESTree.NewExpression, currentNode: FlowNode): FlowNode {
            let newLabel = ExpressionStringifier.stringify(newExpression);
            
            return this.createNode()
                .appendTo(currentNode, newLabel);
        }
        
        private createNode(): FlowNode {
            return new FlowNode(this.idGenerator.makeNew());
        }
    }
}
