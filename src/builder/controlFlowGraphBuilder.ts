/// <reference path="../estree.ts"/>
/// <reference path="../types.ts"/>
/// <reference path="../util/idGenerator.ts"/>

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
    
        parseStatements(statements: ESTree.Statement[], currentFlowNode: FlowNode): FlowNode {
            for (let statement of statements) {
                currentFlowNode = this.parseStatement(statement, currentFlowNode);
            }
            
            return currentFlowNode;
        }
    
        parseStatement(statement: ESTree.Statement, currentFlowNode: FlowNode): FlowNode {
            if (statement.type === ESTree.NodeType.EmptyStatement) {
                return this.createNode()
                    .appendTo(currentFlowNode, "(empty)");
            }
            
            if (statement.type === ESTree.NodeType.BlockStatement) {
                let blockStatement = <ESTree.BlockStatement>statement;
                return this.parseStatements(blockStatement.body, currentFlowNode);
            }
            
            if (statement.type === ESTree.NodeType.VariableDeclaration) {
                let declaration = <ESTree.VariableDeclaration>statement;
                return this.parseVariableDeclaration(declaration, currentFlowNode);
            }
            
            if (statement.type === ESTree.NodeType.IfStatement) {
                let ifStatement = <ESTree.IfStatement>statement;
                return this.parseIfStatement(ifStatement, currentFlowNode);
            }
            
            if (statement.type === ESTree.NodeType.WhileStatement) {
                let whileStatement = <ESTree.WhileStatement>statement;
                return this.parseWhileStatement(whileStatement, currentFlowNode);
            }
            
            if (statement.type === ESTree.NodeType.DoWhileStatement) {
                let doWhileStatement = <ESTree.DoWhileStatement>statement;
                return this.parseDoWhileStatement(doWhileStatement, currentFlowNode);
            }
            
            if (statement.type === ESTree.NodeType.ForStatement) {
                let forStatement = <ESTree.ForStatement>statement;
                return this.parseForStatement(forStatement, currentFlowNode);
            }
            
            if (statement.type === ESTree.NodeType.ExpressionStatement) {
                let expressionStatement = <ESTree.ExpressionStatement>statement;
                return this.parseExpression(expressionStatement.expression, currentFlowNode);
            }
            
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }
    
        parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentFlowNode: FlowNode): FlowNode {
            for (let declarator of declaration.declarations) {
                currentFlowNode = this.createNode().appendTo(currentFlowNode);
            }
    
            return currentFlowNode;
        }
    
        parseIfStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode): FlowNode {
            return ifStatement.alternate === null
                ? this.parseSimpleIfStatement(ifStatement, currentFlowNode)
                : this.parseIfElseStatement(ifStatement, currentFlowNode);
        }
    
        parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode): FlowNode {
            let ifNode = this.createNode().appendTo(currentFlowNode);
            let endOfIfBranch = this.parseStatement(ifStatement.consequent, ifNode);
            
            return this.createNode()
                .appendTo(currentFlowNode)
                .appendTo(endOfIfBranch);
        }
    
        parseIfElseStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode): FlowNode {
            let condition = ifStatement.test.type;
            
            let ifNode = this.createNode().appendTo(currentFlowNode, `Pos(${condition})`);
            let elseNode = this.createNode().appendTo(currentFlowNode, `Neg(${condition})`);
            
            let endOfIfBranch = this.parseStatement(ifStatement.consequent, ifNode);
            let endOfElseBranch = this.parseStatement(ifStatement.alternate, elseNode);
            
            return this.createNode()
                .appendTo(endOfIfBranch)
                .appendTo(endOfElseBranch);
        }
        
        parseWhileStatement(whileStatement: ESTree.WhileStatement, currentFlowNode: FlowNode): FlowNode {
            let loopBodyNode = this.createNode().appendTo(currentFlowNode, "Pos");        
            let endOfLoopBodyNode = this.parseStatement(whileStatement.body, loopBodyNode);
            currentFlowNode.appendTo(endOfLoopBodyNode);
            
            return this.createNode()
                .appendTo(currentFlowNode, "Neg");
        }
        
        parseDoWhileStatement(doWhileStatement: ESTree.DoWhileStatement, currentFlowNode: FlowNode): FlowNode {
            let endOfLoopBodyNode = this.parseStatement(doWhileStatement.body, currentFlowNode);
            currentFlowNode.appendTo(endOfLoopBodyNode, "Pos");
            
            return this.createNode()
                .appendTo(endOfLoopBodyNode, "Neg");
        }
        
        parseForStatement(forStatement: ESTree.ForStatement, currentFlowNode: FlowNode): FlowNode {
            let preLoopNode = this.parseStatement(forStatement.init, currentFlowNode);
            
            let loopBodyNode = this.createNode().appendTo(preLoopNode, "Pos");
            let endOfLoopBodyNode = this.parseStatement(forStatement.body, loopBodyNode);
            
            let updateExpression = this.parseExpression(forStatement.update, endOfLoopBodyNode);
            preLoopNode.appendTo(updateExpression);
            
            return this.createNode().appendTo(preLoopNode, "Neg");
        }
        
        parseExpression(expression: ESTree.Expression, currentFlowNode: FlowNode): FlowNode {
            if (expression.type === ESTree.NodeType.UpdateExpression) {
                let updateExpression = <ESTree.UpdateExpression>expression;
                return this.parseUpdateExpression(updateExpression, currentFlowNode);
            }
            
            if (expression.type === ESTree.NodeType.SequenceExpression) {
                let sequenceExpression = <ESTree.SequenceExpression>expression;
                return this.parseSequenceExpression(sequenceExpression, currentFlowNode);
            }
            
            throw Error(`Encountered unsupported expression type '${expression.type}'`);
        }
        
        parseUpdateExpression(expression: ESTree.UpdateExpression, currentFlowNode: FlowNode): FlowNode {
            return this.createNode().appendTo(currentFlowNode, expression.operator);
        }
        
        parseSequenceExpression(sequenceExpression: ESTree.SequenceExpression, currentFlowNode: FlowNode): FlowNode {
            for (let expression of sequenceExpression.expressions) {
                currentFlowNode = this.parseExpression(expression, currentFlowNode);
            }
            
            return currentFlowNode;
        }
        
        private createNode(): FlowNode {
            return new FlowNode(this.idGenerator.makeNew());
        }
    }
}
