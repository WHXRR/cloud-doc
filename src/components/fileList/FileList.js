import React, { useState, useEffect, useRef } from "react";
import { message } from 'antd';
import PropTypes from 'prop-types'
import useKeyPress from '../../hooks/useKeyPress'
import classNames from 'classnames'
import useContextMenu from "../../hooks/useContextMenu";
import { getTargetNode } from "../../utils/helper"
import './FileList.scss'

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete, activeId }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isEdit, setIsEdit] = useState('')
  const [value, setValue] = useState('')
  const handleEdit = (e, data) => {
    e.stopPropagation();
    setIsEdit(data.id)
    setValue(data.name)
  }
  const inputRef = useRef(null)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEdit])
  const handleInputClick = e => {
    e.stopPropagation();
  }
  const saveFile = (data) => {
    if (files.filter(file => (file.name === value) && (file.id !== isEdit)).length) return messageApi.warning('有重复的名称!');
    if (data.isNew && !value) {
      onFileDelete(data)
    } else {
      onSaveEdit(data.id, value, data.isNew)
    }
    setIsEdit('')
  }
  // 输入框失焦事件，加定时器防止与submit事件冲突
  const handleCancel = (data) => {
    saveFile(data)
  }
  const handleDelete = (e, data) => {
    e.stopPropagation();
    onFileDelete(data)
  }

  // 键盘事件
  const isEnterPress = useKeyPress(13)
  const isEscPress = useKeyPress(27)
  useEffect(() => {
    const file = files.find(item => item.id === isEdit)
    if (isEnterPress && isEdit) {
      saveFile(file)
    } else if (isEscPress && isEdit) {
      setIsEdit('')
      if (file.isNew) {
        onFileDelete(file)
      }
    }
  }, [isEnterPress, isEscPress])

  // 新建文件时
  useEffect(() => {
    const newFile = files.find(file => file.isNew)
    if (newFile) {
      setIsEdit(newFile.id)
      setValue(newFile.name)
    }
  }, [files])

  // 添加上下文菜单
  const clickedMenu = useContextMenu([
    {
      label: '打开',
      click: () => {
        const targetEle = getTargetNode(clickedMenu.current, 'file-item')
        if (!targetEle) return
        const file = JSON.parse(targetEle.dataset.file)
        onFileClick(file)
      }
    },
    {
      label: '删除',
      click: () => {
        const targetEle = getTargetNode(clickedMenu.current, 'file-item')
        if (!targetEle) return
        const file = JSON.parse(targetEle.dataset.file)
        onFileDelete(file)
      }
    },
    {
      label: '重命名',
      click: () => {
        const targetEle = getTargetNode(clickedMenu.current, 'file-item')
        if (!targetEle) return
        const file = JSON.parse(targetEle.dataset.file)
        setIsEdit(file.id)
        setValue(file.name)
      }
    }
  ], '.list-group', [files])
  return (
    <div className="file-list">
      {contextHolder}
      <ul className="list-group list-group-flush">
        {
          files.map(file => {
            const className = classNames({
              'list-group-item': true,
              'file-item': true,
              'is-active': file.id === activeId,
            })
            return (
              <li
                className={className}
                key={file.id}
                data-file={JSON.stringify(file)}
                onClick={() => onFileClick(file)}
              >
                <div className="d-flex align-items-center">
                  <div className="file-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-earmark-text-fill" viewBox="0 0 16 16">
                      <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0zM9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1zM4.5 9a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM4 10.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm.5 2.5a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1h-4z" />
                    </svg>
                  </div>
                  {
                    file.id === isEdit ? (
                      <div>
                        <input
                          ref={inputRef}
                          className="form-control h-33"
                          value={value}
                          onClick={e => handleInputClick(e)}
                          onChange={(e) => setValue(e.target.value)}
                          onBlur={() => handleCancel(file)} />
                      </div>
                    ) : (
                      <div
                        className="flex-grow-1 h-33 file-name"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                    )
                  }
                  <div className="d-flex justify-content-between options-icon">
                    {
                      file.id !== isEdit && <svg
                        onClick={(e) => handleEdit(e, file)}
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        fill="currentColor"
                        className="bi bi-pen"
                        viewBox="0 0 16 16">
                        <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z" />
                      </svg>
                    }
                    <svg
                      onClick={(e) => handleDelete(e, file)}
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="currentColor"
                      className="bi bi-trash"
                      viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                    </svg>
                  </div>
                </div>
              </li>
            )
          })
        }
      </ul>
    </div>
  )
}

FileList.propTypes = {
  files: PropTypes.array,
  activeId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  onFileClick: PropTypes.func,
  onSaveEdit: PropTypes.func,
  onFileDelete: PropTypes.func
}

export default FileList
