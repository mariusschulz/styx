var expect = chai.expect;

describe("Styx", function() {
    describe("#parse()", function() {
        it("should return an object", function() {
            var ast = {};
            var cfg = Styx.parse(ast);
            expect(cfg).to.be.an("object");
        });
    });
});
