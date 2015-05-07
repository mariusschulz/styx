/// <reference path="../estree.ts"/>
/// <reference path="../types.ts"/>

module Styx.ControlFlowGraphBuilder {
    interface ConstructionContext {
        createNode: () => FlowNode;
    }
    
    export function constructGraphFor(program: ESTree.Program): ControlFlowGraph {
        let makeNewId = (function() {
            let id = 0;
            return () => ++id;
        }());
        
        let constructionContext = {
            createNode: () => new FlowNode(makeNewId())
        };
        
        return parseProgram(program, constructionContext);
    }

    function parseProgram(program: ESTree.Program, context: ConstructionContext): ControlFlowGraph {
        let entryNode = context.createNode();
        let flowGraph = new ControlFlowGraph(entryNode);

        parseStatements(program.body, flowGraph.entry, context);

        return flowGraph;
    }

    function parseStatements(statements: ESTree.Statement[], currentFlowNode: FlowNode, context: ConstructionContext) {
        for (let statement of statements) {
            currentFlowNode = parseStatement(statement, currentFlowNode, context);
        }
    }

    function parseStatement(statement: ESTree.Statement, currentFlowNode: FlowNode, context: ConstructionContext): FlowNode {
        if (statement.type === ESTree.NodeType.EmptyStatement) {
            currentFlowNode = context.createNode().appendTo(currentFlowNode);
        } else if (statement.type === ESTree.NodeType.VariableDeclaration) {
            let declaration = <ESTree.VariableDeclaration>statement;
            currentFlowNode = parseVariableDeclaration(declaration, currentFlowNode, context);
        } else if (statement.type === ESTree.NodeType.IfStatement) {
            let ifStatement = <ESTree.IfStatement>statement;
            currentFlowNode = parseIfStatement(ifStatement, currentFlowNode, context);
        } else {
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }

        return currentFlowNode;
    }

    function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentFlowNode: FlowNode, context: ConstructionContext): FlowNode {
        for (let declarator of declaration.declarations) {
            currentFlowNode = context.createNode().appendTo(currentFlowNode);
        }

        return currentFlowNode;
    }

    function parseIfStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode, context: ConstructionContext): FlowNode {
        return ifStatement.alternate === null
            ? parseSimpleIfStatement(ifStatement, currentFlowNode, context)
            : parseIfElseStatement(ifStatement, currentFlowNode, context);
    }

    function parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode, context: ConstructionContext): FlowNode {
        let ifNode = context.createNode().appendTo(currentFlowNode);
        let finalNode = context.createNode().appendTo(ifNode);

        let edgeToFinalNode = new FlowEdge(finalNode);
        currentFlowNode.addOutgoingEdge(edgeToFinalNode);

        return finalNode;
    }

    function parseIfElseStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode, context: ConstructionContext): FlowNode {
        let ifNode = context.createNode().appendTo(currentFlowNode);
        let elseNode = context.createNode().appendTo(currentFlowNode);
        
        return context.createNode().appendTo(ifNode, elseNode);
    }
}
