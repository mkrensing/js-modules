export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function median(array) {
    if (array.length === 0) {
        return 0;
    }

    let sortedArray = [...array].sort((a, b) => a - b);
    let len = sortedArray.length;
    let middle = Math.floor(len / 2);

    if (len % 2 === 0) {
        return (sortedArray[middle - 1] + sortedArray[middle]) / 2;
    } else {
        return sortedArray[middle];
    }
}