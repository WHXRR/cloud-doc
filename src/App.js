import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/fileSearch/FileSearch';
import FileList from './components/fileList/FileList';
import BottomBtn from './components/bottomBtn/BottomBtn';
import TabList from './components/tabList/TabList';
import Editor from './components/editor/Editor';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { objToArr } from './utils/helper'
import fileHelper from './utils/fileHelper';
import { Modal } from 'antd';

const { join } = window.require('path')
const { app } = window.require('@electron/remote')

const Store = window.require('electron-store');
const fileStore = new Store({ 'name': 'Files Data' });
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
// 存储路径
const saveLocation = app.getPath('documents')

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const filesArr = objToArr(files)

  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedIds, setUnSavedIds] = useState([])

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
        setOpen(true);
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
  const onImportFile = () => { }
  const handleSave = () => {
    fileHelper.writeFile(join(saveLocation, `${activeFile.name}.md`), activeFile.body).then(() => {
      const newUnSavedIds = unSavedIds.filter(id => id !== activeFileId)
      setUnSavedIds(newUnSavedIds)
    })
  }

  // dialog 
  const [open, setOpen] = useState(false);
  const handleOk = () => {
    const { [activeFileId]: value, ...afterDelete } = files
    setFiles(afterDelete)
    saveFilesToStore(afterDelete)
    setOpen(false);
  };
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
          <Editor value={activeFile?.body} changeEditor={changeEditor} />
          <button onClick={handleSave}>save</button>
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
