interface Func<TResult> {
    (): TResult;
}

interface Predicate<T> {
    (element: T): boolean;
}
