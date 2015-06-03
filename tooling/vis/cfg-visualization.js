/* global _ */
/* global Styx */
/* global esprima */
/* global vis */
(function() {
    window.cfgVisualization = {
        renderControlFlowGraph: renderControlFlowGraph
    };

    function renderControlFlowGraph(container, code) {
        var options = {            
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
                    type: "curvedCW"
                }
            }
        };
        
        var graphData = computeGraphData(code);
        
        return new vis.Network(container, graphData, options);
    }

    function computeGraphData(code) {
        if (code) {
            var cfg = Styx.parse(esprima.parse(code));
            
            return generateNodesAndEdges(cfg);            
        }
        
        return {
            nodes: new vis.DataSet([{ id: 1, label: "1" }]),
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
        nodes.push({
            id: node.id,
            label: node.label || node.id
        });
        
        _.each(node.outgoingEdges, function(outgoingEdge) {
            var visEdge = {
                from: node.id,
                to: outgoingEdge.target.id,
                label: outgoingEdge.label,
                color: outgoingEdge.label ? null : "#999",
                arrows: "to"
            };
            
            edges.push(visEdge);
        }); 
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
