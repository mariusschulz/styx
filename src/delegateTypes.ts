interface Func<T> {
    (): T;
}

interface Predicate<T> {
    (element: T): boolean;
}
