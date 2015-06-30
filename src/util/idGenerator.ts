/// <reference path="../delegateTypes.ts" />

namespace Styx.Util.IdGenerator {
    export interface IdGenerator {
        generateId: Func<number>;
    }
    
    export function create(): IdGenerator {
        let id = 0;
        
        return {
            generateId: () => ++id
        };
    }
}
