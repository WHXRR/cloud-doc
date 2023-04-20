const { dialog, getCurrentWindow, app } = window.require('@electron/remote')
const Store = window.require('electron-store');
const settingsStore = new Store({ 'name': 'Settings' });

window.addEventListener('DOMContentLoaded', () => {
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
})