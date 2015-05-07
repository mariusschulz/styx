/// <reference path="../estree.ts"/>

module Styx.ControlFlowGraphBuilder {
    export function constructGraphFor(program: ESTree.Program): ControlFlowGraph {
        return parseProgram(program);
    }

    function parseProgram(program: ESTree.Program): ControlFlowGraph {
        var cfg = new ControlFlowGraph();

        parseStatements(program.body, cfg.entry);

        return cfg;
    }

    function parseStatements(statements: ESTree.Statement[], currentFlowNode: FlowNode) {
        for (let statement of statements) {
            currentFlowNode = parseStatement(statement, currentFlowNode);
        }
    }

    function parseStatement(statement: ESTree.Statement, currentFlowNode: FlowNode): FlowNode {
        if (statement.type === ESTree.NodeType.EmptyStatement) {
            currentFlowNode = createNodeAndAppendTo(currentFlowNode);
        } else if (statement.type === ESTree.NodeType.VariableDeclaration) {
            let declaration = <ESTree.VariableDeclaration>statement;
            currentFlowNode = parseVariableDeclaration(declaration, currentFlowNode);
        } else if (statement.type === ESTree.NodeType.IfStatement) {
            let ifStatement = <ESTree.IfStatement>statement;
            currentFlowNode = parseIfStatement(ifStatement, currentFlowNode);
        } else {
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }

        return currentFlowNode;
    }

    function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentFlowNode: FlowNode): FlowNode {
        for (let declarator of declaration.declarations) {
            currentFlowNode = createNodeAndAppendTo(currentFlowNode);
        }

        return currentFlowNode;
    }

    function parseIfStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode): FlowNode {
        return ifStatement.alternate === null
            ? parseSimpleIfStatement(ifStatement, currentFlowNode)
            : parseIfElseStatement(ifStatement, currentFlowNode);
    }

    function parseSimpleIfStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode): FlowNode {
        let ifNode = createNodeAndAppendTo(currentFlowNode);
        let finalNode = createNodeAndAppendTo(ifNode);

        let edgeToFinalNode = new FlowEdge(finalNode);
        currentFlowNode.addOutgoingEdge(edgeToFinalNode);

        return finalNode;
    }

    function parseIfElseStatement(ifStatement: ESTree.IfStatement, currentFlowNode: FlowNode): FlowNode {
        let ifNode = createNodeAndAppendTo(currentFlowNode);
        let elseNode = createNodeAndAppendTo(currentFlowNode);

        return createNodeAndAppendTo(ifNode, elseNode);
    }

    function createNodeAndAppendTo(node: FlowNode, ...otherNodes: FlowNode[]): FlowNode {
        let newNode = new FlowNode();
        let nodes = [node, ...otherNodes];

        for (let node of nodes) {
            let edge = new FlowEdge(newNode);
            node.addOutgoingEdge(edge);
        }

        return newNode;
    }
}
