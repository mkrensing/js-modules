import { FlowChart } from './flow-chart.js'
import { median } from 'math-util'

export class CumulativeFlowDiagram extends FlowChart {

    constructor($targetSelector, config) {
        super();
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
          xaxis: { title: 'Time' },
          yaxis: { title: 'Items' },
          legend: {
            traceorder: 'normal',
            itemclick: false,
            itemdoubleclick: false
          }
        };
        this.header = [ { label: config.label }, { description: config.description } ];
        this.data = [];
        this.transformedData = [];
        this.categories=[];
        this.onClickHandler = null;
    }

    setCategories(categories) {
        this.categories = categories;
    }

    createLabel(transformedRow) {

        let label = "" + transformedRow.all.length;
        if(transformedRow.added.length > 0) {
            label = label + " +" + transformedRow.added.length;
        }

        if(transformedRow.removed.length > 0) {
            label = label + " -" + transformedRow.removed.length;
        }

        return label;
    }

    createTraces(transformedData, configuration) {
        var _this=this;
        var iterations = transformedData.map(row => { return row.iteration; });
        var cumulativeValues = {};
        var traces = [];
        var datapointTraces = [];

        this.categories.forEach(category => {

            var yValues = transformedData.map(row => {
                cumulativeValues[row.iteration] = cumulativeValues[row.iteration] || 0;
                if(! configuration?.skip.includes(category.id)) {
                    cumulativeValues[row.iteration] += row[category.id].all.length;
                }
                return cumulativeValues[row.iteration];
            });

            var iterationsWithNonZeroValues = iterations.filter(iteration => {
                return transformedData.filter(row => { return (row.iteration == iteration) }).map(row => { return row[category.id].all.length > 0 })[0];
              });

            var yValuesWithoutZeroValues = yValues.filter((value, index) => {
                return transformedData[index][category.id].all.length > 0;
              });

            var texts = transformedData.filter(row => row[category.id].all.length > 0).map(row => _this.createLabel(row[category.id]));

            var dataPointTrace = {
              x: iterationsWithNonZeroValues,
              y: yValuesWithoutZeroValues,
              text: texts,
              hovertemplate: '%{text}',
              mode: 'markers',
              marker: {
                color: category.linecolor,
                symbol: 'circle',
              },
              name: category.name || category.id,
              id: category.id + " Datapoint",
              showlegend: false,
            };

            var lineTrace = {
                x: iterations,
                y: yValues,
                hoverinfo: 'skip',
                fill: 'tonexty',
                fillcolor: category.fillcolor,
                marker: {
                    color: category.linecolor
                },
                type: 'scatter',
                mode: 'lines',
                id: category.id,
                name: category.name || category.id,
                hides: dataPointTrace
            };

            traces.push(lineTrace);
            datapointTraces.push(dataPointTrace);
        });

        return [ ...traces, ...datapointTraces ];
    }

    transformData(data) {
        let _this=this;
        return data.map((row, index) => {

            let transformedRow = { iteration: row.iteration }

            if(index > 0) {
                let previousRow = data[index-1];
                _this.categories.forEach(category => {
                    let added = row[category.id].filter(issue => !previousRow[category.id].some(previousIssue => previousIssue.key === issue.key));
                    let removed = previousRow[category.id].filter(previousIssue => !row[category.id].some(issue => issue.key === previousIssue.key));
                    transformedRow[category.id] = { added: added, removed: removed, all: row[category.id] };
                });
            } else {
                _this.categories.forEach(category => {
                    transformedRow[category.id] = { added: row[category.id], removed: [], all: row[category.id] };
                });
            }

            return transformedRow
        });
    }

    update(data, configuration) {
        this.data = data;
        this.transformedData = this.transformData(data);

        let traces = this.createTraces(this.transformedData, configuration);
        Plotly.newPlot(this.div, traces, this.layout, { responsive: true });
        let _this=this;

        this.div.on('plotly_legendclick', event => {
            let selectedTrace = traces[event.curveNumber];

            Plotly.restyle(_this.div, { "visible": _this.toggleVisibility(selectedTrace)   }, _this.getIndexesForTraces(traces, [selectedTrace, selectedTrace.hides ]));

            let skippedTraceIds = traces.filter(trace => { return ! _this.isVisible(trace) }).map(trace => { return trace.id; });
            let newTraces = _this.update(data, { skip:  skippedTraceIds });
            let hideTraces = newTraces.filter(trace => { return skippedTraceIds.includes(trace.id) });

            if(hideTraces.length > 0) {
                Plotly.restyle(_this.div, { "visible": 'legendonly' }, _this.getIndexesForTraces(newTraces, hideTraces));
            }

        });

        if(this.onClickHandler) {
            this.div.on('plotly_click', this.onClickHandler);
        }

        if(!configuration) {
            // renderHeader only during the first call of update()
            this.renderHeader(this.header);
        }


        return traces;
    }

    isVisible(trace) {
        return (trace.visible != 'legendonly');
    }

    toggleVisibility(trace) {
        if(trace.visible == 'legendonly') {
            return null;
        }

        return 'legendonly';
    }

    getIndexesForTraces(traces, selectedTraces) {
        return selectedTraces.map(selectedTrace => {
            return traces.indexOf(selectedTrace);
        });
    }

    click(handler) {
        let _this=this;

        this.onClickHandler = function(event) {

              var point = event.points[0];
              if (point !== undefined) {
                var iteration = point.x;
                var category = point.data.name;
                handler(iteration, category, _this.getItemsForIterationAndCategory(iteration, category));
              }
        };
    }

    getItemsForIterationAndCategory(iteration, category) {
        return this.transformedData.filter(row => row.iteration == iteration).flatMap(row => row[category].added);
    }
}