import { RestClient } from './client.js'
import { getUrlParams } from './url.js'

var rest = {
  name: 'rest.js',
  version: '1.0.0',
  RestClient: RestClient,
  getUrlParams: getUrlParams
}

export default rest