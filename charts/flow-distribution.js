import { FlowChart } from './flow-chart.js'
import { median } from 'math-util'

export class FlowDistributionChart extends FlowChart {

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
          barmode: 'stack',
          xaxis: { title: 'Iterations' },
          yaxis: { title: 'Flow Distribution' },
          itemclick: false,
          itemdoubleclick: false
        };
        this.header = [ { label: config.label }, { description: config.description } ];
        this.types = [];
        this.iterations = [];
        this.showPercentValues = false;
        this.data = [];
        this.onClickHandler = null;
    }

    setTypes(types) {
        this.types = types;
    }

    setIterations(iterations) {
        this.iterations = iterations;
    }

    setPercentValues(showPercentValues) {
        this.showPercentValues = showPercentValues;
        if(this.showPercentValues) {
            this.layout.yaxis.range=[0, 100];
        }
    }

    getCounts(typeName, data) {
        return this.iterations.map(iteration => {
            return data.filter(row => { return row.iteration === iteration && row.type == typeName; }, 0)[0]?.count || 0;
        });
    }

    getItems(typeName, data) {
        return this.iterations.map(iteration => {
            return data.filter(row => { return row.iteration === iteration && row.type == typeName; }, 0)[0]?.count || 0;
        });
    }

    getPercents(type, data) {

        let _this=this;
        return this.iterations.map(iteration => {

            var iterationData = data.filter(row => { return row.iteration === iteration; });
            var total = iterationData.reduce((acc, obj) => { return acc+obj.count }, 0 );
            var typeCount = data.filter(row => { return row.iteration === iteration && row.type == type; }, 0)[0]?.count || 0;

            if(total > 0) {
                return (typeCount/total*100).toFixed(0);
            } else {
                return 0;
            }

        });
    }

    getText(counts, percents) {

        if(! this.showPercentValues) {
            return counts;
        }

        return zip([counts, percents]).map(unzip((count, percent) => {
            return count + " (" + percent + " %)";
        }));
    }

    createTraces(data) {

        var types = this.types.reverse();
        var _this=this;
        var plotData = types.filter(type => !type.hide).map(type => {
          var typeData = data.filter(row => { return row.type === type.name; });
          var counts = _this.getCounts(type.name, data);
          var percents = _this.getPercents(type.name, data);

          return {
            x: _this.iterations,
            y: _this.showPercentValues ? percents : counts,
            text: _this.getText(counts, percents),
            hovertemplate: '%{text}',
            textposition: 'auto',
            name: type.name,
            marker: { color: type.color },
            type: 'bar'
          };
        });

        return plotData;
    }

    update(data) {
        this.data = data;
        let traces = this.createTraces(data);
        Plotly.newPlot(this.div, traces, this.layout, { responsive: true });
        if(this.onClickHandler) {
            this.div.on('plotly_click', this.onClickHandler);
        }
        this.renderHeader(this.header);
    }

    getIssuesForIterationAndType(iterationName, typeName) {

        var issues = this.data.filter(row => {
            return row.iteration == iterationName && row.type == typeName
        }).flatMap(row => { return row.issues || [] }) ;

        return issues;
    }

    click(handler) {
        let _this=this;

        this.onClickHandler = function(event) {
          var point = event.points[0];
          if (point !== undefined) {
            var iterationName = point.x;
            var typeName = point.data.name;
            handler(iterationName, typeName, _this.getIssuesForIterationAndType(iterationName, typeName));
          }
        }
    }
}

function zip(arrays) {
     return arrays[0].map(function(_, i) {
        return arrays.map(function(array) { return array[i]; });
    });
}

function unzip(callback) {

    return function() {
        return callback(...arguments[0]);
    }
}
