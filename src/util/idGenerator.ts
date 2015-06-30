interface IdGenerator {
    generateId: () => number;
}

const idGeneratorFactory = {
    create(): IdGenerator {
        let id = 0;
    
        return {
            generateId: () => ++id
        };
    }
};

export default idGeneratorFactory;
