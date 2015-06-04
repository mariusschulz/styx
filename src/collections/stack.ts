module Styx.Collections {
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
        
        find(predicate: (element: T) => boolean): T {
            for (let i = this.elements.length - 1; i >= 0; i--) {
                let element = this.elements[i];
                
                if (predicate(element)) {
                    return element;
                }
            }
            
            return void 0;
        }
    }
}
