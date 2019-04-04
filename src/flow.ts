import * as ESTree from "./estree";
import { Stack } from "./collections/stack";

export interface FlowProgram {
  flowGraph: ControlFlowGraph;
  functions: FlowFunction[];
}

export interface FlowFunction {
  id: number;
  name: string;
  flowGraph: ControlFlowGraph;
}

export interface ControlFlowGraph {
  entry: FlowNode;
  successExit: FlowNode;
  errorExit: FlowNode;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowEdge {
  source: FlowNode;
  target: FlowNode;
  type: EdgeType;
  label: string;
  data: ESTree.Expression;
}

export class FlowNode {
  id: number;
  type: NodeType;
  incomingEdges: FlowEdge[];
  outgoingEdges: FlowEdge[];

  constructor(id: number, type: NodeType) {
    this.id = id;
    this.type = type;
    this.incomingEdges = [];
    this.outgoingEdges = [];
  }

  appendTo(
    node: FlowNode,
    label: string,
    edgeData: ESTree.Expression | ESTree.Statement,
    edgeType = EdgeType.Normal
  ): FlowNode {
    let edge: FlowEdge = {
      source: node,
      target: this,
      type: edgeType,
      label: label,
      data: edgeData
    };

    node.outgoingEdges.push(edge);
    this.incomingEdges.push(edge);

    return this;
  }

  appendConditionallyTo(
    node: FlowNode,
    label: string,
    condition: ESTree.Expression
  ): FlowNode {
    return this.appendTo(node, label, condition, EdgeType.Conditional);
  }

  appendEpsilonEdgeTo(node: FlowNode): FlowNode {
    return this.appendTo(node, "", null, EdgeType.Epsilon);
  }
}

export enum NodeType {
  Normal = 0,
  Entry = 1,
  SuccessExit = 2,
  ErrorExit = 3
}

export enum EdgeType {
  Normal = 0,
  Epsilon = 1,
  Conditional = 2,
  AbruptCompletion = 3
}

export interface ParsingContext {
  functions: FlowFunction[];
  currentFlowGraph: ControlFlowGraph;

  enclosingStatements: Stack<EnclosingStatement>;

  createTemporaryLocalVariableName(name: string): string;
  createNode(type?: NodeType): FlowNode;
  createFunctionId(): number;
}

export interface ParserOptions {
  passes?: {
    removeTransitNodes?: boolean;
    rewriteConstantConditionalEdges?: boolean;
  };
}

export interface Completion {
  normal?: FlowNode;
  break?: boolean;
  continue?: boolean;
  return?: boolean;
  throw?: boolean;
}

export const enum EnclosingStatementType {
  TryStatement,
  OtherStatement
}

export interface EnclosingStatement {
  type: EnclosingStatementType;
  label: string;
  continueTarget: FlowNode;
  breakTarget: FlowNode;
}

export interface EnclosingTryStatement extends EnclosingStatement {
  isCurrentlyInTryBlock: boolean;
  isCurrentlyInFinalizer: boolean;
  handler: ESTree.CatchClause;
  handlerBodyEntry: FlowNode;
  parseFinalizer: () => Finalizer;
}

export interface Finalizer {
  bodyEntry: FlowNode;
  bodyCompletion: Completion;
}
