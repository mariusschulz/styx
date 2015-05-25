module ESTree {
    export class NodeType {
        static ArrayExpression= "ArrayExpression";
        static AssignmentExpression = "AssignmentExpression";
        static BinaryExpression = "BinaryExpression"
        static BlockStatement = "BlockStatement";
        static BreakStatement = "BreakStatement"
        static CallExpression = "CallExpression";
        static DebuggerStatement = "DebuggerStatement";
        static DoWhileStatement = "DoWhileStatement";
        static EmptyStatement = "EmptyStatement";
        static ExpressionStatement = "ExpressionStatement";
        static ForStatement = "ForStatement";
        static Identifier = "Identifier";
        static IfStatement = "IfStatement";
        static Literal = "Literal";
        static LogicalExpression = "LogicalExpression";
        static MemberExpression = "MemberExpression";
        static NewExpression = "NewExpression";
        static ObjectExpression = "ObjectExpression";
        static Program = "Program";
        static SequenceExpression = "SequenceExpression";
        static UnaryExpression = "UnaryExpression";
        static UpdateExpression = "UpdateExpression";
        static VariableDeclaration = "VariableDeclaration";
        static WhileStatement = "WhileStatement";
    }
    
    
    // Node objects

    export interface Node {
        type: string;
        loc?: SourceLocation;
    }

    export interface SourceLocation {
        source?: string;
        start: Position;
        end: Position;
    }

    export interface Position {
        line: number; // >= 1
        column: number; // >= 0
    }
    
    
    // Programs

    export interface Program extends Node {
        body: Statement[];
    }


    // Statements

    export interface Statement extends Node {

    }
    
    export interface EmptyStatement extends Statement {
        
    }
    
    export interface BlockStatement extends Statement {
        body: Statement[];
    }
    
    export interface ExpressionStatement extends Statement {
        expression: Expression;
    }
    
    export interface IfStatement extends Statement {
        test: Expression;
        consequent: Statement;
        alternate?: Statement;
    }
    
    export interface BreakStatement extends Statement {
        label?: Identifier;
    }
    
    export interface IterationStatement extends Statement {
        body: Statement;
    }
    
    export interface WhileStatement extends IterationStatement {
        test: Expression;
    }
    
    export interface DoWhileStatement extends IterationStatement {
        test: Expression;
    }
    
    export interface ForStatement extends IterationStatement {
        init?: VariableDeclaration | Expression;
        test?: Expression;
        update?: Expression;
    }
    
    
    // Declarations
    
    export interface Declaration extends Statement {
        
    }
    
    export interface VariableDeclaration extends Declaration {
        declarations: VariableDeclarator[];
    }
    
    export interface VariableDeclarator extends Node {
        id: Identifier;
        init?: Expression;
    }
    
    
    // Expressions 
    
    export interface Expression extends Node {
        
    }
    
    export interface ArrayExpression extends Expression {
        elements: Expression[];
    }
    
    export interface ObjectExpression extends Expression {
        properties: Property[];
    }
    
    export interface Property extends Node {
        key: Literal | Identifier;
        value: Expression;
        kind: string;
    }
    
    export interface SequenceExpression extends Expression {
        expressions: Expression[];
    }
    
    export interface UnaryExpression extends Expression {
        operator: string;
        prefix: boolean;
        argument: Expression;
    }
    
    export interface BinaryExpression extends Expression {
        operator: string;
        left: Expression;
        right: Expression;
    }
    
    export interface AssignmentExpression extends Expression {
        operator: string;
        left: Identifier | Expression;
        right: Expression;
    }
    
    export interface UpdateExpression extends Expression {
        operator: string;
        argument: Expression;
        prefix: boolean;
    }
    
    export interface LogicalExpression extends Expression {
        operator: string;
        left: Expression;
        right: Expression;
    }
    
    export interface CallExpression extends Expression {
        callee: Expression;
        arguments: Expression[];
    }
    
    export interface NewExpression extends CallExpression {
        
    }
    
    export interface MemberExpression extends Expression, Identifier {
        object: Expression;
        property: Expression;
        computed: boolean;
    }
    
    
    // Miscellaneous
    
    export interface Identifier extends Node, Expression {
        name: string;
    }
    
    export interface Literal extends Node, Expression {
        value?: string | boolean | number | RegExp;
    }
}
