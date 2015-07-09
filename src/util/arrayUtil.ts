export function removeElementFromArray<T>(element: T, array: T[]) {
    for (let i = array.length - 1; i >= 0; i--) {
        if (array[i] === element) {
            array.splice(i, 1);
        }
    }
}
