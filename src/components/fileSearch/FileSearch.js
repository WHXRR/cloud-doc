import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types'
import useKeyPress from '../../hooks/useKeyPress'
import './FileSearch.scss'

const FileSearch = ({ title, onFileSearch, onCloseInput }) => {
  const [inputActive, setInputAction] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputActive) {
      inputRef.current.focus()
    }
  }, [inputActive])

  const handleChange = e => {
    setValue(e.target.value)
  }

  useEffect(() => {
    onFileSearch(value)
  }, [value])

  const closeInput = () => {
    setInputAction(false)
    setValue('')
    onCloseInput()
  }

  const isEnterPress = useKeyPress(13)
  const isEscPress = useKeyPress(27)
  useEffect(() => {
    if (isEnterPress && inputActive) {
      onFileSearch(value)
    } else if (isEscPress && inputActive) {
      closeInput()
    }
  }, [inputActive, isEnterPress, isEscPress])

  return (
    <div className="alert title-h d-flex align-items-center pointer mb-0 rounded-0">
      {
        !inputActive &&
        <div className="d-flex align-items-center fs-6 justify-content-between flex-grow-1">
          <div className="unselect">{title}</div>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-search-heart" viewBox="0 0 16 16" onClick={() => setInputAction(true)}>
            <path d="M6.5 4.482c1.664-1.673 5.825 1.254 0 5.018-5.825-3.764-1.664-6.69 0-5.018Z" />
            <path d="M13 6.5a6.471 6.471 0 0 1-1.258 3.844c.04.03.078.062.115.098l3.85 3.85a1 1 0 0 1-1.414 1.415l-3.85-3.85a1.007 1.007 0 0 1-.1-.115h.002A6.5 6.5 0 1 1 13 6.5ZM6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z" />
          </svg>
        </div>
      }
      {
        inputActive &&
        <div className="d-flex gap-3 align-items-center fs-6 justify-content-between flex-grow-1">
          <input ref={inputRef} className="form-control" value={value} onChange={handleChange} />
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-x-circle" viewBox="0 0 16 16" onClick={closeInput}>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
          </svg>
        </div>
      }
    </div>
  )
}

FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}
FileSearch.defaultProps = {
  title: '我的云文档'
}

export default FileSearch