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

function App() {

  const [files, setFiles] = useState(defaultFiles)
  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedIds, setUnSavedIds] = useState([])

  const handleUpdate = (id, ...arg) => {
    return files.map(file => {
      if (file.id === id) {
        arg.forEach(item => {
          file[item.key] = item.value
        })
      }
      return file
    })
  }

  // search 
  const [searchFiles, setSearchFiles] = useState([])
  const onFileSearch = val => {
    const newFiles = files.filter(file => file.name.includes(val))
    setSearchFiles(newFiles)
  }
  useEffect(() => {
    onFileSearch()
  }, [files])
  const onCloseInput = () => {
    setSearchFiles([])
  }

  // fileList 
  const openedFiles = openedFileIds.map(item => files.find(ele => ele.id === item)).filter(Boolean)
  const activeFile = files.find(item => item.id === activeFileId)
  const onFileClick = data => {
    setActiveFileId(data.id)
    if (openedFileIds.includes(data.id)) return
    setOpenedFileIds([...openedFileIds, data.id])
  }
  const onFileDelete = data => {
    const newFile = files.filter(file => file.id !== data.id)
    setFiles(newFile)
    if (openedFileIds.includes(data.id)) {
      const newOpenedFileIds = openedFileIds.filter(item => item !== data.id)
      setOpenedFileIds(newOpenedFileIds)
    }
  }
  const onSaveEdit = (id, data) => {
    const newFile = handleUpdate(id, { key: 'name', value: data }, { key: 'isNew', value: false })
    setFiles(newFile)
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
    const newFile = handleUpdate(activeFileId, { key: 'body', value: data })
    setFiles(newFile)
    if (unSavedIds.includes(activeFileId)) return
    setUnSavedIds([...unSavedIds, activeFileId])
  }

  // bottombtn 
  const onAddFile = () => {
    const id = uuidv4()
    const newFiles = [
      ...files,
      {
        id,
        name: '',
        body: '',
        createdAt: new Date().getTime(),
        isNew: true
      }
    ]
    setFiles(newFiles)
  }
  const onImportFile = () => { }
  return (
    <div className="App container-fluid px-0">
      <div className='row g-0'>
        <div className='col-3'>
          <FileSearch onFileSearch={onFileSearch} onCloseInput={onCloseInput} />
          <FileList
            files={searchFiles.length ? searchFiles : files}
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
        </div>
      </div>
    </div>
  );
}

export default App;
