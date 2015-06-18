/* global _ */
/* global Styx */
/* global esprima */
/* global vis */
(function() {
    var network;
    
    window.cfgVisualization = {
        renderControlFlowGraph: renderControlFlowGraph
    };

    function renderControlFlowGraph(container, code, options, activeTab) {
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
        
        var graphData = computeGraphData(code, options, activeTab);
        
        if (network) {
            network.destroy();
        }
            
        network = new vis.Network(container, graphData, visualizationOptions);
        
        return network;
    }

    function computeGraphData(code, options, activeTab) {
        if (code) {
            var entireFlowGraph = Styx.parse(esprima.parse(code), options);
            var selectedFlowGraph = _.findWhere(entireFlowGraph.functions, { name: activeTab }) || entireFlowGraph;
            
            return generateNodesAndEdges(selectedFlowGraph);
        }
        
        return {
            nodes: new vis.DataSet([{ id: 1, label: "1", color: "#4CD964" }]),
            edges: new vis.DataSet([])
        };
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
        var isFinalNode = node.outgoingEdges.length === 0;
        
        nodes.push({
            id: node.id,
            label: node.label || node.id,
            color: isFinalNode ? "#4CD964" : null
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
                    color: color
                },
                arrows: "to"
            };
            
            edges.push(visEdge);
        }); 
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
                // null falls back to the default color
                return null;
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
