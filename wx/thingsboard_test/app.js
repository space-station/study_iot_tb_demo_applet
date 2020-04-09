//app.js
//const Promise = global.Promise = require('./libs/es6-promise.js')
//const regeneratorRuntime = global.regeneratorRuntime = require('libs/regenerator-runtime/runtime')

App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  globalData: {
    userInfo: null
  }
})