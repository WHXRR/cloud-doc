import React from "react";
import PropTypes from 'prop-types'
import classNames from 'classnames'
import "./TabList.scss"

const TabList = ({ files, activeId, unSaveId, onTabClick, onCloseTab }) => {
  const handleTabClick = (e, data) => {
    e.preventDefault();
    onTabClick(data)
  }
  return (
    <ul className="nav nav-pills">
      {
        files.map(file => {
          const navClassName = classNames({
            'nav-link': true,
            'rounded-0': true,
            'd-flex': true,
            'active': file.id === activeId,
            'withUnSaved': unSaveId.includes(file.id)
          })
          return (
            <li className="nav-item" key={file.id}>
              <a
                onClick={(e) => handleTabClick(e, file)}
                href="#"
                className={navClassName}
                title={file.name}
              >
                <div className="mr-10">{file.name}</div>
                {/* 未保存icon */}
                <div className="un-save-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-circle-fill" viewBox="0 0 16 16">
                    <circle cx="8" cy="8" r="8" />
                  </svg>
                </div>
                {/* 关闭icon */}
                <div className="close-icon" onClick={e => { e.stopPropagation(); onCloseTab(file) }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                  </svg>
                </div>
              </a>
            </li>
          )
        })
      }
    </ul>
  )
}

TabList.propTypes = {
  files: PropTypes.array,
  activeId: PropTypes.number,
  unSaveId: PropTypes.array,
  onTabClick: PropTypes.func,
  onCloseTab: PropTypes.func
}
TabList.defaultProps = {
  activeId: 1
}

export default TabList