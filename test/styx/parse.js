var expect = chai.expect;

describe("Styx", function() {
    describe("#parse()", function() {

        it("should return a control flow graph", function() {
            var ast = {type: "Program", body: []};

            var cfg = Styx.parse(ast);

            expect(cfg).to.be.an("object");
            expect(cfg).to.have.property("entry");
            expect(cfg.entry).to.be.an("object");
        });
    });
});
