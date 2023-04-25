import React, { useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import "./Editor.scss"

const Editor = ({ value, changeEditor }) => {
  const autofocusNoSpellcheckerOptions = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
    };
  }, []);

  return (
    <SimpleMDE
      className="edit"
      key={1}
      value={value}
      onChange={changeEditor}
      options={autofocusNoSpellcheckerOptions}
    />
  )
}

export default Editor