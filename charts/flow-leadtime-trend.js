import { FlowChart } from './flow-chart.js'
import { median, clamp } from 'math-util'

export class LeadTimeTrendChart extends FlowChart {

    constructor($targetSelector, config) {
        super();
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
            itemdoubleclick: false,
            itemsizing: 'constant'
          }
        };

        this.header = [ { label: config.label }, { description: config.description } ];
        this.iterations = [];
        this.data = [];
        this.categories = {};
        this.onClickHandler = null;
        this.totalLeadTime = false;
    }

    setTotalLeadTime(totalLeadTime) {
        this.totalLeadTime = totalLeadTime;
    }

    createDefaultConfig(config) {
        config = config || {};
        config.label = config.label || "Leadtime-Trend Chart"
        config.xaxisTitle = config.xaxisTitle || "Iteration";
        config.yaxisTitle = config.yaxisTitle || "Leadtime (Mean)";
        config.dataLabel = config.dataLabel || "Leadtime";
        config.leadTimeFieldName = config.leadTimeFieldName || "leadTime";
        config.traceConfig = config.traceConfig || { name: config.dataLabel, fillcolor: '#8FBBD9', linecolor: '#689EC2', pointcolor: 'darkblue' }
        return config;
    }

    setIterations(iterations) {
        this.iterations = iterations;
    }

    setCategories(categories) {
        this.categories = categories;
    }

    update(data) {
        let _this=this;
        this.data = data;
        this.traces = this.createTraces(data)
        Plotly.newPlot(this.div, this.traces, this.layout, { responsive: true });
        this.div.on('plotly_legendclick', event => {
            let selectedTrace = _this.traces[event.curveNumber];
            let changingTraces = [ selectedTrace ];
            if(selectedTrace.hides) {
                changingTraces = [selectedTrace].concat(selectedTrace.hides);
            }

            Plotly.restyle(_this.div, { "visible": _this.toggleVisibility(selectedTrace) }, _this.getIndexesForTraces(changingTraces));
        });

        this.div.on('plotly_legenddoubleclick', event => {
            let selectedTrace = _this.traces[event.curveNumber];
            let hideTraces = _this.traces.filter(trace => {
                return (trace != selectedTrace) && !(selectedTrace.hides || []).includes(trace);
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

    getIndexesForTraces(selectedTraces) {
        var _this=this;
        return selectedTraces.map(selectedTrace => {
            return _this.traces.indexOf(selectedTrace);
        });
    }

    getLeadTimeValues(categoryName, data) {
        return this.iterations.map(iteration => {
            let dataForIterationAndCategory = data.filter(record => (record.iteration == iteration && record.category == categoryName));
            if(dataForIterationAndCategory.length == 0) {
                return 0;
            }
            return dataForIterationAndCategory[0].value;
        });
    }

    createTraces(data) {

        var _this=this;
        function createTrace(name, color, lineStyle, initialVisibiltyState, leadTimeValues) {

            const iterationAndValues = leadTimeValues.map((value, index) => {
                return { iteration: _this.iterations[index], value: value, index: index };
            }).filter(iterationAndValue => iterationAndValue.value > 0);

            const iterations = iterationAndValues.map(iterationAndValue => iterationAndValue.iteration);
            const values = iterationAndValues.map(iterationAndValue => iterationAndValue.value);
            const iterationsIndex = iterationAndValues.map(iterationAndValue => iterationAndValue.index);
            const trend = _this.getLinearTrend(iterationsIndex, values);

            const trendTrace = {
                x: iterations,
                y: trend,
                mode: 'lines',
                type: 'scatter',
                name: 'Trend: ' + name,
                line: { color: color },
                showlegend: false,
                visible: _this.getInitalVisibleState({ visible: initialVisibiltyState })
            };

            const windowSize = 3;  // Window size for moving average
            const movingAvg = _this.movingAverage(values, windowSize);

            const movingAvgTrace = {
                x: iterations,
                y: movingAvg,
                mode: 'lines',
                type: 'scatter',
                name: 'Moving Average: ' + name,
                line: { color: color, dash: 'dash' },
                showlegend: false,
                visible: _this.getInitalVisibleState({ visible: initialVisibiltyState })
            };

            // Data for the chart
            let yValues = leadTimeValues.map(value => value ? value: null);
            let itemCounts = _this.iterations.map(iteration => _this.getItemsForIterationAndCategory(iteration, name).length);
            let texts = _this.iterations.map((iteration, index) => iteration + ": " + yValues[index] + " Days (" + itemCounts[index] + " items)");
            let markerSizes = _this.iterations.map((iteration, index) => clamp(itemCounts[index], 8, 30));

            const actualTrace = {
                x: _this.iterations,
                y: yValues,
                text: texts,
                hovertemplate: '%{text}',
                type: 'scatter',
                name: name,
                marker: {
                    size: markerSizes,
                    color: color
                },
                line: { dash: lineStyle },
                mode: 'markers',
                hides: [trendTrace, movingAvgTrace],
                visible: _this.getInitalVisibleState({ visible: initialVisibiltyState })
            };

            return [ actualTrace, trendTrace, movingAvgTrace]

        }


        var traces = this.categories.flatMap(category => {
          var categoryData = data.filter(row => { return row.category === category.name; });
          var leadTimeValues = _this.getLeadTimeValues(category.name, categoryData);

          return createTrace(category.name, category.color, category.lineStyle || "solid", category.visible, leadTimeValues)
        });

        return traces;
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


    click(handler) {
        let _this=this;

        this.onClickHandler = function(event) {
          var point = event.points[0];
          if (point !== undefined) {
            let iterationName = point.data.x[point.pointIndex];
            let categoryName = point.data.name;
            let issues  = [];

            if(categoryName == "Total") {
                issues = _this.getItemsForIteration(iterationName);
            } else {
                issues = _this.getItemsForIterationAndCategory(iterationName, categoryName);
            }


            handler(iterationName, categoryName, issues);
          }
        }
    }

    getItemsForIteration(iterationName) {
        let filteredData = this.data.filter(record => (record.iteration == iterationName));

        if(filteredData.length == 0) {
            return []
        }

        return filteredData.flatMap(row => row.issues);
    }

    getItemsForIterationAndCategory(iterationName, categoryName) {
        let filteredData = this.data.filter(record => (record.iteration == iterationName && record.category == categoryName));

        if(filteredData.length == 0) {
            return []
        }

        return filteredData[0].issues;
    }

    movingAverage(arr, windowSize) {
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const windowValues = arr.slice(start, i + 1);
            const windowAverage = windowValues.reduce((sum, val) => sum + val, 0) / windowValues.length;
            result.push(windowAverage);
        }
        return result;
    }

    getLinearTrend(iterationIndexes, values) {
        const { slope, intercept } = this.linearRegression(iterationIndexes, values);
        return this.iterations.map((iteration, index) => Math.max(slope * index + intercept, 0));
    }

    getLogarithmicTrend(iterationIndexes, values) {
        const { slope, intercept } = this.logarithmicRegression(iterationIndexes, values);
        return this.iterations.map((iteration, index) => slope * Math.max(Math.log(index+1) + intercept, 0));
    }

    linearRegression(x, y) {

        const n = x.length;
        if(n == 0) {
            const slope = 0;
            const intercept = 0;
            return { slope, intercept };
        }

        const x_mean = x.reduce((a, b) => a + b) / n;
        const y_mean = y.reduce((a, b) => a + b) / n;

        const numerator = x.map((xi, i) => (xi - x_mean) * (y[i] - y_mean)).reduce((a, b) => a + b);
        const denominator = x.map(xi => (xi - x_mean) ** 2).reduce((a, b) => a + b);

        const slope = numerator / denominator;
        const intercept = y_mean - (slope * x_mean);
        return { slope, intercept };
    }

    logarithmicRegression(x, y) {

        var n = x.length;
        var sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;

        for (var i = 0; i < n; i++) {
            var log_x = Math.log(x[i] + 1); // +1 um log(0) zu vermeiden
            sum_x += log_x;
            sum_y += y[i];
            sum_xy += log_x * y[i];
            sum_xx += log_x * log_x;
        }

        var slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
        var intercept = (sum_y - slope * sum_x) / n;

        return {slope: slope, intercept: intercept};
    }


}