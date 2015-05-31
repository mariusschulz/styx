module Styx.Util {
    export class Stack<T> {
        private elements: T[];
        
        constructor() {
            this.elements = [];
        }
        
        push(element: T): void {
            this.elements.push(element);
        }
        
        pop(): T {
            return this.elements.pop();
        }
        
        peek(): T {
            return this.elements[this.elements.length - 1];            
        }
    }
}
