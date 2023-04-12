import { useState, useEffect } from "react"

const useKeyPress = (targetKeyCode) => {
  const [isPress, setIsPress] = useState(false)
  const handleKeyPress = ({ keyCode }) => {
    if (keyCode === targetKeyCode) {
      setIsPress(true)
    }
  }
  const handleKeyUp = ({ keyCode }) => {
    if (keyCode === targetKeyCode) {
      setIsPress(false)
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  return isPress
}

export default useKeyPress