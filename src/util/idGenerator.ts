/// <reference path="../delegateTypes.ts" />

namespace Styx.Util {
    export interface IdGenerator {
        makeNew: Func<number>;
    }
    
    export function createIdGenerator(): IdGenerator {
        let id = 0;
        
        return {
            makeNew: () => ++id
        };
    }
}
