
export function createIterations(cycles, iterationLengths, sprints, sprintFilter) {

    const iterations = createIterationsByCycle(
        cycles,
        iterationLengths,
        true
    );

    attachSprintsToIterations(
        sprints,
        iterations,
        sprintFilter
    );

    return iterations;
}

function createIterationsByCycle(cycles, iterationLengths, stopAtCurrentDate = false) {
    let iterations = [];
    for (const cycle of cycles) {
        iterations = iterations.concat(
            createIterationsByStartDate(
                cycle.startDate,
                iterationLengths,
                stopAtCurrentDate,
                cycle.name
            )
        );
    }
    return iterations;
}

function createIterationsByStartDate(
    startDate,
    iterationLengths,
    stopAtCurrentDate = false,
    nameTemplate = "Iteration {iteration_number}"
) {
    startDate = new Date(startDate);
    const currentDate = new Date();
    const iterations = [];

    if (stopAtCurrentDate && startDate > currentDate) {
        return [];
    }

    for (let iterationNumber = 0; iterationNumber < iterationLengths.length; iterationNumber++) {
        const iterationLength = iterationLengths[iterationNumber];
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + iterationLength * 7 - 1);

        iterations.push({
            name: createIterationName(nameTemplate, iterationNumber + 1),
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
        });

        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() + 1);

        if (stopAtCurrentDate && startDate > currentDate) {
            break;
        }
    }

    return iterations;
}

function createIterationName(nameTemplate, iterationNumber) {
    return nameTemplate.replace("{iteration_number}", iterationNumber.toString());
}

function attachSprintsToIterations(sprints, iterations, sprintFilter) {
    const sprintIndex = buildSprintIndex(sprints, sprintFilter);

    attachSprintsToIterationsBySprintIndex(iterations, sprintIndex);
}

function attachSprintsToIterationsBySprintIndex(iterations, sprintIndex) {
    const attachedSprintIds = [];
    for (const sprint of Object.values(sprintIndex)) {
        for (const iteration of iterations) {
            iteration["sprints"] = iteration["sprints"] || [];
            const overlappingDays = hasOverlappingDays(iteration, sprint);
            if (overlappingDays && !attachedSprintIds.includes(sprint.id)) {
                iteration["sprints"].push(sprint);
                attachedSprintIds.push(sprint.id);
            }
        }
    }
}

function buildSprintIndex(sprints, sprintFilter) {
    const sprintIndexByObject = {};
    for (const sprint of sprints) {
        if (!sprintIndexByObject[sprint.id]) {
            if (sprintFilterMatches(sprint, sprintFilter)) {
                sprintIndexByObject[sprint.id] = sprint;
            }
        }

    }
    return sprintIndexByObject;
}

function sprintFilterMatches(sprint, sprintFilter) {
    if (!sprintFilter) {
        return true;
    }

    const pattern = new RegExp(sprintFilter, "i");
    return pattern.test(sprint.name);
}

function getOverlappingDays(period1, period2) {

    const startOverlap = new Date(maxDate([period1.startDate, period2.startDate]));
    const endOverlap = new Date(minDate([period1.endDate, period2.endDate]));

    if (startOverlap <= endOverlap) {
        return (endOverlap - startOverlap) / (1000 * 60 * 60 * 24) + 1;
    } else {
        return 0;
    }
}

function minDate(dates) {
    return dates.reduce(function (a, b) { return a < b ? a : b; });
}

function maxDate(dates) {
    return dates.reduce(function (a, b) { return a > b ? a : b; });
}

function hasOverlappingDays(period1, period2) {
    let overlappingDays = getOverlappingDays(period1, period2);
    return overlappingDays > 0;
}
