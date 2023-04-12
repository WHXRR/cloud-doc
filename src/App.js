import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/fileSearch/FileSearch';
import FileList from './components/fileList/FileList';
import BottomBtn from './components/bottomBtn/BottomBtn';
import { files } from './utils/files'

function App() {
  const onFileClick = data => {
    console.log(data, 'click');
  }
  const onFileDelete = data => {
    console.log(data, 'delete');
  }
  const onSaveEdit = (id, data) => {
    console.log(id, data, 'save');
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
        <div className='col-9 bg-success'>2</div>
      </div>
    </div>
  );
}

export default App;
