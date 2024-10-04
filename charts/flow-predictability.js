import { FlowChart } from './flow-chart.js'
import { median } from 'math-util'

export class FlowPredictabilityChart extends FlowChart {

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
          barmode: 'group',
          yaxis: { title: 'Commitment & Velocity', side: 'right', autorange: true },
          yaxis2: {
            title: 'Predictability (%)',
            overlaying: 'y',
            side: 'left',
            range: [0, 150],
            showgrid: true,
            gridwidth: 1,
            zeroline: false,
            domain: [0, 1],
            autorange: false
          }
        };
        this.header = [ { label: config.label }, { description: config.description } ];
        this.colors = config.colors || { commitment: 'blue', velocity: 'orange'};
        this.textCallback = function(text) { return text };
        this.data = [];
        this.onClickHandler = null;
    }

    createData(data) {

        var iterations = data.iterations;
        var commitment = data.commitment.map(issues => issues.length);
        var velocity = data.velocity.map(issues => issues.length);

        let maxPredictability = this.layout.yaxis2.range[1];
        var predictability = commitment.map((c, index) => Math.min((velocity[index] / c) * 100, maxPredictability));

        return [
          {
            x: iterations,
            y: commitment,
            type: 'bar',
            name: 'Commitment',
            text: commitment.map(text => { return this.textCallback(text) }),
            textposition: 'auto',
            marker: { color: this.colors.commitment }
          },
          {
            x: iterations,
            y: velocity,
            type: 'bar',
            name: 'Velocity',
            text: velocity.map(text => { return this.textCallback(text) }),
            textposition: 'auto',
            marker: { color: this.colors.velocity },
          },
          {
            x: iterations,
            y: predictability,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Predictability',
            yaxis: 'y2'
          },
          {
            x: iterations,
            y: Array(iterations.length).fill(100),
            type: 'scatter',
            mode: 'lines',
            name: 'Predictability=100',
            line: {
              color: 'rgba(0, 0, 0, 0.3)',
              width: 2
            },
            yaxis: 'y2',
            showlegend: false,
            hoverinfo: 'skip'
          },
          {
            x: iterations,
            y: Array(iterations.length).fill(80),
            type: 'scatter',
            mode: 'lines',
            name: 'Predictability=80',
            line: {
              color: 'rgba(0, 0, 0, 0.3)',
              width: 2
            },
            fill: 'tonexty',
            fillcolor: 'rgba(255, 255, 0, 0.3)',
            yaxis: 'y2',
            showlegend: false,
            hoverinfo: 'skip'
          }
        ];
    }

    setTextCallback(callback) {
        this.textCallback = callback;
    }

    update(data) {
        this.data = data;
        let maxValue = Math.max(...data.velocity, ...data.commitment);
        this.layout.yaxis.range = [0, maxValue*2];

        Plotly.newPlot(this.div, this.createData(data), this.layout, { responsive: true });
        if(this.onClickHandler) {
            this.div.on('plotly_click', this.onClickHandler);
        }

        this.renderHeader(this.header);
    }

    getIssuesForIterationAndCategory(iterationName, categoryName) {

        var iterationIndex = this.data.iterations.indexOf(iterationName);
        if(!this.data[categoryName.toLowerCase()]) {
            return [];
        }
        return this.data[categoryName.toLowerCase()][iterationIndex];
    }

    click(handler) {
        let _this=this;

        this.onClickHandler = function(event) {
          var point = event.points[0];
          if (point !== undefined) {
            var iterationName = point.data.x[point.pointIndex];
            var categoryName = point.data.name;

            handler(iterationName, categoryName, _this.getIssuesForIterationAndCategory(iterationName, categoryName));
          }
        }
    }
}
