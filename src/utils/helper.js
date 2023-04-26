const flattenArr = (arr, key = 'id') => {
  return arr.reduce((pre, cur) => {
    pre[cur[key]] = cur
    return pre
  }, {})
}

const objToArr = (obj) => {
  return Object.keys(obj).map(key => obj[key])
}

const getTargetNode = (currentNode, targetClassName) => {
  let current = currentNode
  while (current !== null) {
    if (current.classList.contains(targetClassName)) {
      return current
    }
    current = current.parentNode
  }
  return false
}

const timeStampToString = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

export {
  flattenArr,
  objToArr,
  getTargetNode,
  timeStampToString
}