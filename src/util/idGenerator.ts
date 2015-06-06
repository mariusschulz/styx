namespace Styx.Util {
    export interface IdGenerator {
        makeNew: () => number;
    }
    
    export function createIdGenerator(): IdGenerator {
        let id = 0;
        
        return {
            makeNew: () => ++id
        };
    }
}
