var expect = chai.expect;

describe("Styx", function() {
    describe("#parse()", function() {
        it("throws for null node", function() {
            var parse = function() {
                Styx.parse(null);
            };

            expect(parse).to.throw(Error);
        });

        it("throws for node without 'type' property", function() {
            var ast = {};

            var parse = function() {
                Styx.parse(ast);
            };

            expect(parse).to.throw(Error);
        });

        it("throws for node of unknown type", function() {
            var ast = { type: "NonExistingNodeType" };

            var parse = function() {
                Styx.parse(ast);
            };

            expect(parse).to.throw(Error);
        });
    });
});
