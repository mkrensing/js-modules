export function getDateRange(listOfIsoDates) {

    const dates = listOfIsoDates.map(dateStr => new Date(dateStr));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return  { minDate: minDate.toISOString(), maxDate: maxDate.toISOString() };
}

export function getMinDate(listOfIsoDates) {

    const dates = listOfIsoDates.map(dateStr => new Date(dateStr));
    const minDate = new Date(Math.min(...dates));

    return minDate.toISOString();
}

export function getMaxDate(listOfIsoDates) {

    const dates = listOfIsoDates.map(dateStr => new Date(dateStr));
    const maxDate = new Date(Math.max(...dates));

    return maxDate.toISOString();
}

export function getMonthsBetweenDates(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    const months = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        // Format: "YYYY-MM"
        const month = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
        months.push(month);

        // Zum nächsten Monat springen
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
}
