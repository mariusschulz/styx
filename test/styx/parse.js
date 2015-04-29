var expect = chai.expect;

describe("Styx", function() {
    function controlFlowGraphFor(code) {
        var ast = esprima.parse(code);
        var cfg = Styx.parse(ast);

        return cfg;
    }

    describe("#parse()", function() {
        it("should return a control flow graph", function() {
            var cfg = controlFlowGraphFor("");

            expect(cfg).to.be.an("object");
            expect(cfg).to.have.property("entry");
            expect(cfg.entry).to.be.an("object");
        });
    });

    describe("#parseProgram()", function() {
        it("should return a single node for an empty program", function() {
            var cfg = controlFlowGraphFor("");

            expect(cfg.entry.next).to.be.empty;
        });
    });
});
