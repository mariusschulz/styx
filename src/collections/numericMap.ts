namespace Styx.Collections {
    export interface NumericMap<T> {
        containsKey(key: number): boolean;
        enumerate(): { key: number, value: T }[];
        get(key: number): T,
        set(key: number, value: T): void;
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
            containsKey(key) {
                return lookup.hasOwnProperty(key.toString());
            },

            enumerate() {
                let keys = Object.keys(lookup).map(Number);

                return keys.map(key => {
                    return {
                        key: key,
                        value: lookup[key]
                    }
                });
            },

            get(key) {
                return lookup[key];
            },

            set(key, value) {
                lookup[key] = value;
            }
        };
    }
}
