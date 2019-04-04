export function removeElementFromArray<T>(element: T, array: T[]) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (array[i] === element) {
      array.splice(i, 1);
    }
  }
}

export function partition<T>(
  elements: T[],
  predicate: (value: T) => boolean
): [T[], T[]] {
  let matches: T[] = [];
  let mismatches: T[] = [];

  for (let element of elements) {
    if (predicate(element)) {
      matches.push(element);
    } else {
      mismatches.push(element);
    }
  }

  return [matches, mismatches];
}
