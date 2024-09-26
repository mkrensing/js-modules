export function sequence(promiseCallbacks) {
    return promiseCallbacks.reduce((accumulator, currentPromiseCallback) => {
        return accumulator.then(results => {
            return currentPromiseCallback().then(result => {
                return [...results, result];
            });
        });
    }, Promise.resolve([]));
}