import {TabulatorFull as Tabulator} from 'tabulator-tables';
import $ from 'jquery'
 
class Table {
 
    constructor(targetSelector, options) {
        this.targetSelector = targetSelector
        this.tabulatorTable = new Tabulator(targetSelector, {
            responsiveLayout: true,
            layout: "fitColumns",
            ...options });
    }
 
    update(data) {
        this.tabulatorTable.setData(data)
        this.tabulatorTable.redraw();
    }
 
    toggle(data, dataSetId) {
        let $targetElement = $(this.targetSelector);
 
        if($targetElement.attr('dataSetId') == dataSetId) {
            $targetElement.attr('dataSetId', "");
            $targetElement.hide();
 
        } else {
            $targetElement.show();
            $targetElement.attr('dataSetId', dataSetId);
           this.update(data);
        }
    }
}
 
 
function isoDate(options) {
    return {sorter:isoDateSorter, formatter:isoDateFormatter, ...options }
}
 
function linkFormatter(urlTemplate) {
    return function(cell, formatterParams) {
        var value = cell.getValue();
        var url = urlTemplate.replace("{value}", value);
        return `<a href='${url}' target='_details_${value}' >${value}</a>`
    }
}
 
function values() {
    return function(values, data) {
        return values;
    }
}
 
function totalLinkFormatter(urlTemplate, separator) {
    separator = separator || "";
    return function(cell, formatterParams) {
        var values = cell.getValue();
        var url = urlTemplate.replace("{values}", values.join(separator));
        var label = values.length + " items";
        return `<a href='${url}' target='total_details' >${ label}</a>`
    }
}
 
function isoDateSorter(a, b, aRow, bRow, column, dir, sorterParams) {
    return a.localeCompare(b);
}
 
function isoDateFormatter(cell, formatterParams) {
 
    var isoDate = cell.getValue();
    var date = new Date(isoDate);
 
    var options = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'};
    var formatter = new Intl.DateTimeFormat('de-DE', options);
    var value = formatter.format(date);
    value = value.split(",").join("");
    return value;
}
 
function chained(formatters) {
 
    function rebuildCell(cell, value) {
        cell.getValue = function() {
            return value;
        }
 
        return cell;
    }
 
    return function(cell, formatterParams) {
        let chainedvalue = formatters.reduce((accumulator, formatter) => formatter(rebuildCell(cell, accumulator)), cell.getValue());
        console.log("chainedvalue", chainedvalue);
        return chainedvalue;
    }
}
 
 
var table = {
    Table: Table,
    formatters: {
        linkFormatter: linkFormatter,
        totalLinkFormatter: totalLinkFormatter,
        isoDateFormatter: isoDateFormatter
    },
    sorters: {
        isoDateSorter: isoDateSorter
    },
    columns: {
        isoDate: isoDate
    }
}
export default table