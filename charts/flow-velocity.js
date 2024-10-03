import { FlowChart } from './flow-chart.js'
import { median } from 'math-util'

export class FlowVelocityChart extends FlowChart {

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
          xaxis: { title: 'Iterations' },
          yaxis: { title: 'Flow Velocity' },
          yaxis2: {
            title: 'Mean',
            overlaying: 'y',
            side: 'right',
            zeroline: false,
            domain: [0, 1]
          }
        };
        this.header = [ { label: config.label }, { description: config.description } ];
        this.iterations = [];
        this.colors = config.colors || { count: 'blue', estimation: 'orange'};
        this.data = [];
        this.onClickHandler = null;
        this.estimationBar = true;
    }

    setIterations(iterations) {
        this.iterations = iterations;
    }

    setEstimationBar(showEstimationBar) {
      this.estimationBar = showEstimationBar;
    }

    createTraces(data) {

      return [ ...this.createCountTraces(data), ...this.createEstimationTraces(data) ]
    }

    createCountTraces(data) {

        let countValues = this.iterations.map(iteration => {
            return data.filter(item => { return item.iteration == iteration })[0].count;
        });
        let countMedianValues = this.iterations.map((iteration, index) => {
            return median(countValues.slice(0, index+1)) ;
        });

        let velocityCountTrace =  {
            x: this.iterations,
            y: countValues,
            text: countValues,
            textposition: 'auto',
            name: "Count",
            type: 'bar',
            marker: { color: this.colors.count },
          };

        let velocityCountMedianTrace =  {
            x: this.iterations,
            y: countMedianValues,
            text: countMedianValues,
            textposition: 'auto',
            hovertemplate: '%{text}',
            name: "Median (Count)",
            type: 'scatter',
            mode: 'lines+markers',
            yaxis: "y2"
          };


        return [ velocityCountTrace, velocityCountMedianTrace ];
    }

    createEstimationTraces(data) {

      if(! this.showEstimationBar) {
        return [];
      }

      let estimationValues = this.iterations.map(iteration => {
          return data.filter(item => { return item.iteration == iteration })[0].estimation;
      });
      let estimationMedianValues = this.iterations.map((iteration, index) => {
          return median(estimationValues.slice(0, index+1)) ;
      });


      let velocityEstimationTrace =  {
          x: this.iterations,
          y: estimationValues,
          text: estimationValues.map(count => { return count + " SP" }),
          textposition: 'auto',
          name: "Estimation (SP)",
          type: 'bar',
          marker: { color: this.colors.estimation },
        };

      let velocityEstimationMedianTrace =  {
          x: this.iterations,
          y: estimationMedianValues,
          text: estimationMedianValues.map(count => { return count + " SP" }),
          textposition: 'auto',
          hovertemplate: '%{text}',
          name: "Median (SP)",
          type: 'scatter',
          mode: 'lines+markers'
      };

      return [ velocityEstimationTrace, velocityEstimationMedianTrace];
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


    click(handler) {
        let _this=this;

        this.onClickHandler = function(event) {
          var point = event.points[0];
          if (point !== undefined) {
            var iterationName = point.x;
            handler(iterationName, _this.getIssuesForIteration(iterationName));
          }
        }
    }

    getIssuesForIteration(iterationName) {
        return this.data.filter(row => row.iteration == iterationName)[0].issues;
    }
}

