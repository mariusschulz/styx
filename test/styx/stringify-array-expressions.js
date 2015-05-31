var expect = chai.expect;

describe("ExpressionStringifier", function() {
    function stringifyArrayLiteral(array) {
        var program = esprima.parse(array);
        var arrayExpression = program.body[0].expression;
        
        return Styx.Expressions.Stringifier.stringify(arrayExpression);
    }
    
    describe("#stringify()", function() {
        it("should stringify array literals correctly", function() {            
            var arrayLiteralTestCases = [
                ["[]", "[]"],
                ["[1]", "[1]"],
                ["[1,2]", "[1,2]"],
                ["[  1,  2,    3,    4,  5  ]", "[1,2,3,4,5]"],
                ["[,]", "[,]"],
                ["[,,]", "[,,]"],
                ["[,,,,,]", "[,,,,,]"],
                ["[1,]", "[1]"],
                ["[1,2,3,]", "[1,2,3]"],
                ["[1,,]", "[1,,]"],
                ["[1,,3]", "[1,,3]"],
                ["[1,2,3,,,]", "[1,2,3,,,]"]
            ];
            
            _.each(arrayLiteralTestCases, function(testCase) {
                var input = testCase[0];
                var expected = testCase[1];
                
                var stringified = stringifyArrayLiteral(input);
                
                expect(stringified).to.equal(expected);
            });
        });
    });
});
