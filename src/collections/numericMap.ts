export interface NumericMap<T> {
  containsKey(key: number): boolean;
  entries(): { key: number; value: T }[];
  values(): T[];
  get(key: number): T;
  set(key: number, value: T): void;
}

interface LookupObject<T> {
  [key: number]: T;
  [key: string]: T;
}

export let NumericMap = {
  create: createMap
};

function createMap<T>(): NumericMap<T> {
  let lookup: LookupObject<T> = {};

  return {
    containsKey(key) {
      return lookup.hasOwnProperty(key.toString());
    },

    entries() {
      return Object.keys(lookup).map(key => {
        return {
          key: Number(key),
          value: lookup[key]
        };
      });
    },

    values() {
      return Object.keys(lookup).map(key => lookup[key]);
    },

    get(key) {
      return lookup[key];
    },

    set(key, value) {
      lookup[key] = value;
    }
  };
}
