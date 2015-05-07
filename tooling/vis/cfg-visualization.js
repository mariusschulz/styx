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
                network.setData({});
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
        var nodes = [];
        var edges = [];

        nodes.push({ id: 1, name: "A" });
        nodes.push({ id: 2, name: "B" });

        edges.push({ from: 1, to: 2, style: "arrow" });

        return {
            nodes: nodes,
            edges: edges
        };
    }
}());
