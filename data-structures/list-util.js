export function withoutDuplicates(issues, keyExtractorCallback) {

    var keyIndex = {};
    var filtered = [];

    issues.forEach(issue => {
        var key = keyExtractorCallback(issue);
        if(! keyIndex[key]) {
            filtered.push(issue);
        }
        keyIndex[key] = key;
    });

    return filtered;
}

export function listToObject(values, initialValueCallback) {
    var result={};
    initialValueCallback = initialValueCallback || function() { return null };
    values.forEach(value => {
        result[value] = initialValueCallback();
    });
    return result;
}