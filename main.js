const { app, Menu, ipcMain } = require('electron')
const isDev = require('electron-is-dev')
const Store = require('electron-store');
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./src/AppWindow')
const { join } = require('path')
Store.initRenderer()

let mainWindow
app.on('ready', () => {
  const url = isDev ? 'http://localhost:3000' : '*'
  mainWindow = new AppWindow({}, url)
  mainWindow.on('close', () => {
    mainWindow = null
  })
  // 配置设置窗口
  ipcMain.on('open-settings-window', () => {
    const settingsURL = `file://${join(__dirname, './src/settings/index.html')}`
    let settingsWindow = new AppWindow({
      width: 500,
      height: 250,
      show: false,
      autoHideMenuBar: true,
      parent: mainWindow
    }, settingsURL)
    settingsWindow.on('close', () => {
      settingsWindow = null
    })
    require('@electron/remote/main').enable(settingsWindow.webContents)
  })
  require('@electron/remote/main').initialize()
  require('@electron/remote/main').enable(mainWindow.webContents)
  // 配置菜单
  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
})