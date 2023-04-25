import React from "react";
import "./Loading.scss"

const Loading = () => {
  return (
    <div className="loading">
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

export default Loading