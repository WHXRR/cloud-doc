import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/fileSearch/FileSearch';
import FileList from './components/fileList/FileList';
import BottomBtn from './components/bottomBtn/BottomBtn';
import TabList from './components/tabList/TabList';
import Editor from './components/editor/Editor';
import Loading from './components/loading/Loading';
import useIpcRenderer from './hooks/useIpcRenderer'
import fileHelper from './utils/fileHelper';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr, timeStampToString, isOnLine } from './utils/helper'

const { join, basename, extname } = window.require('path')
const { app, dialog } = window.require('@electron/remote')
const { ipcRenderer } = window.require('electron')

// 存储路径
const Store = window.require('electron-store');
const fileStore = new Store({ 'name': 'Files Data' });
const settingsStore = new Store({ 'name': 'Settings' });
const saveLocation = settingsStore.get('saveFileLocation') || app.getPath('documents')
const saveFilesToStore = (files) => {
  const filesObj = objToArr(files).reduce((pre, cur) => {
    const { id, name, path, isSync, createdAt, updatedAt } = cur
    pre[id] = {
      id,
      name,
      path,
      isSync,
      createdAt,
      updatedAt
    }
    return pre
  }, {})
  fileStore.set('files', filesObj)
}

// 获取云同步是否可用，自动同步是否勾选
const getAutoSync = () => ['access-key', 'secret-key', 'bucket-name', 'enableAutoSync'].every(id => !!settingsStore.get(id))

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const filesArr = objToArr(files)

  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedIds, setUnSavedIds] = useState([])
  const [errorFileId, setErrorFileId] = useState(0)
  const [loading, setLoading] = useState(false)
  // dialog中获取不到useState更新后的最新值，需用useRef跟useEffect来获取最新值
  const errorFileIdRef = useRef(errorFileId)

  // search 
  const [searchFiles, setSearchFiles] = useState([])
  const onFileSearch = val => {
    const newFiles = filesArr.filter(file => file.name.includes(val))
    setSearchFiles(newFiles)
  }
  useEffect(() => {
    onFileSearch()
  }, [files])
  const onCloseInput = () => {
    setSearchFiles([])
  }

  // fileList 
  const openedFiles = openedFileIds.map(item => files[item]).filter(Boolean)
  const activeFile = files[activeFileId]
  const onFileClick = data => {
    const { path, id } = data
    // 是否加载过文件内容
    if (!data.isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${data.name}.md`, path, id })
      } else {
        fileHelper.readFile(data.path).then((res) => {
          const newFile = { ...data, body: res, isLoaded: true }
          setFiles({ ...files, [data.id]: newFile })
        }).catch(() => {
          // 手动删除本地文件后，会找不到文件导致报错
          setErrorFileId(data.id)
          handleErrorFile()
        })
      }
    }
    setActiveFileId(data.id)
    if (openedFileIds.includes(data.id)) return
    setOpenedFileIds([...openedFileIds, data.id])
  }
  const onFileDelete = data => {
    // 如果是新建的文件，删除时不用删除store跟本地文件，只需删除内存中的
    if (data.isNew) {
      const { [data.id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[data.id].path).then(() => {
        const { [data.id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        // 如果有云同步，则需把云端的也删除
        if (data.isSync && isOnLine && getAutoSync()) {
          ipcRenderer.send('delete-cloud-file', `${data.name}.md`)
        }
      }).catch(() => {
        setErrorFileId(data.id)
        handleErrorFile()
      })
      // 如果打开的文件列表中有当前删除的文件，则更新打开的文件列表
      if (openedFileIds.includes(data.id)) {
        const newOpenedFileIds = openedFileIds.filter(item => item !== data.id)
        setOpenedFileIds(newOpenedFileIds)
      }
    }
  }
  const onSaveEdit = (id, data, isNew) => {
    const newPath = join(saveLocation, `${data}.md`)
    const oldFile = files[id]
    const newFile = {
      ...files[id],
      name: data,
      path: newPath,
      isNew: false
    }
    const newFiles = { ...files, [id]: newFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      fileHelper.renameFile(join(saveLocation, `${files[id].name}.md`), newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (oldFile.isSync && isOnLine && getAutoSync()) {
          ipcRenderer.send('rename-cloud-file', {
            key: `${oldFile.name}.md`,
            destKey: `${data}.md`
          })
        }
      }).catch(() => {
        setErrorFileId(id)
        handleErrorFile()
      })
    }
  }

  // tabList 
  const onTabClick = data => {
    setActiveFileId(data.id)
  }
  const onCloseTab = data => {
    const arr = [...openedFileIds]
    const index = arr.indexOf(data.id)
    if (index === -1) return
    arr.splice(index, 1)
    setOpenedFileIds([...arr])
  }
  useEffect(() => {
    if (openedFileIds.includes(activeFileId)) return
    setActiveFileId(openedFileIds[0])
  }, [openedFileIds])

  // editor 
  const changeEditor = data => {
    const newFile = {
      ...files[activeFileId],
      body: data
    }
    setFiles({ ...files, [activeFileId]: newFile })
    if (unSavedIds.includes(activeFileId)) return
    setUnSavedIds([...unSavedIds, activeFileId])
  }

  // bottombtn 
  const onAddFile = () => {
    const id = uuidv4()
    const newFile = {
      id,
      name: '',
      body: '',
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({ ...files, [id]: newFile })
  }
  const onImportFile = () => {
    dialog.showOpenDialog({
      title: '请选择要导入的 MarkDown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'MarkDown files', extensions: ['md'] },
      ]
    }).then(res => {
      if (!res.canceled) {
        const newFiles = res.filePaths.map(path => {
          // 获取导入的文件的信息
          let fileNameSuffix = extname(path)
          let fileName = basename(path, fileNameSuffix)
          // 相同名字的在文件名后面加索引
          const sameFileNameArr = filesArr.filter(file => file.name === fileName)
          if (sameFileNameArr.length) {
            fileName = `${fileName}(${sameFileNameArr.length})`
          }
          const id = uuidv4()
          const newPath = join(saveLocation, `${fileName}.md`)
          fileHelper.readFile(path).then((fileBody) => {
            fileHelper.writeFile(newPath, fileBody)
          })
          return {
            id,
            path: newPath,
            name: fileName,
            createdAt: new Date().getTime(),
            isNew: false
          }
        })
        // 读取导入文件的内容
        setFiles({ ...files, ...flattenArr(newFiles) })
        saveFilesToStore({ ...files, ...flattenArr(newFiles) })
      }
    }).catch(err => {
      dialog.showErrorBox('警告', err)
    })
  }
  const handleSave = () => {
    if (!activeFileId) return
    if (!unSavedIds.includes(activeFileId)) return
    const { name, body, id } = activeFile
    fileHelper.writeFile(join(saveLocation, `${name}.md`), body).then(() => {
      const newUnSavedIds = unSavedIds.filter(id => id !== activeFileId)
      setUnSavedIds(newUnSavedIds)
      // 更新updatedAt
      const newFile = {
        ...files[id],
        updatedAt: new Date().getTime()
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {
          key: `${name}.md`,
          path: join(saveLocation, `${name}.md`)
        })
      }
    })
  }

  // dialog 
  const handleErrorFile = () => {
    dialog.showMessageBox({
      message: '未找到该文件，是否删除？',
      title: '提示',
      type: 'info',
      buttons: ['取消', '确认']
    }).then(result => {
      if (!result.response) return
      const { [errorFileIdRef.current]: value, ...afterDelete } = files
      setFiles(afterDelete)
      saveFilesToStore(afterDelete)
    })
  }
  useEffect(() => {
    errorFileIdRef.current = errorFileId
  }, [errorFileId])

  const activeFileUpload = (e, flag) => {
    const modifiedFile = { ...files[activeFileId], isSync: flag, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [activeFileId]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  const activeFileDownLoad = (e, { status, id }) => {
    const file = files[id]
    const { path } = file
    fileHelper.readFile(path).then(data => {
      let newFile = null
      if (status === 1) {
        newFile = { ...files[id], body: data, isLoaded: true, isSync: true, updatedAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: data, isLoaded: true }
      }
      setFiles({ ...files, [id]: newFile })
      saveFilesToStore({ ...files, [id]: newFile })
    })
  }

  const onAllFilesUploaded = () => {
    const newFiles = objToArr(files).reduce((pre, cur) => {
      const { id } = cur
      pre[id] = {
        ...cur,
        isSync: true,
        updatedAt: new Date().getTime()
      }
      return pre
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  const onDownLoadAllCloudFiles = (e, data) => {
    const newFiles = { ...files }
    data.forEach(file => {
      if (!file.isExist) {
        const id = uuidv4()
        const newFile = {
          id,
          name: basename(file.key, '.md'),
          path: join(saveLocation, file.key),
          isSync: true,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        }
        newFiles[id] = newFile
      } else {
        const newFile = {
          ...files[file.id],
          updatedAt: new Date().getTime()
        }
        newFiles[file.id] = newFile
      }
    })
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  useIpcRenderer({
    'save-file': handleSave,
    'create-new-file': onAddFile,
    'import-file': onImportFile,
    'close-file': () => onCloseTab({ id: activeFileId }),
    'active-file-is-upload': activeFileUpload,
    'cloud-download-file': activeFileDownLoad,
    'loading': (e, flag) => setLoading(flag),
    'all-files-uploaded': onAllFilesUploaded,
    'download-all-cloud-files-result': onDownLoadAllCloudFiles,
  })
  return (
    <div className="App container-fluid px-0">
      <div className='row g-0'>
        <div className='col-3'>
          <FileSearch onFileSearch={onFileSearch} onCloseInput={onCloseInput} />
          <FileList
            files={searchFiles.length ? searchFiles : filesArr}
            activeId={activeFileId}
            onFileClick={onFileClick}
            onFileDelete={onFileDelete}
            onSaveEdit={onSaveEdit} />
          <BottomBtn onAddFile={onAddFile} onImportFile={onImportFile} />
        </div>
        <div className='col-9 right-container'>
          <TabList
            files={openedFiles}
            activeId={activeFileId}
            unSaveId={unSavedIds}
            onTabClick={onTabClick}
            onCloseTab={onCloseTab}
          />
          {
            activeFileId ? (
              <>
                <Editor value={activeFile?.body} changeEditor={changeEditor} />
                {
                  activeFile?.isSync && (
                    <div className='cloud'>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cloud-check-fill" viewBox="0 0 16 16">
                        <path d="M8 2a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 6.095 0 7.555 0 9.318 0 11.366 1.708 13 3.781 13h8.906C14.502 13 16 11.57 16 9.773c0-1.636-1.242-2.969-2.834-3.194C12.923 3.999 10.69 2 8 2zm2.354 4.854-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708z" />
                      </svg>
                      <span style={{ marginLeft: '5px' }}>云同步完成</span>
                      <span style={{ marginLeft: '5px' }}>{timeStampToString(activeFile?.updatedAt)}</span>
                    </div>
                  )
                }
              </>
            ) : (
              <div className='empty'>
                <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="currentColor" className="bi bi-cloudy" viewBox="0 0 16 16">
                  <path d="M13.405 8.527a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 14.5H13a3 3 0 0 0 .405-5.973zM8.5 5.5a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1-.001 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 5.5z" />
                </svg>
              </div>
            )
          }
        </div>
      </div>
      {loading && <Loading />}
    </div>
  );
}

export default App;
