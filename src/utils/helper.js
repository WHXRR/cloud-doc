export const flattenArr = (arr) => {
  return arr.reduce((pre, cur) => {
    pre[cur.id] = cur
    return pre
  }, {})
}

export const objToArr = (obj) => {
  return Object.keys(obj).map(key => obj[key])
}