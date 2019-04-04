import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseDebuggerStatement };

function parseDebuggerStatement(
  debuggerStatement: ESTree.DebuggerStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  return { normal: currentNode };
}
