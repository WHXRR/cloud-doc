import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'

import FileSearch from './components/fileSearch/FileSearch';
import FileList from './components/fileList/FileList';
import BottomBtn from './components/bottomBtn/BottomBtn';
import TabList from './components/tabList/TabList';
import Editor from './components/editor/Editor';
import defaultFiles from './utils/files'
import { useEffect, useState } from 'react';

function App() {

  const [files, setFiles] = useState(defaultFiles)
  const [activeFileId, setActiveFileId] = useState(0)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedIds, setUnSavedIds] = useState([])

  const openedFiles = openedFileIds.map(item => files.find(ele => ele.id === item))
  const activeFile = files.find(item => item.id === activeFileId)
  const onFileClick = data => {
    setActiveFileId(data.id)
    if (openedFileIds.includes(data.id)) return
    setOpenedFileIds([...openedFileIds, data.id])
    // const openedFileSet = new Set()
    // openedFileIds.forEach(item => {
    //   openedFileSet.add(item)
    // })
    // openedFileSet.add(data.id)
    // setOpenedFileIds([...openedFileSet])
  }
  const onFileDelete = data => {
    console.log(data, 'delete');
  }
  const onSaveEdit = (id, data) => {
    console.log(id, data, 'save');
  }

  const onTabClick = data => {
    setActiveFileId(data.id)
  }
  const onCloseTab = data => {
    const arr = [...openedFileIds]
    const index = arr.indexOf(data.id)
    arr.splice(index, 1)
    setOpenedFileIds([...arr])
  }

  const changeEditor = data => {
    console.log(data, 'editor');
  }
  return (
    <div className="App container-fluid px-0">
      <div className='row g-0'>
        <div className='col-3'>
          <FileSearch onFileSearch={(val) => console.log(val)} />
          <FileList
            files={files}
            onFileClick={onFileClick}
            onFileDelete={onFileDelete}
            onSaveEdit={onSaveEdit} />
          <BottomBtn />
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
