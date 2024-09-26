import $ from 'jquery';
import {default as mustache} from 'mustache';
import { getTemplates } from './templates-loader.js';

var defaultLambdas = { humanReadableDate: function() { return humanReadableDate } };

function humanReadableDate(text, render) {

    let isoDateString = render(text);

    if(! isoDateString) {
        return "";
    }

    // Convert to a Date object
    const date = new Date(isoDateString.replace("+0000", "Z")); // Replace "+0000" with "Z" for correct UTC interpretation

    // Function to format date as YYYY-MM-DD HH:MM:SS
    function formatDate(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        const seconds = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return formatDate(date);
}

function render(templateId, targetSelector, data) {

    let templateElement = document.getElementById(templateId);
    if(! templateElement) {
        throw new Error("Template not found: " + templateId);
    }
	let template = templateElement.innerHTML;
	let context = { ...data, ...defaultLambdas };

	let rendered = mustache.render(template, context );
	$(targetSelector).html(rendered);
}

var templating = {
  name: 'templating.js',
  version: '4.2.0',
  render: render,
  getTemplates: getTemplates
};

export default templating