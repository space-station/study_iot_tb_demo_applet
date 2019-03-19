//index.js
//获取应用实例
const app = getApp()
var thingsBoardUtil = require('./things_board_util.js')

Page({
  data: {
    login_status: '',
  },

  login: function() {
    thingsBoardUtil.utilTest()
  },
})
