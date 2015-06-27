type ObjectKey = string | number;
type LookupObject = { [key: string]: boolean; } 

export class Set<T extends ObjectKey> {
    private elementLookup: LookupObject;
    
    constructor() {
        this.elementLookup = {};
    }
    
    add(value: T) {
        this.elementLookup[value.toString()] = true;
    }
    
    contains(value: T) {
        return this.elementLookup.hasOwnProperty(value.toString());
    }
}
