import { FlowChart } from './flow-chart.js'
import { median } from 'math-util'

export class LeadTimeChart extends FlowChart {

    constructor($targetSelector, config) {
        super();
        let _this=this;
        config = this.createDefaultConfig(config);
        this.config = config;
        this.div = $targetSelector[0];
        this.layout = {
          title: "", // label and description will be set later and outside the svg container
          margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 50,
            pad: 4
          },
          xaxis: {
            title: config.xaxisTitle
          },
          yaxis: {
            title: config.yaxisTitle
          },
          legend: {
            traceorder: 'normal',
            itemclick: false,
            itemdoubleclick: false
          }
        };
        this.header = [ { label: config.label }, { description: config.description } ];
        this.itemsByGroupAndLeadTime = {};
        this.groups = [];
        this.totalTraceId = "total";
        this.groupByFunction = function(item) { return _this.totalTraceId };
        this.sortedByFunction = function(rowA, rowB) { return 0 };
        this.extractLeadTimeFunction = function(item) { return item[config.leadTimeFieldName] };
        this.maxNumberOfItems = -1;
        this.onClickHandler = null;
    }

    setMaxNumberOfItems(maxNumberOfItems) {
        this.maxNumberOfItems = maxNumberOfItems;
    }

    createDefaultConfig(config) {
        config = config || {};
        config.label = config.label || "Lead-Time Chart"
        config.xaxisTitle = config.xaxisTitle || "Lead-Time in Days";
        config.yaxisTitle = config.yaxisTitle || "Number of items";
        config.dataLabel = config.dataLabel || "Lead-Time";
        config.leadTimeFieldName = config.leadTimeFieldName || "leadTime";
        config.traceConfig = config.traceConfig || { name: config.dataLabel, fillcolor: '#8FBBD9', linecolor: '#689EC2', pointcolor: 'darkblue' }
        return config;
    }

    setExtractLeadTimeFunction(callback) {
        this.extractLeadTimeFunction = callback;
    }

    extractLeadTime(item) {
        return this.extractLeadTimeFunction(item);
    }

    createTraces(counts, traceConfiguration) {

        var xValues = Object.keys(counts).map(Number);
        var yValues = Object.values(counts);

        var datapoints = {
          x: xValues,
          y: yValues,
          text: xValues.map((xValue, index) => xValue + " Days (" + yValues[index] + ")"),
          hovertemplate: traceConfiguration.hovertemplate || '%{text}',
          mode: 'markers',
          marker: {
            color: traceConfiguration.pointcolor,
            symbol: 'circle',
          },
          name: traceConfiguration.name || traceConfiguration.id,
          showlegend: false,
          visible: this.getInitalVisibleState(traceConfiguration)
        };

        var area = {
          x: xValues,
          y: yValues,
          fill: 'tozeroy',
          fillcolor: traceConfiguration.fillcolor,
          line: {
            color: traceConfiguration.linecolor
          },
          type: 'scatter',
          mode: 'lines',
          id: traceConfiguration.id,
          name: traceConfiguration.name || traceConfiguration.id,
          hides: datapoints,
          visible: this.getInitalVisibleState(traceConfiguration)
        };

        return [ area, datapoints ];
    }

    getInitalVisibleState(traceConfiguration) {

        if(traceConfiguration.visible == undefined) {
            return true;
        }

        if(! traceConfiguration.visible) {
            return "legendonly"
        }

        return "";
    }

    createData(items) {

        this.items = items;
        var _this = this;
        var totalCounts = {};
        var groupedCounts = {};
        var leadTimes = [];

        items.forEach(item => {
            let leadTime = _this.extractLeadTime(item);
            leadTimes.push(leadTime);
            totalCounts[leadTime] = (totalCounts[leadTime] || 0) + 1;
            let group=_this.groupByFunction(item);
            if(group) {
                groupedCounts[group] = groupedCounts[group] || {};
                groupedCounts[group][leadTime] = (groupedCounts[group][leadTime] || 0) + 1;
                _this.itemsByGroupAndLeadTime[group] = _this.itemsByGroupAndLeadTime[group] || {};
                _this.itemsByGroupAndLeadTime[group][leadTime] = _this.itemsByGroupAndLeadTime[group][leadTime] || [];
                _this.itemsByGroupAndLeadTime[group][leadTime].push(item);
                _this.itemsByGroupAndLeadTime["total"] = _this.itemsByGroupAndLeadTime["total"] || {};
                _this.itemsByGroupAndLeadTime["total"][leadTime] = _this.itemsByGroupAndLeadTime["total"][leadTime] || [];
                _this.itemsByGroupAndLeadTime["total"][leadTime].push(item);
            }
        });

        let traces = [];
        this.groups.forEach(group => {
            if(groupedCounts[group.id]) {
                traces = traces.concat(this.createTraces(groupedCounts[group.id], group));
            }
        });

        var yValues = Object.values(totalCounts);

        // add total here
        let totalGroup = this.groups.filter(group => group.total).find(group => true);
        if(totalGroup) {
            traces = traces.concat(this.createTraces(totalCounts, totalGroup));
        }

        traces = traces.concat([this.createMeanLine(leadTimes, yValues),
                                ...this.createDefaultDeviationLines(leadTimes, yValues) ]);

        return traces;
    }

    createMeanLine(leadTimes, yValues) {
        var meanLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;
        return {
          x: [meanLeadTime, meanLeadTime],
          y: [0, Math.max(...yValues)],
          mode: 'lines',
          line: {
            color: 'red',
            dash: 'dash',
          },
          name: 'Mean',
        };
    }

    createDefaultDeviationLines(leadTimes, yValues) {

        var meanLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;
        var stdDevLeadTime = Math.sqrt(leadTimes.map(x => Math.pow(x - meanLeadTime, 2)).reduce((a, b) => a + b, 0) / leadTimes.length);

        var stdDevLeftLine =  {
          x: [Math.max(0, meanLeadTime - stdDevLeadTime), Math.max(0, meanLeadTime - stdDevLeadTime)],
          y: [0, Math.max(...yValues)],
          mode: 'lines',
          line: {
            color: 'orange',
            dash: 'dash',
          },
          showlegend: false,
          name: 'Standard deviation',
        };

        var stdDevRightLine = {
          x: [meanLeadTime + stdDevLeadTime, meanLeadTime + stdDevLeadTime],
          y: [0, Math.max(...yValues)],
          mode: 'lines',
          line: {
            color: 'orange',
            dash: 'dash',
          },
          hides: stdDevLeftLine,
          name: 'Standard deviation',
        };

        return [ stdDevLeftLine, stdDevRightLine];
    }

    addGroup(groupId, groupConfiguration) {
        if(groupConfiguration.total) {
            this.totalTraceId = groupId;
        }

        this.groups.push({ ...groupConfiguration, id: groupId });
    }

    groupBy(groupByFunction) {
        this.groupByFunction = groupByFunction;
    }

    sortedBy(sortedByFunction) {
        this.sortedByFunction = sortedByFunction;
    }

    update(items) {

        this.addGroup("total", this.config.traceConfig);


        if(this.maxNumberOfItems > 0) {
            items.sort(this.sortedByFunction);
            items = items.slice(0, Math.min(this.maxNumberOfItems, items.length));
        }

        this.traces = this.createData(items)
        Plotly.newPlot(this.div, this.traces, this.layout, { responsive: true });
        let _this=this;

        this.div.on('plotly_legendclick', event => {
            let selectedTrace = _this.traces[event.curveNumber];
            let changingTraces = [ selectedTrace ];
            if(selectedTrace.hides) {
                changingTraces.push(selectedTrace.hides);
            }

            Plotly.restyle(_this.div, { "visible": _this.toggleVisibility(selectedTrace) }, _this.getIndexesForTraces(changingTraces));
        });

        this.div.on('plotly_legenddoubleclick', event => {
            let selectedTrace = _this.traces[event.curveNumber];
            let hideTraces = _this.traces.filter(trace => {
                return (trace != selectedTrace);
            });

            Plotly.restyle(_this.div, { "visible": _this.toggleVisibility(selectedTrace) }, _this.getIndexesForTraces(hideTraces));
            return false;
        });

        if(this.onClickHandler) {
            this.div.on('plotly_click', this.onClickHandler);
        }

        this.renderHeader(this.header);
    }

    toggleVisibility(trace) {
        if(trace.visible == 'legendonly') {
            return null;
        }

        return 'legendonly';
    }

    isVisible(trace) {
        return (trace.visible != 'legendonly');
    }

    getIndexesForTraces(selectedTraces) {
        var _this=this;
        return selectedTraces.map(selectedTrace => {
            return _this.traces.indexOf(selectedTrace);
        });
    }

    getItemsForVisibleTraces(leadTime) {

        let _this=this;

        let totalTrace = this.traces.find(trace => trace.id == _this.totalTraceId);
        if(totalTrace && this.isVisible(totalTrace)) {
            return _this.itemsByGroupAndLeadTime[this.totalTraceId][leadTime] || [];
        }

        let items=this.traces.filter(trace => trace.id && _this.isVisible(trace) && _this.itemsByGroupAndLeadTime[trace.id]).flatMap(trace => {
            return _this.itemsByGroupAndLeadTime[trace.id][leadTime] || [];
        });

        console.log("getItemsForVisibleTraces", items);
        return items;
    }

    click(handler) {
        let _this=this;

        this.onClickHandler = function(event) {
          var point = event.points[0];
          if (point !== undefined) {
            var x = point.data.x[point.pointIndex];
            let items=_this.getItemsForVisibleTraces(x);
            handler(x, items);
          }
        }
    }
}