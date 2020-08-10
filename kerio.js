const axios = require('axios')
const config = require('./config-local')

function Kerio (url) {
  this.url = url
  this.user = null
  this.pass = null

  this.api = axios.create({
    baseURL: url,
    timeout: 10000,
    headers: {
      Accept: 'application/json-rpc',
      'Content-Type': 'application/json-rpc; charset=UTF-8'
    }
  })

  this.auth = async function (user, pass) {
    console.log('inside auth')
    try {
      const response = await this.api.get('/', {
        data: {
          jsonrpc: '2.0',
          id: 1,
          method: 'Session.login',
          params: {
            userName: user,
            password: pass,
            application: { name: 'mailbot', vendor: 'uni', version: '0.1' }
          }
        }
      })
      this.user = user
      this.pass = pass
      this.api.defaults.headers.cookie = response.headers['set-cookie'][0]
      this.api.defaults.headers['x-token'] = response.data.result.token
      console.log('Authorization for user %s is completed', this.user)
      return this.api
    } catch (error) {
      console.log(error)
    }
  }

  this.getAllDomains = async function () {
    console.log('inside getAllDomains')
    try {
      const response = await this.api.get('/', {
        data: {
          jsonrpc: '2.0',
          id: 1,
          method: 'Domains.get',
          params: {
            query: {
              fields: ['id', 'name'],
              start: 0,
              limit: -1,
              orderBy: [{ columnName: 'name', direction: 'Asc' }]
            }
          }
        }
      })
      const domains = [...response.data.result.list]
      console.log('get all domains:', domains[0].name, ', etc ...')
      return domains
    } catch (error) {
      console.log(error)
    }
  }

  this.getDomainId = async function (name) {
    const domains = await this.getAllDomains()
    const foundDomain = domains.find(domain => domain.name === name)
    if (foundDomain) {
      return foundDomain.id
    }
  }

}

(async () => {
  const kerio = new Kerio(config.kerio.url)
  kerio.auth(config.kerio.user, config.kerio.pass)
    .then(api => {
      console.log('then auth:', api.defaults.headers['x-token'])
      kerio.getDomainId('briz2015.com')
        .then(id => console.log(id))
    })
})()
