import { rewriteConstantConditionalEdges } from "./constantConditionalEdgeRewriting";
import { collectNodesAndEdges } from "./nodeAndEdgeCollecting";
import { removeTransitNodes } from "./transitNodeRemoval";
import { removeUnreachableNodes } from "./unreachableNodeRemoval";

import { ControlFlowGraph, ParserOptions } from "../../flow";

export { runOptimizationPasses };

function runOptimizationPasses(
  graphs: ControlFlowGraph[],
  options: ParserOptions
) {
  for (let graph of graphs) {
    if (options.passes.rewriteConstantConditionalEdges) {
      rewriteConstantConditionalEdges(graph);
    }

    removeUnreachableNodes(graph);

    if (options.passes.removeTransitNodes) {
      removeTransitNodes(graph);
    }

    collectNodesAndEdges(graph);
  }
}
