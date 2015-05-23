/// <reference path="../estree.ts"/>
/// <reference path="../types.ts"/>
/// <reference path="../util/idGenerator.ts"/>
/// <reference path="expressionNegator.ts"/>
/// <reference path="expressionStringifier.ts"/>

module Styx {
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
        
        parseEmptyStatement(emptyStatement: ESTree.EmptyStatement, currentNode: FlowNode): FlowNode {
            return this.createNode().appendTo(currentNode, "(empty)");
        }
        
        parseBlockStatement(blockStatement: ESTree.BlockStatement, currentNode: FlowNode): FlowNode {
            return this.parseStatements(blockStatement.body, currentNode);
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
            let truthyCondition = ifStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let thenNode = this.createNode().appendTo(currentNode, truthyConditionLabel);
            let endOfThenBranch = this.parseStatement(ifStatement.consequent, thenNode);
            
            return this.createNode()
                .appendTo(currentNode, falsyConditionLabel)
                .appendTo(endOfThenBranch);
        }
    
        parseIfElseStatement(ifStatement: ESTree.IfStatement, currentNode: FlowNode): FlowNode {
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
            
            return this.createNode()
                .appendTo(endOfThenBranch)
                .appendTo(endOfElseBranch);
        }
        
        parseWhileStatement(whileStatement: ESTree.WhileStatement, currentNode: FlowNode): FlowNode {
            // Truthy test (enter loop)
            let truthyCondition = whileStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            // Falsy test (exit loop)
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);            
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let loopBodyNode = this.createNode().appendTo(currentNode, truthyConditionLabel);        
            let endOfLoopBodyNode = this.parseStatement(whileStatement.body, loopBodyNode);
            currentNode.appendTo(endOfLoopBodyNode);
            
            return this.createNode()
                .appendTo(currentNode, falsyConditionLabel);
        }
        
        parseDoWhileStatement(doWhileStatement: ESTree.DoWhileStatement, currentNode: FlowNode): FlowNode {
            // Truthy test (enter loop)
            let truthyCondition = doWhileStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            // Falsy test (exit loop)
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);            
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let endOfLoopBodyNode = this.parseStatement(doWhileStatement.body, currentNode);
            currentNode.appendTo(endOfLoopBodyNode, truthyConditionLabel);
            
            return this.createNode()
                .appendTo(endOfLoopBodyNode, falsyConditionLabel);
        }
        
        parseForStatement(forStatement: ESTree.ForStatement, currentNode: FlowNode): FlowNode {
            let conditionNode = this.parseStatement(forStatement.init, currentNode);
            
            let truthyCondition = forStatement.test;
            let truthyConditionLabel = ExpressionStringifier.stringify(truthyCondition);
            
            let falsyCondition = ExpressionNegator.negateTruthiness(truthyCondition);
            let falsyConditionLabel = ExpressionStringifier.stringify(falsyCondition);
            
            let loopBodyNode = this.createNode().appendTo(conditionNode, truthyConditionLabel);
            let endOfLoopBodyNode = this.parseStatement(forStatement.body, loopBodyNode);
            
            let targetNodeForUpdateEdge = this.parseExpression(forStatement.update, endOfLoopBodyNode, conditionNode);
            
            if (targetNodeForUpdateEdge !== conditionNode) {
                conditionNode.appendTo(targetNodeForUpdateEdge);
            }
            
            return this.createNode()
                .appendTo(conditionNode, falsyConditionLabel);
        }
        
        parseExpressionStatement(expressionStatement: ESTree.ExpressionStatement, currentNode: FlowNode): FlowNode {
            return this.parseExpression(expressionStatement.expression, currentNode);
        }
        
        parseExpression(expression: ESTree.Expression, currentNode: FlowNode, finalNode?: FlowNode): FlowNode {
            if (expression.type === ESTree.NodeType.AssignmentExpression) {
                return this.parseAssignmentExpression(<ESTree.AssignmentExpression>expression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.UpdateExpression) {
                return this.parseUpdateExpression(<ESTree.UpdateExpression>expression, currentNode, finalNode);
            }
            
            if (expression.type === ESTree.NodeType.SequenceExpression) {
                return this.parseSequenceExpression(<ESTree.SequenceExpression>expression, currentNode, finalNode);
            }
            
            if (expression.type === ESTree.NodeType.CallExpression) {
                return this.parseCallExpression(<ESTree.CallExpression>expression, currentNode);
            }
            
            if (expression.type === ESTree.NodeType.NewExpression) {
                return this.parseNewExpression(<ESTree.NewExpression>expression, currentNode);
            }
            
            throw Error(`Encountered unsupported expression type '${expression.type}'`);
        }
        
        parseAssignmentExpression(assignmentExpression: ESTree.AssignmentExpression, currentNode: FlowNode): FlowNode {
            let leftString = ExpressionStringifier.stringify(assignmentExpression.left);
            let rightString = ExpressionStringifier.stringify(assignmentExpression.right);
            let assignmentLabel = `${leftString} ${assignmentExpression.operator} ${rightString}`;
            
            return this.createNode()
                .appendTo(currentNode, assignmentLabel);
        }
        
        parseUpdateExpression(expression: ESTree.UpdateExpression, currentNode: FlowNode, finalNode?: FlowNode): FlowNode {
            let stringifiedUpdate = ExpressionStringifier.stringify(expression);
            let targetNodeForUpdateEdge = finalNode || this.createNode();
            
            return targetNodeForUpdateEdge
                .appendTo(currentNode, stringifiedUpdate);
        }
        
        parseSequenceExpression(sequenceExpression: ESTree.SequenceExpression, currentNode: FlowNode, finalNode?: FlowNode): FlowNode {
            let expressionCount = sequenceExpression.expressions.length;
            
            for (let i = 0; i < expressionCount; i++) {
                let expression = sequenceExpression.expressions[i];
                
                // Pass along finalNode to last expression
                let currentFinalNode = i === expressionCount - 1 ? finalNode : null; 
                
                currentNode = this.parseExpression(expression, currentNode, currentFinalNode);
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
