///<reference path="../definitions/lodash.d.ts"/>
///<reference path="estree.ts"/>
///<reference path="types.ts"/>

module Styx {
    export function parse(node: ESTree.Node): ControlFlowGraph {
        if (!_.isObject(node) || !node.type) {
            throw Error("Invalid node: 'type' property required");
        }

        if (node.type === ESTree.NodeType.Program) {
            return parseProgram(<ESTree.Program>node);
        }

        throw Error(`The node type '${node.type}' is not supported`);
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
            let flowNode = new FlowNode();
            let edge = new FlowEdge(flowNode);
            currentFlowNode.addOutgoingEdge(edge);
            currentFlowNode = flowNode;
        } else if (statement.type === ESTree.NodeType.VariableDeclaration) {
            let declaration = <ESTree.VariableDeclaration>statement;
            currentFlowNode = parseVariableDeclaration(declaration, currentFlowNode);
        } else {
            throw Error(`Encountered unsupported statement type '${statement.type}'`);
        }
        
        return currentFlowNode;
    }

    function parseVariableDeclaration(declaration: ESTree.VariableDeclaration, currentFlowNode: FlowNode): FlowNode {
        for (let declarator of declaration.declarations) {
            let flowNode = new FlowNode();
            let edge = new FlowEdge(flowNode);
            currentFlowNode.addOutgoingEdge(edge);
            currentFlowNode = flowNode;
        }

        return currentFlowNode;
    }
}
