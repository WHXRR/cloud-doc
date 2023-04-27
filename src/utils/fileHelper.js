const fs = window.require('fs').promises

const fileHelper = {
  readFile: (path) => fs.readFile(path, { encoding: 'utf8' }),
  writeFile: (path, content) => fs.writeFile(path, content, { encoding: 'utf8' }),
  renameFile: (path, newPath) => fs.rename(path, newPath),
  deleteFile: (path) => fs.unlink(path)
}

export default fileHelper