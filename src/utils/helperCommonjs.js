const flattenArr = (arr, key = 'id') => {
  return arr.reduce((pre, cur) => {
    pre[cur[key]] = cur
    return pre
  }, {})
}

const objToArr = (obj) => {
  return Object.keys(obj).map(key => obj[key])
}

module.exports = {
  flattenArr,
  objToArr
}