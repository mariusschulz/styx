namespace Styx.Collections {
    export interface NumericMap<T> {
        add(key: number, value: T);
        contains(key: number): boolean;
        get(key: number): T;
    }

    interface LookupObject<T> {
        [key: number]: T;
    }

    export const NumericMap = {
        create: createMap
    };

    function createMap<T>(): NumericMap<T> {
        let lookup: LookupObject<T> = {};

        return {
            add(key, value) {
                lookup[key] = value;
            },

            contains(key) {
                return lookup.hasOwnProperty(key.toString());
            },

            get(key) {
                return lookup[key];
            }
        };
    }
}
