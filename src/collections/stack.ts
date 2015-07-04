namespace Styx.Collections {
    interface Predicate<T> {
        (element: T): boolean;
    }
    
    export interface Stack<T> {
        push: (element: T) => void;
        pop: () => T;
        peek: () => T;
        isEmpty: boolean;
        count: number;
        find: (predicate: Predicate<T>) => T;
    }
    
    export const Stack = {
        create: createStack
    }
    
    function createStack<T>(): Stack<T> {
        let elements: T[] = [];
        
        return {
            push(element) {
                elements.push(element);
            },
            
            get count() {
                return elements.length;
            },
            
            pop() {
                return elements.pop();
            },
            
            peek() {
                return elements[elements.length - 1];            
            },
            
            get isEmpty() {
                return elements.length === 0;
            },
            
            find(predicate) {
                for (let i = elements.length - 1; i >= 0; i--) {
                    let element = elements[i];
                    
                    if (predicate(element)) {
                        return element;
                    }
                }
                
                return void 0;
            }
        }
    }
}
