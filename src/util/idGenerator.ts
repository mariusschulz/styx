interface IdGenerator {
    generateId: () => number;
}

const generatorFactory = {
    create(): IdGenerator {
        let id = 0;
    
        return {
            generateId: () => ++id
        };
    }
};

export { generatorFactory as IdGenerator };
