import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/fileSearch/FileSearch';
import FileList from './components/fileList/FileList';
import BottomBtn from './components/bottomBtn/BottomBtn';
import TabList from './components/tabList/TabList';
import Editor from './components/editor/Editor';
import useIpcRenderer from './hooks/useIpcRenderer'
import fileHelper from './utils/fileHelper';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr } from './utils/helper'
import { Modal } from 'antd';

const { join, basename, extname } = window.require('path')
const { app, dialog } = window.require('@electron/remote')

// 存储路径
const Store = window.require('electron-store');
const fileStore = new Store({ 'name': 'Files Data' });
const settingsStore = new Store({ 'name': 'Settings' });
const saveLocation = settingsStore.get('saveFileLocation') || app.getPath('documents')
const saveFilesToStore = (files) => {
  const filesObj = objToArr(files).reduce((pre, cur) => {
    pre[cur.id] = {
      id: cur.id,
      name: cur.name,
      path: cur.path,
      createdAt: cur.createdAt
    }
    return pre
  }, {})
  fileStore.set('files', filesObj)
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const filesArr = objToArr(files)

  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedIds, setUnSavedIds] = useState([])
  const [errorFileId, setErrorFileId] = useState(0)
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
    // 是否加载过文件内容
    if (!data.isLoaded) {
      fileHelper.readFile(data.path).then((res) => {
        const newFile = { ...data, body: res, isLoaded: true }
        setFiles({ ...files, [data.id]: newFile })
      }).catch(() => {
        // 手动删除本地文件后，会找不到文件导致报错
        // setOpen(true);
        setErrorFileId(data.id)
        handleErrorFile()
      })
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
      }).catch(() => {
        // setOpen(true);
        setErrorFileId(data.id)
        handleErrorFile()
      })
      // 如果打开的文件列表中有当前文件，则更新打开的文件列表
      if (openedFileIds.includes(data.id)) {
        const newOpenedFileIds = openedFileIds.filter(item => item !== data.id)
        setOpenedFileIds(newOpenedFileIds)
      }
    }
  }
  const onSaveEdit = (id, data, isNew) => {
    const newPath = join(saveLocation, `${data}.md`)
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
      }).catch(() => {
        // setOpen(true);
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
      dialog.showMessageBox({
        message: err,
        title: '警告',
        type: 'error',
      }).then(result => {
        console.log(result);
      })
    })
  }
  const handleSave = () => {
    fileHelper.writeFile(join(saveLocation, `${activeFile.name}.md`), activeFile.body).then(() => {
      const newUnSavedIds = unSavedIds.filter(id => id !== activeFileId)
      setUnSavedIds(newUnSavedIds)
    })
  }

  // dialog 
  const [open, setOpen] = useState(false);
  const handleOk = () => {
    const { [errorFileId]: value, ...afterDelete } = files
    setFiles(afterDelete)
    saveFilesToStore(afterDelete)
    setOpen(false);
  };

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
      setOpen(false);
    })
  }
  useEffect(() => {
    errorFileIdRef.current = errorFileId
  }, [errorFileId])

  useIpcRenderer({
    'save-file': handleSave,
    'create-new-file': onAddFile,
    'import-file': onImportFile,
    'close-file': () => onCloseTab({ id: activeFileId }),
  }, [activeFile])
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
            activeFileId ? <Editor value={activeFile?.body} changeEditor={changeEditor} /> : (
              <div className='empty'>
                <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" fill="currentColor" className="bi bi-cloudy" viewBox="0 0 16 16">
                  <path d="M13.405 8.527a5.001 5.001 0 0 0-9.499-1.004A3.5 3.5 0 1 0 3.5 14.5H13a3 3 0 0 0 .405-5.973zM8.5 5.5a4 4 0 0 1 3.976 3.555.5.5 0 0 0 .5.445H13a2 2 0 0 1-.001 4H3.5a2.5 2.5 0 1 1 .605-4.926.5.5 0 0 0 .596-.329A4.002 4.002 0 0 1 8.5 5.5z" />
                </svg>
              </div>
            )
          }
        </div>
      </div>
      <>
        <Modal
          title="提示"
          open={open}
          onOk={handleOk}
          cancelText='取消'
          okText='确认'
          onCancel={() => setOpen(false)}
        >
          <p>未找到该文件，是否删除？</p>
        </Modal>
      </>
    </div>
  );
}

export default App;
