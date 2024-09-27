import { createReportConfig } from './jira-report.js'
import { getLeadtime } from './jira-leadtime.js'
import { createSnapshots, createSnapshot } from './jira-snapshot.js'
import { createIterations } from './iterations.js'
import { JiraRepository } from './jira-repository.js'

var jira = {
  name: 'charts.js',
  version: '1.0.0',
  createReportConfig: createReportConfig,
  createSnapshots: createSnapshots,
  createSnapshot: createSnapshot,
  createIterations: createIterations,
  JiraRepository: JiraRepository,
  getLeadtime: getLeadtime
}

export default jira