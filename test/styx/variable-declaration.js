var expect = chai.expect;

describe("Styx", function() {
    function controlFlowGraphFor(code) {
        var ast = esprima.parse(code);
        var cfg = Styx.parse(ast);

        return cfg;
    }

    describe("#parse()", function() {
        it("should return two nodes for a simple variable declaration", function() {
            var cfg = controlFlowGraphFor("var foo = 42;");
            
            expect(cfg.entry.outgoingEdges).to.have.length(1);
            
            var secondNode = cfg.entry.outgoingEdges[0].target;
            expect(secondNode.outgoingEdges).to.have.length(0);
        });
        
        it("should return three nodes for a variable declaration with two declarators", function() {
            var cfg = controlFlowGraphFor("var foo = 42, bar = 1337;");
            
            expect(cfg.entry.outgoingEdges).to.have.length(1);
            
            var secondNode = cfg.entry.outgoingEdges[0].target;
            expect(secondNode.outgoingEdges).to.have.length(1);
            
            var thirdNode = secondNode.outgoingEdges[0].target;
            expect(thirdNode.outgoingEdges).to.have.length(0);
        });
    });
});
