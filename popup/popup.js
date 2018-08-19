const deleteIcon =
  '<svg height="24" width="24"><path d="M23 7h-2V5.005A2.002 2.002 0 0 0 19.003 3h-5.006A1.999 1.999 0 0 0 12 5.005V7H6v1h2v18.993A2.998 2.998 0 0 0 11 30h11c1.657 0 3-1.336 3-3.007V8h2V7h-4zM9 8v19.005C9 28.107 9.893 29 10.992 29h11.016A2 2 0 0 0 24 27.005V8H9zm3 2v17h1V10h-1zm4 0v17h1V10h-1zm4 0v17h1V10h-1zm-5.997-6A.998.998 0 0 0 13 4.999V7h7V4.999A.994.994 0 0 0 18.997 4h-4.994z" fill="#929292" fill-rule="evenodd"/></svg>'

class CorsifySettings {
  constructor() {
    this.enableCors = false
    this.enforceCorsForAllURLs = false
    this.whiteListedURLs = []
  }

  initialize() {
    this.populateData()
    this.initializeURLEnterForm()
    this.initializeEnableCors()
    this.initializeEnforceCORS()
  }

  setInnerHTML (target, html) {
    this.removeChildNodes(target)
    this.appendChildNodesFromHTML(target, html)
    return target
  }

  removeChildNodes (target) {
    while (target.hasChildNodes()) {
      target.removeChild(target.lastChild)
    }
  }

  appendChildNodesFromHTML (target, html) {
      const dom = new DOMParser().parseFromString(html, 'text/html').body
      while (dom.hasChildNodes()) {
        target.appendChild(dom.firstChild)
      }
  }

  initializeEnforceCORS() {
    let enforceCorsCheckboxElement = document.getElementById('enforce-cors')

    enforceCorsCheckboxElement.addEventListener('change', event => {
      this.enforceCorsForAllURLs = event.target.checked
      let gettingSettings = browser.storage.local.get('corsifySettings')
      gettingSettings.then(settings => {
        settings.corsifySettings.enforceCorsForAllURLs = this.enforceCorsForAllURLs
        browser.storage.local.set(settings)
        browser.runtime.sendMessage({
          type: 'enforceCorsForAllURLs',
          settings: settings.corsifySettings
        })
      })
    })
  }

  initializeEnableCors() {
    let enableCorsCheckboxElement = document.getElementById('enable-cors')

    enableCorsCheckboxElement.addEventListener('change', event => {
      this.enableCors = event.target.checked
      let gettingSettings = browser.storage.local.get('corsifySettings')

      gettingSettings.then(settings => {
        settings.corsifySettings.enableCors = this.enableCors
        browser.storage.local.set(settings)
        browser.runtime.sendMessage({
          type: 'enableCors',
          settings: settings.corsifySettings
        })
      })
    })
  }

  initializeURLEnterForm() {
    let whiteListFormElement = document.getElementById('whitelist-form')

    whiteListFormElement.addEventListener('submit', event => {
      event.preventDefault()
      let enterUrlInputElement = document.getElementById('enter-url')

      const urlInput = enterUrlInputElement.value
      if (urlInput === '') {
        return
      }
      enterUrlInputElement.value = ''

      let gettingSettings = browser.storage.local.get('corsifySettings')
      gettingSettings.then(settings => {
        let whiteListedURLs = settings.corsifySettings.whiteListedURLs || []

        if (whiteListedURLs.includes(urlInput)) {
          return
        }

        this.addListItem(urlInput)

        whiteListedURLs.push(urlInput)
        settings.corsifySettings.whiteListedURLs = whiteListedURLs
        browser.storage.local.set(settings)
        browser.runtime.sendMessage({
          type: 'whiteListedURLs',
          settings: settings.corsifySettings
        })
      })
    })
  }

  addListItem(url) {
    let whiteListedUrlsListElement = document.getElementById('whitelisted-urls-list')
    let urlElement = document.createElement('li')

    urlElement.className = 'whitelisted__url'

    let deleteIconContainer = document.createElement('span')
    deleteIconContainer.title = 'Delete this URL'

    deleteIconContainer.addEventListener('click', event => {
      const nearestURLElement = event.target.closest('.whitelisted__url')
      const urlToRemove = nearestURLElement.textContent

      whiteListedUrlsListElement.removeChild(nearestURLElement)

      let gettingSettings = browser.storage.local.get('corsifySettings')

      gettingSettings.then(settings => {
        let whiteListedURLs = settings.corsifySettings.whiteListedURLs || []

        settings.corsifySettings.whiteListedURLs = whiteListedURLs.filter(url => url !== urlToRemove)
        browser.storage.local.set(settings)
        browser.runtime.sendMessage({
          type: 'whiteListedURLs',
          settings: settings.corsifySettings
        })
      })
    })
    deleteIconContainer.className = 'delete__whitelist__url'
    this.setInnerHTML(deleteIconContainer, deleteIcon)
    
    let urlTextNode = document.createTextNode(url)

    urlElement.appendChild(urlTextNode)
    urlElement.appendChild(deleteIconContainer)
    whiteListedUrlsListElement.appendChild(urlElement)
  }

  populateData() {
    let gettingSettings = browser.storage.local.get('corsifySettings')

    gettingSettings.then(settings => {
      if (Object.keys(settings).length === 0) {
        browser.storage.local.set({
          corsifySettings: {
            enableCors: false,
            enforceCorsForAllURLs: false,
            whiteListedURLs: []
          }
        })
        return
      }

      let whiteListedURLs = settings.corsifySettings.whiteListedURLs || []

      if (whiteListedURLs.length > 0) {
        whiteListedURLs.forEach(url => {
          this.addListItem(url)
        })
      }
      
      let enforceCorsCheckboxElement = document.getElementById('enforce-cors')
      enforceCorsCheckboxElement.checked = settings.corsifySettings.enforceCorsForAllURLs
      let enableCorsCheckboxElement = document.getElementById('enable-cors')
      enableCorsCheckboxElement.checked = settings.corsifySettings.enableCors
    })
  }
}

let corsifySettingsInstance = new CorsifySettings()
corsifySettingsInstance.initialize()
