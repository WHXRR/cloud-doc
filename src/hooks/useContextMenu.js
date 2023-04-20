import { useEffect, useRef } from "react";
const { Menu, MenuItem, getCurrentWindow } = window.require('@electron/remote')

const useContextMenu = (menuArr, targetElement, deps) => {
  let clickedElement = useRef(null)
  useEffect(() => {
    const menu = new Menu()
    menuArr.forEach(item => {
      menu.append(new MenuItem(item))
    })
    const handleContextMenu = e => {
      if (targetElement && !document.querySelector(targetElement).contains(e.target)) return
      clickedElement.current = e.target
      menu.popup({ window: getCurrentWindow() })
    }
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, deps)
  return clickedElement
}

export default useContextMenu