import { useEffect } from 'react';
const { ipcRenderer } = window.require('electron')

const useIpcRenderer = (ipcObj, deps) => {
  useEffect(() => {
    Object.keys(ipcObj).forEach(key => {
      ipcRenderer.on(key, ipcObj[key])
    })
    return () => {
      Object.keys(ipcObj).forEach(key => {
        ipcRenderer.removeListener(key, ipcObj[key])
      })
    }
  })
}

export default useIpcRenderer