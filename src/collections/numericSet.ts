export interface NumericSet {
  add: (value: number) => void;
  contains: (value: number) => boolean;
}

type LookupObject = {
  [key: number]: boolean;
};

export let NumericSet = {
  create: createSet
};

function createSet(): NumericSet {
  let lookup: LookupObject = Object.create(null);

  return {
    add(value: number) {
      lookup[value] = true;
    },

    contains(value: number) {
      return value in lookup;
    }
  };
}
