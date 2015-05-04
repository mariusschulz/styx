var expect = chai.expect;

describe("Styx", function() {
    function controlFlowGraphFor(code) {
        var ast = esprima.parse(code);
        var cfg = Styx.parse(ast);

        return cfg;
    }

    describe("#parse()", function() {
        it("should create four nodes for an if-else statement", function() {
            var cfg = controlFlowGraphFor("if (true) { } else { }");
            
            expect(cfg.entry.outgoingEdges).to.have.length(2);
            
            var ifNode = cfg.entry.outgoingEdges[0].target;
            var elseNode = cfg.entry.outgoingEdges[1].target;
            
            expect(ifNode.outgoingEdges).to.have.length(1);
            expect(elseNode.outgoingEdges).to.have.length(1);
            
            var nodeAfterIf = ifNode.outgoingEdges[0].target; 
            var nodeAfterElse = elseNode.outgoingEdges[0].target; 
            
            expect(nodeAfterIf).to.equal(nodeAfterElse);
            expect(nodeAfterIf.outgoingEdges).to.be.empty;
        });
    });
});
