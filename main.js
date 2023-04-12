const { app, BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')

let mainWindow
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true
    }
  })
  const url = isDev ? 'http://localhost:3000' : '*'
  mainWindow.loadURL(url)
})