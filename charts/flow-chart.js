import $ from 'jquery';

export class FlowChart {

    renderHeader(header) {
        let chartHeader = $("<div class='chart-header' />");
        chartHeader.insertBefore($(this.div));

        header.forEach(headerObject => {
            var headerName = Object.keys(headerObject)[0];
            var headerValue = headerObject[headerName];
            chartHeader.append("<div class='" + headerName + "'>" + headerValue + "</div>");
        });

        chartHeader.find(".more").each(function(index, item) {
            let moreArea = $(item);
            let showDetailsButton = $("<div class='show-details-button' />");
            let hideDetailsButton = $("<div class='hide-details-button' />");
            hideDetailsButton.click(function() {
                moreArea.hide();
                hideDetailsButton.hide();
                showDetailsButton.show();
            });
            showDetailsButton.click(function() {
                moreArea.show();
                hideDetailsButton.show();
                showDetailsButton.hide();
            });
            showDetailsButton.insertBefore(moreArea);
            hideDetailsButton.insertBefore(moreArea);
        });
    }

}