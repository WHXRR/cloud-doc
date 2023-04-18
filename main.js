const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')

let mainWindow
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true
    }
  })
  const url = isDev ? 'http://localhost:3000' : '*'
  mainWindow.loadURL(url)
  require('@electron/remote/main').initialize()
  require('@electron/remote/main').enable(mainWindow.webContents)
})