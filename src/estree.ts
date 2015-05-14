module ESTree {
    export class NodeType {
        static BlockStatement = "BlockStatement";
        static EmptyStatement = "EmptyStatement";
        static IfStatement = "IfStatement";
        static Program = "Program";
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
    
    export interface BlockStatement extends Statement {
        body: Statement[];
    }
    
    export interface IfStatement extends Statement {
        test: Expression;
        consequent: Statement;
        alternate?: Statement;
    }
    
    export interface WhileStatement extends Statement {
        test: Expression;
        body: Statement;
    }
    
    export interface DoWhileStatement extends Statement {
        body: Statement;
        test: Expression;
    }
    
    
    // Declarations
    
    export interface Declaration extends Statement {
        
    }
    
    export interface VariableDeclaration extends Declaration {
        declarations: VariableDeclarator[];
    }
    
    export interface VariableDeclarator extends Node {
        id: Pattern;
        init?: Expression;
    }
    
    
    // Expressions 
    
    interface Expression extends Node {
        
    }
    
    
    // Patterns
    
    interface Pattern extends Node {
        
    }
    
    
    // Miscellaneous
    
    interface Identifier extends Node, Expression, Pattern {
        name: string;
    }
    
    interface Literal extends Node, Expression {
        value?: string | boolean | number | RegExp
    }
}
