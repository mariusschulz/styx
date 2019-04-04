interface IdGenerator {
  generateId: () => number;
}

let idGeneratorFactory = {
  create(): IdGenerator {
    let id = 0;

    return {
      generateId: () => ++id
    };
  }
};

export default idGeneratorFactory;
