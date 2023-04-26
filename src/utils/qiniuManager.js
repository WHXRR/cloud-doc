const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')

class QiniuManager {
  constructor(accessKey, secretKey, bucket) {
    this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    this.bucket = bucket
    this.config = new qiniu.conf.Config();
    // 空间对应的机房
    this.config.zone = qiniu.zone.Zone_cn_east_2;
    // 下载
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);
  }
  uploadFile(key, localFilePath) {
    const options = {
      scope: this.bucket + ":" + key
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    // token 
    const uploadToken = putPolicy.uploadToken(this.mac);
    // 上传方法
    const formUploader = new qiniu.form_up.FormUploader(this.config);
    const putExtra = new qiniu.form_up.PutExtra();
    return new Promise((resolve, reject) => {
      formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallback(resolve, reject));
    })
  }
  downLoadFile(key, path) {
    return this.generateFileDownloadLink(key).then(link => {
      const timeStamp = new Date().getTime()
      const url = `${link}?timeStamp=${timeStamp}`
      return axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
          'Cache-control': 'no-cache'
        }
      }).then(res => {
        const writer = fs.createWriteStream(path)
        res.data.pipe(writer)
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve())
          writer.on('error', reject())
        })
      }).catch(err => {
        throw err
      })
    })
  }
  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject));
    })
  }
  renameFile(key, destKey) {
    const options = {
      force: true
    }
    return new Promise((resolve, reject) => {
      this.bucketManager.move(this.bucket, key, this.bucket, destKey, options, this._handleCallback(resolve, reject));
    })
  }
  getFileList() {
    var options = {
      limit: 100,
    }
    return new Promise((resolve, reject) => {
      this.bucketManager.listPrefix(this.bucket, options, this._handleCallback(resolve, reject))
    })
  }
  getBucketDomain() {
    const reqURL = `http://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`
    const token = qiniu.util.generateAccessToken(this.mac, reqURL)
    return new Promise((resolve, reject) => {
      qiniu.rpc.postWithForm(reqURL, null, token, this._handleCallback(resolve, reject))
    })
  }
  generateFileDownloadLink(key) {
    const domainPromise = this.publicDownloadUrl ? Promise.resolve([this.publicDownloadUrl]) : this.getBucketDomain()
    return domainPromise.then(res => {
      if (Array.isArray(res) && res.length) {
        const pattern = /^https?/
        this.publicBucketDomain = pattern.test(res[0]) ? res[0] : `http://${res[0]}`
        return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key);
      } else {
        throw Error('error')
      }
    })
  }
  getFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject))
    })
  }
  _handleCallback(resolve, reject) {
    return (respErr, respBody, respInfo) => {
      if (respErr) {
        throw respErr
      }
      if (respInfo.statusCode === 200) {
        return resolve(respBody)
      } else {
        return reject({
          code: respInfo.statusCode,
          body: respBody
        })
      }
    }
  }
}

module.exports = QiniuManager