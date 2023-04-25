const { dialog, getCurrentWindow, app } = window.require('@electron/remote')
const { ipcRenderer } = window.require('electron')
const Store = window.require('electron-store');
const settingsStore = new Store({ 'name': 'Settings' });

window.addEventListener('DOMContentLoaded', () => {
  // nav 
  const nav = document.querySelectorAll('.nav-link')
  nav.forEach(ele => {
    ele.addEventListener('click', (e) => {
      nav.forEach(nav => {
        nav.classList.remove('active')
      })
      e.target.classList.add('active')
      document.querySelectorAll('.nav-container').forEach(nav => {
        nav.style.display = 'none'
      })
      const className = e.target.dataset.current
      document.querySelector('.' + className).style.display = 'block'
    })
  })

  // 保存储存地址
  const selectedBtn = document.querySelector('#selected-btn')
  const fileLocationIpt = document.querySelector('.save-location-ipt')
  let saveLocation = settingsStore.get('saveFileLocation') || app.getPath('documents')
  fileLocationIpt.value = saveLocation
  selectedBtn.addEventListener('click', () => {
    dialog.showOpenDialog({
      message: '请选择存储地址',
      properties: ['openDirectory']
    }).then(res => {
      if (!res.canceled) {
        saveLocation = res.filePaths[0]
        fileLocationIpt.value = saveLocation
      }
    })
  })
  const submitBtn = document.querySelector('#submit')
  submitBtn.addEventListener('click', () => {
    settingsStore.set('saveFileLocation', saveLocation)
    getCurrentWindow().close()
  })

  // 保存key
  const ids = ['access-key', 'secret-key', 'bucket-name']
  ids.forEach(selected => {
    document.getElementById(selected).value = settingsStore.get(selected) || ''
  })
  document.querySelector('#save-key').addEventListener('click', () => {
    ids.forEach(selected => {
      settingsStore.set(selected, document.getElementById(selected).value)
    })
    ipcRenderer.send('reload-menu')
    getCurrentWindow().close()
  })
})