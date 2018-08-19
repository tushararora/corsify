class Corsify {
  constructor() {
    this.settings = {}
  }

  initialize() {
    let gettingSettings = browser.storage.local.get('corsifySettings')
    gettingSettings.then(settings => {
      this.settings = settings.corsifySettings || {}
    })
    this.addBackgroundMessageListener()
  }

  addBackgroundMessageListener() {
    browser.runtime.onMessage.addListener(message => {
      
      let handleRequest = this.handleRequest.bind(this)
      let handleResponse = this.handleResponse.bind(this)

      this.settings = message.settings

      if (message.type === 'enableCors') {
        if (this.settings.enableCors) {
          this.addWebRequestListeners()
        } else {
          browser.webRequest.onBeforeSendHeaders.removeListener(handleRequest)
          browser.webRequest.onHeadersReceived.removeListener(handleResponse)
        }
      } else if (message.type === 'enforceCorsForAllURLs' || message.type === 'whiteListedURLs') {
        browser.webRequest.onBeforeSendHeaders.removeListener(handleRequest)
        browser.webRequest.onHeadersReceived.removeListener(handleResponse)

        if(!this.settings.enableCors) {
          return
        }
        this.addWebRequestListeners()
      }
    })
  }

  addWebRequestListeners() {
    let handleRequest = this.handleRequest.bind(this)
    let handleResponse = this.handleResponse.bind(this)
    let urls = []

    if (('enforceCorsForAllURLs' in this.settings) && this.settings.enforceCorsForAllURLs) {
      urls = ['<all_urls>']
    } else if (('whiteListedURLs' in this.settings) && Array.isArray(this.settings.whiteListedURLs) && this.settings.whiteListedURLs.length > 0) {
      urls = this.settings.whiteListedURLs
    } else {
      return
    }
    
    browser.webRequest.onBeforeSendHeaders.addListener(
      handleRequest,
      { urls },
      ['blocking', 'requestHeaders']
    )

    browser.webRequest.onHeadersReceived.addListener(
      handleResponse,
      { urls },
      ['blocking', 'responseHeaders']
    )
  }

  handleRequest() {}

  handleResponse(response) {
    let headersIndex = response.responseHeaders.length

    while(--headersIndex) {
      if(response.responseHeaders[headersIndex].name.toLowerCase() === 'access-control-allow-origin') {
        response.responseHeaders[headersIndex].value = '*'
        break
      }
    }
    if (headersIndex === 0) { //if we didn't find it len will be zero
      response.responseHeaders.push({
        name: 'access-control-allow-origin',
        value: '*'
      })
    }
    return {
      responseHeaders: response.responseHeaders
    }
  }
}

let corsifyInstance = new Corsify()
corsifyInstance.initialize()
