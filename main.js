const { app, Menu, ipcMain, dialog } = require('electron')
const { join, basename } = require('path')
const isDev = require('electron-is-dev')
const Store = require('electron-store')
const menuTemplate = require('./src/utils/menuTemplate')
const AppWindow = require('./src/AppWindow')
const Qiniu = require('./src/utils/qiniuManager')
const { flattenArr, objToArr } = require('./src/utils/helperCommonjs')

Store.initRenderer()
const fileStore = new Store({ 'name': 'Files Data' });
const settingsStore = new Store({ 'name': 'Settings' });
const createManager = () => {
  const accessKey = settingsStore.get('access-key')
  const secretKey = settingsStore.get('secret-key')
  const bucket = settingsStore.get('bucket-name')
  return new Qiniu(accessKey, secretKey, bucket)
}

const formatPutTime = (putTime) => Math.round(putTime / 10000)
const fileName = (name) => basename(name, '.md')
const saveLocation = settingsStore.get('saveFileLocation') || app.getPath('documents')

let mainWindow
app.on('ready', () => {
  const url = isDev ? 'http://localhost:3000' : `file://${join(__dirname, './build/index.html')}`
  mainWindow = new AppWindow({}, url)
  mainWindow.on('close', () => {
    mainWindow = null
  })
  // 配置 设置窗口
  ipcMain.on('open-settings-window', () => {
    const settingsURL = `file://${join(__dirname, './src/settings/index.html')}`
    let settingsWindow = new AppWindow({
      width: 500,
      height: 360,
      show: false,
      autoHideMenuBar: true,
      parent: mainWindow
    }, settingsURL)
    settingsWindow.on('close', () => {
      settingsWindow = null
    })
    // settingsWindow.removeMenu()
    require('@electron/remote/main').enable(settingsWindow.webContents)
  })
  require('@electron/remote/main').initialize()
  require('@electron/remote/main').enable(mainWindow.webContents)
  // 配置菜单
  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  // 更改云同步配置时更改菜单
  ipcMain.on('reload-menu', () => {
    const newMenu = process.platform === 'darwin' ? menu.items[2] : menu.items[1]
    const ids = ['access-key', 'secret-key', 'bucket-name']
    const canCloud = ids.every(id => !!settingsStore.get(id))
    newMenu.submenu.items.forEach(item => {
      item.enabled = canCloud
    })
  })
  // 云同步保存后自动上传
  ipcMain.on('upload-file', (e, { key, path }) => {
    createManager().uploadFile(key, path).then(res => {
      mainWindow.webContents.send('active-file-is-upload', true)
    }).catch((err) => {
      mainWindow.webContents.send('active-file-is-upload', false)
      dialog.showErrorBox('同步失败', err.body?.error || '请检查七牛云配置是否正确')
    })
  })
  // 从云端下载文件
  ipcMain.on('download-file', (e, { key, path, id }) => {
    createManager().getFile(key).then(res => {
      const files = fileStore.get('files') || {}
      const serverUpdatedTime = Math.round(res.putTime / 10000)
      const localUpdatedTime = files[id].updatedAt
      // 判断云端文件是否比本地文件新
      if (serverUpdatedTime > localUpdatedTime) {
        createManager().downLoadFile(key, path).then(() => {
          mainWindow.webContents.send('cloud-download-file', { status: 1, id })
        })
      } else {
        mainWindow.webContents.send('cloud-download-file', { status: 2, id })
      }
    }).catch(err => {
      if (err.statusCode === 612) {
        mainWindow.webContents.send('cloud-download-file', { status: 0, id })
      }
    })
  })
  // 上传所以本地文件到云端
  ipcMain.on('upload-all-to-cloud', () => {
    mainWindow.webContents.send('loading', true)
    const files = fileStore.get('files') || {}
    const uploadFilesArr = Object.values(files).map(({ name, path }) => createManager().uploadFile(`${name}.md`, path))
    Promise.all(uploadFilesArr).then(res => {
      dialog.showMessageBox({
        type: 'info',
        title: `成功上传了${res.length}个文件`,
        message: `成功上传了${res.length}个文件`
      })
      mainWindow.webContents.send('all-files-uploaded')
    }).catch((err) => {
      dialog.showErrorBox('同步失败', err.body?.error || '请检查七牛云配置是否正确')
    }).finally(() => {
      mainWindow.webContents.send('loading', false)
    })
  })
  // 删除云端文件
  ipcMain.on('delete-cloud-file', (e, key) => {
    mainWindow.webContents.send('loading', true)
    createManager().deleteFile(key).catch((err) => {
      dialog.showErrorBox('删除云端文件失败', err.body?.error || '请检查七牛云配置是否正确')
    }).finally(() => {
      mainWindow.webContents.send('loading', false)
    })
  })
  // 重命名云端文件
  ipcMain.on('rename-cloud-file', (e, { key, destKey }) => {
    mainWindow.webContents.send('loading', true)
    createManager().renameFile(key, destKey).catch((err) => {
      dialog.showErrorBox('同步云端文件失败', err.body?.error || '请检查七牛云配置是否正确')
    }).finally(() => {
      mainWindow.webContents.send('loading', false)
    })
  })
  // 从云端下载所有文件
  ipcMain.on('download-all-from-cloud', () => {
    const manager = createManager()
    mainWindow.webContents.send('loading', true)
    manager.getFileList().then(res => {
      // 获取本地store里的文件，并将其转为以name为key，其他属性为value的对象
      const localFiles = fileStore.get('files') || {}
      const localFilesArr = objToArr(localFiles)
      const flattenLocalFiles = flattenArr(localFilesArr, 'name')
      // 过滤云端文件，并输出下载文件的promise数组
      const filterCloudFiles = res.items.filter(item => {
        // 比较是否比本地文件新
        const isNew = flattenLocalFiles[fileName(item.key)]?.updatedAt && (formatPutTime(item.putTime) > flattenLocalFiles[fileName(item.key)]?.updatedAt)
        // 比较是否存在该本地文件
        const isExist = flattenLocalFiles[fileName(item.key)]
        if (!isExist) {
          item.isExist = false
        } else {
          item.isExist = true
          item.id = flattenLocalFiles[fileName(item.key)].id
        }
        return isNew || !isExist
      })
      const filterPromiseFiles = filterCloudFiles.map(item => {
        if (flattenLocalFiles[fileName(item.key)]) {
          return manager.downLoadFile(item.key, flattenLocalFiles[fileName(item.key)].path)
        } else {
          return manager.downLoadFile(item.key, join(saveLocation, item.key))
        }
      })
      Promise.all(filterPromiseFiles).then(res => {
        dialog.showMessageBox({
          type: 'info',
          title: `成功下载了${res.length}个文件`,
          message: `成功下载了${res.length}个文件`
        })
        mainWindow.webContents.send('download-all-cloud-files-result', filterCloudFiles)
      }).catch(err => {
        dialog.showErrorBox('从云端获取失败', err.body?.error || '请检查七牛云配置是否正确')
      }).finally(() => {
        mainWindow.webContents.send('loading', false)
      })
    }).catch(err => {
      dialog.showErrorBox('从云端获取失败', err.body?.error || '请检查七牛云配置是否正确')
    })
  })
})