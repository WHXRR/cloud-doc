import React from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "./Editor.scss"

const Editor = ({ value, changeEditor }) => {
  return (
    <SimpleMDE
      className="edit"
      value={value}
      onChange={changeEditor}
      options={{
        minHeight: 'calc(100vh - 140px)'
      }}
    />
  )
}

export default Editor