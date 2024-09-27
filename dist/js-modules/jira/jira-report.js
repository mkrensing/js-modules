export function createReportConfig(startDate, batchJql, jql, useCaheForPastMonths = true, useCacheForCurrentMonth = false) {

    // Historical queries
    const months = iterateMonths(startDate);

    var reportConfigs = months.map(({ startOfMonth, endOfMonth, monthName }) => {
        return {
            jql: replacePlaceholders(batchJql, { start_of_month: startOfMonth, end_of_month: endOfMonth }),
            useCache: useCaheForPastMonths,
            description: `Fetching data for ${monthName}`
        };
    });

    // Current month
    const { startOfMonth, endOfMonth, monthName } = getFirstAndLastDayOfCurrentMonth();

    reportConfigs.push({
        jql: replacePlaceholders(jql, {
            start_of_month: startOfMonth.toISOString().split('T')[0],
            end_of_month: endOfMonth.toISOString().split('T')[0]
        }),
        useCache: useCacheForCurrentMonth,
        description: `Fetching data for ${monthName}`
    });

    return reportConfigs;
}

function getFirstAndLastDayOfMonth(date) {
    const startOfMonth = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    const startOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const endOfMonth = new Date(startOfNextMonth - 1);

    return {
        startOfMonth: startOfMonth,
        endOfMonth: endOfMonth,
        monthName: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
}

function getFirstAndLastDayOfCurrentMonth() {
    return getFirstAndLastDayOfMonth(new Date());
}

function iterateMonths(startDate) {
    var start = new Date(startDate + "T00:00:00.000Z");
    const end = getFirstAndLastDayOfCurrentMonth().startOfMonth;
    const months = [];

    while (start < end) {
        const { startOfMonth, endOfMonth, monthName } = getFirstAndLastDayOfMonth(start);

        months.push({
            startOfMonth: startOfMonth.toISOString().split('T')[0],
            endOfMonth: endOfMonth.toISOString().split('T')[0],
            monthName: monthName
        });

        start = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    }

    return months;
}

function replacePlaceholders(text, placeholders) {
    let result = text;
    for(let placeholderName in placeholders) {
        result = result.replace("{" + placeholderName + "}", placeholders[placeholderName]);
    }
    return result;
}
