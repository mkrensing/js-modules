import 'plotly.js'
import { CumulativeFlowDiagram } from './flow-cfd.js'
import { FlowDistributionChart } from './flow-distribution.js'
import { LeadTimeChart } from './flow-leadtime.js'
import { LeadTimeTrendChart } from './flow-leadtime-trend.js'
import { FlowPredictabilityChart } from './flow-predictability.js'
import { FlowVelocityChart } from './flow-velocity.js'

var charts = {
  name: 'charts.js',
  version: '1.0.0',
  CumulativeFlowDiagram: CumulativeFlowDiagram,
  FlowDistributionChart: FlowDistributionChart,
  LeadTimeChart: LeadTimeChart,
  LeadTimeTrendChart: LeadTimeTrendChart,
  FlowPredictabilityChart: FlowPredictabilityChart,
  FlowVelocityChart: FlowVelocityChart
};

export default charts