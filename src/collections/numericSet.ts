namespace Styx.Collections {
    export interface NumericSet {
        add: (value: number) => void;
        contains: (value: number) => boolean;
    }

    type LookupObject = { [key: number]: boolean; }

    export const NumericSet = {
        create: createSet
    };

    function createSet(): NumericSet {
        let lookup: LookupObject = {};

        return {
            add(value: number) {
                lookup[value] = true;
            },

            contains(value: number) {
                return lookup.hasOwnProperty(value.toString());
            }
        };
    }
}
