export const flattenArr = (arr) => {
  return arr.reduce((pre, cur) => {
    pre[cur.id] = cur
    return pre
  }, {})
}

export const objToArr = (obj) => {
  return Object.keys(obj).map(key => obj[key])
}

export const getTargetNode = (currentNode, targetClassName) => {
  let current = currentNode
  while (current !== null) {
    if (current.classList.contains(targetClassName)) {
      return current
    }
    current = current.parentNode
  }
  return false
}