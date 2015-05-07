/* global _ */
/* global Styx */
/* global esprima */
/* global vis */
(function() {
    window.cfgVisualization = {
        initNetworkGraph: initNetworkGraph
    };

    function initNetworkGraph(container) {
        var options = {
            stabilize: false,
            smoothCurves: false,
            hierarchicalLayout: {
                nodeSpacing: 50,
                direction: "UD",
                layout: "direction"
            },
            width: "100%",
            height: "700px"
        };

        var network = new vis.Network(container);
        network.setOptions(options);

        return graphFor(network);
    }

    function graphFor(network) {
        return {
            visualizeCode: visualizeCode
        };

        function visualizeCode(code) {
            if (!code) {
                network.setData({ nodes: [{ id: 1 }] });
            } else {
                var cfg;

                try {
                    cfg = Styx.parse(esprima.parse(code));
                } catch (e) {
                    cfg = Styx.parse(esprima.parse(""));
                }

                var graphData = generateNodesAndEdges(cfg);
                network.setData(graphData);
            }
        }
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
            nodes: nodes,
            edges: edges
        };
    }
    
    function addNodeAndEdges(node, nodes, edges) {
        nodes.push(node);
        
        _.each(node.outgoingEdges, function(outgoingEdge) {
            var visEdge = {
                from: node.id,
                to: outgoingEdge.target.id,
                style: "arrow"
            };
            
            edges.push(visEdge);
        }); 
    }
    
    function collectNodes(node, nodeSet) {
        nodeSet[node.id] = node;
        
        for (var i = 0; i < node.outgoingEdges.length; i++) {
            var targetNode = node.outgoingEdges[i].target;
            collectNodes(targetNode, nodeSet);
        }
    }
}());
