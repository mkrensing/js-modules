export function createSnapshots(historyIssues, timestamps) {
    return createIndexOfListWithUniqueKeys(timestamps.map(timestamp => {
        let snapshotsForTimestamp=historyIssues.filter(issue => issue.created <= timestamp).map(issue => {
             return createSnapshot(issue, timestamp);
        });
        return { [timestamp]: snapshotsForTimestamp};
    }));
}

export function createSnapshot(historyIssue, timestamp) {

    var snapshot = {};

    for(var propertyName in historyIssue) {
        if(! Array.isArray(historyIssue[propertyName])) {
            snapshot[propertyName] = historyIssue[propertyName];
        } else {
            let propertyValuesBeforeTimestamp = historyIssue[propertyName].map(historyEntry => {
                let timestamp = Object.keys(historyEntry)[0];
                return { "timestamp": timestamp, "value": historyEntry[timestamp] };
            }).filter(timestampAndValue => {
                return timestampAndValue.timestamp <= timestamp;
            });
            snapshot[propertyName] = propertyValuesBeforeTimestamp.at(-1).value
        }
    }

    snapshot["history"] = historyIssue;

    return snapshot
}

function filterSnapshots(snapshots, filterFunction) {
    let filteredSnapshots = {};
    for(timestamp in snapshots) {
        filteredSnapshots[timestamp] = snapshots[timestamp].filter(snapshot => filterFunction(snapshot));
    }

    return filteredSnapshots;
}

function createIndexOfListWithUniqueKeys(arrayOfObjects) {
    var index={};
    arrayOfObjects.forEach( object => {
        for(let key in object) {
            index[key] = object[key];
        }
    });
    return index;
}