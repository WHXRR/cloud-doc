const { BrowserWindow } = require('electron')

class AppWindow extends BrowserWindow {
  constructor(config, url) {
    const defaultConfig = {
      width: 1200,
      height: 800,
      show: false,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        nodeIntegrationInWorker: true
      }
    }
    const finalConfig = { ...defaultConfig, ...config }
    super(finalConfig)
    this.loadURL(url)
    this.once('ready-to-show', () => {
      this.show()
    })
  }
}

module.exports = AppWindow