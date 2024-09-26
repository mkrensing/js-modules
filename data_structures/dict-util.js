export function createIndex(arrayOfObjects) {
    var index={};
    arrayOfObjects.forEach(object => {
        for(let key in object) {
            index[key] = index[key] || [];
            index[key].push(object[key]);
        }
    });
    return index;
}