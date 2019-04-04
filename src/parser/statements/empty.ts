import * as ESTree from "../../estree";
import { Completion, FlowNode, ParsingContext } from "../../flow";

export { parseEmptyStatement };

function parseEmptyStatement(
  emptyStatement: ESTree.EmptyStatement,
  currentNode: FlowNode,
  context: ParsingContext
): Completion {
  return {
    normal: context
      .createNode()
      .appendTo(currentNode, "(empty)", emptyStatement)
  };
}
