import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/fileSearch/FileSearch';
import FileList from './components/fileList/FileList';
import BottomBtn from './components/bottomBtn/BottomBtn';
import TabList from './components/tabList/TabList';
import Editor from './components/editor/Editor';
import defaultFiles from './utils/files'
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr } from './utils/helper'
import fileHelper from './utils/fileHelper';

const { join } = window.require('path')
const { app } = window.require('@electron/remote')

function App() {
  const [files, setFiles] = useState(flattenArr(defaultFiles))
  const filesArr = objToArr(files)

  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedIds, setUnSavedIds] = useState([])
  // 存储路径
  const saveLocation = app.getPath('documents')

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
    setActiveFileId(data.id)
    if (openedFileIds.includes(data.id)) return
    setOpenedFileIds([...openedFileIds, data.id])
  }
  const onFileDelete = data => {
    delete files[data.id]
    setFiles({ ...files })
    if (openedFileIds.includes(data.id)) {
      const newOpenedFileIds = openedFileIds.filter(item => item !== data.id)
      setOpenedFileIds(newOpenedFileIds)
    }
  }
  const onSaveEdit = (id, data, isNew) => {
    const newFile = {
      ...files[id],
      name: data,
      isNew: false
    }
    if (isNew) {
      fileHelper.writeFile(join(saveLocation, `${data}.md`), files[id].body).then(() => {
        setFiles({ ...files, [id]: newFile })
      })
    } else {
      fileHelper.renameFile(join(saveLocation, `${files[id].name}.md`), join(saveLocation, `${data}.md`)).then(() => {
        setFiles({ ...files, [id]: newFile })
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
    </div>
  );
}

export default App;
