export function getLeadtime(historyIssues, startStateConfiguration, endStateConfiguration) {
    return historyIssues.map(historyIssue => {
        let startState = createStateConfigurationObject(startStateConfiguration);
        let endState = createStateConfigurationObject(endStateConfiguration);

        let startTimestamp = findTimestamp(historyIssue, startState.propertyName, startState.value, 0);
        let endTimestamp = findTimestamp(historyIssue, endState.propertyName, endState.value, -1);

        return { key: historyIssue.key, start: startTimestamp, end: endTimestamp, issue: historyIssue};
    });
}

function findTimestamp(historyIssue, propertyName, propertyValue, arrayIndex) {
    if(typeof propertyValue === 'function') {
        return findTimestampByFunction(historyIssue, propertyName, propertyValue, arrayIndex);
    } else if(Array.isArray(propertyValue)) {
        return findTimestampByValues(historyIssue, propertyName, propertyValue, arrayIndex);
    } else {
        return findTimestampByValue(historyIssue, propertyName, propertyValue, arrayIndex);
    }
}

function findTimestampByValues(historyIssue, propertyName, propertyValues, arrayIndex) {
    let timestamps = propertyValues.map(propertyValue => {
        return findTimestampByValue(historyIssue, propertyName, propertyValue, arrayIndex)
    }).filter(timestamp => {
        return timestamp;
    });

    if(timestamps.length > 0) {
        return timestamps[0];
    }

    return null;
}

function findTimestampByValue(historyIssue, propertyName, propertyValue, arrayIndex) {
    let timestamps=historyIssue[propertyName].map(historyEntry => {
                let timestamp = Object.keys(historyEntry)[0];
                return { "timestamp": timestamp, "value": historyEntry[timestamp] };
            }).filter(timestampAndValue => {
                return timestampAndValue.value == propertyValue
            }).map(timestampAndValue => {
                return timestampAndValue.timestamp;
            });

    return timestamps.at(arrayIndex) || null;
}

function searchEntries(entries) {
    return entries.map(historyEntry => {
        let timestamp = Object.keys(historyEntry)[0];
        return { "timestamp": timestamp, "value": historyEntry[timestamp] };
    });
}

function getFirstEntryTimestamp(entries) {
    if(entries.length > 0) {
        return entries[0].timestamp;
    }
    return null;
}

function getLastEntryTimestamp(entries) {
    if(entries.length > 0) {
        return entries.at(-1).timestamp;
    }
    return null;
}

function findTimestampByFunction(historyIssue, propertyName, propertyFunction, arrayIndex) {
    return propertyFunction(historyIssue[propertyName])
}

function createStateConfigurationObject(stateConfiguration) {
    let propertyName = Object.keys(stateConfiguration)[0];
    return { "propertyName": propertyName, "value": stateConfiguration[propertyName] }
}