/* global _ */
/* global Styx */
/* global esprima */
/* global vis */
(function() {
    var network;
    var fontFaces = "Consolas, Menlo, Monaco, monospace";

    window.cfgVisualization = {
        parseProgram: parseProgram,
        renderControlFlowGraph: renderControlFlowGraph
    };

    function parseProgram(code, options) {
        return Styx.parse(esprima.parse(code), options);
    }

    function renderControlFlowGraph(container, controlFlowGraph) {
        var visualizationOptions = {
            width: "100%",
            height: "100%",

            layout: {
                hierarchical: {
                    levelSeparation: 85,
                    direction: "UD",
                    sortMethod: "directed"
                }
            },

            edges: {
                smooth: {
                    type: "curvedCW",
                    roundness: 0.45
                }
            }
        };

        if (network) {
            network.destroy();
        }

        setTimeout(function() {
            var visGraph = generateNodesAndEdges(controlFlowGraph);
            network = new vis.Network(container, visGraph, visualizationOptions);
        }, 0);
    }

    function generateNodesAndEdges(cfg) {
        var nodeSet = { };
        collectNodes(cfg.entry, nodeSet);

        var nodes = [];
        var edges = [];

        _.each(nodeSet, function(node) {
            addNodeAndEdges(node, nodes, edges);
        });

        return {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
    }

    function addNodeAndEdges(node, nodes, edges) {
        nodes.push({
            id: node.id,
            label: node.label || node.id,
            color: getNodeColor(node),
            font: {
                face: fontFaces,
                color: getNodeFontColor(node)
            }
        });

        _.each(node.outgoingEdges, function(outgoingEdge) {
            var color = getEdgeColor(outgoingEdge);
            var visEdge = {
                from: node.id,
                to: outgoingEdge.target.id,
                label: outgoingEdge.label,
                color: color,
                font: {
                    background: "white",
                    color: color,
                    face: fontFaces
                },
                arrows: "to"
            };

            edges.push(visEdge);
        });
    }

    function getNodeColor(node) {
        switch (node.type) {
            case Styx.NodeType.Entry:
                return "#FFCC00";
            case Styx.NodeType.SuccessExit:
                return "#4CD964";
            case Styx.NodeType.ErrorExit:
                return "#FF2D55";
            default:
                return "#97C2FC";
        }
    }

    function getNodeFontColor(node) {
        return node.type === Styx.NodeType.ErrorExit ? "white" : "black";
    }

    function getEdgeColor(edge) {
        switch (edge.type) {
            case Styx.EdgeType.Epsilon:
                return "#999999";
            case Styx.EdgeType.Conditional:
                return "#FF9500";
            case Styx.EdgeType.AbruptCompletion:
                return "#FF2D55";
            default:
                return "#2B7CE9";
        }
    }

    function collectNodes(node, nodeSet) {
        if (nodeSet[node.id]) {
            return;
        }

        nodeSet[node.id] = node;

        for (var i = 0; i < node.outgoingEdges.length; i++) {
            var targetNode = node.outgoingEdges[i].target;
            collectNodes(targetNode, nodeSet);
        }
    }
}());
