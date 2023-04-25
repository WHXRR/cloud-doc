const Qiniu = require('./src/utils/qiniuManager')

const accessKey = 'WaVDI1QyLy6jsGmw2KJ-D21yj1X6-vg4EVNUzNsY';
const secretKey = 'ABDm7uW4Ll5p0kz_OqY_WBshczkQJIO6kxKhCGWl';
const bucket = 'cloud-doc22'
const key = '2.md'
const filePath = 'D:/work/cloud-doc/README.md'

const qiniu = new Qiniu(accessKey, secretKey, bucket)
// 上传
qiniu.uploadFile(key, 'C:/Users/Administrator/Documents/2.md').then(res => {
  console.log({ res });
}).catch(err => {
  console.log({ err });
})

// 下载
// qiniu.downLoadFile(key, 'C:/Users/Administrator/Documents/4.md').then(res => {
//   console.log({ res });
// })

// 删除
// qiniu.deleteFile(key)