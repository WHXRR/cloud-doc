import React from "react";
import "./BottomBtn.scss"

const BottomBtn = () => {
  return (
    <div className="row g-0">
      <div className="col-6 d-grid">
        <button type="button" className="bottom-btn btn btn-light">新建</button>
      </div>
      <div className="col-6 d-grid">
        <button type="button" className="bottom-btn btn btn-dark">导入</button>
      </div>
    </div>
  )
}

export default BottomBtn