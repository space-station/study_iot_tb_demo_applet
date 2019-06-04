//index.js
//获取应用实例
const app = getApp()
var thingsBoardUtil = require('./things_board_util.js')
var mToken = ''
var mdeviceId = ''
var mdeviceToken = ''
const ENTITY_TYPE_DEVICE = "DEVICE"

Page({
  data: {
    login_status: '',
    username: 'tenant@thingsboard.org',
    password: "tenant",
    serveraddress: "192.168.4.119:8080",
    type: "default",
    name: "",
    deviceId: "",
    array: ['ts', 'history', 'attribute'],
    subscribeType: [thingsBoardUtil.SUBSCRIBE_TYPE_TS, thingsBoardUtil.SUBSCRIBE_TYPE_HIS, thingsBoardUtil.SUBSCRIBE_TYPE_ATTR],
  },

  bindUsernameInput(e) {
    console.log('user name input value ' + e.detail.value)
    this.setData({
      username: e.detail.value
    })
  },
  bindPaswordInput(e) {
    console.log('password input value ' + e.detail.value)
    this.setData({
      password: e.detail.value
    })
  },
  bindServeraddressInput(e) {
    console.log('server address input value ' + e.detail.value)
    this.setData({
      serveraddress: e.detail.value
    })
  },

  bindNameInput(e) {
    this.setData({
      name: e.detail.value
    })
  },

  bindTypeInput(e) {
    this.setData({
      type: e.detail.value
    })
  },
  bindDeviceIdInput(e) {
    this.setData({
      deviceId: e.detail.value
    })
  },

  bindPickerChange(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value
    })
  },
  login: function() {
    var pageopt = this
    thingsBoardUtil.init('http://' + this.data.serveraddress, 'ws://' + this.data.serveraddress)
    var t_ctx={token:''};
    thingsBoardUtil.login(this.data.username, this.data.password,t_ctx,
      function(t_ctx) {
        mToken = t_ctx.token
        pageopt.setData({
          login_status: 'login is Success, token=' + mToken
        })
      },
      function (t_ctx){
        pageopt.setData({
          login_status: 'login is Failed'
        })
      })

  },

  ut_run_ut: function(){
    console.log("start ut_run_ut");
    thingsBoardUtil.run_ut();
    console.log("start ut_run_ut, last line");
  },

  ps_run: function () {
    console.log("start ps run--------");
    thingsBoardUtil.testPromise();
    console.log("ps run end----------");
  },

  createdevice: function() {
    var pageopt = this
    var t_ctx = { token: mToken,id:'' };
    thingsBoardUtil.createDevice(this.data.name, this.data.type,t_ctx,
      function (t_ctx) {
        mdeviceId = t_ctx.id
        mToken=t_ctx.token
        thingsBoardUtil.getDeviceTokenByDeviceId(mToken, mdeviceId, function(isSuccess, deviceToken) {
            mdeviceToken = deviceToken
            pageopt.setData({
              login_status: 'create device Success, id=' + mdeviceId + ', device token=' + mdeviceToken
            })
            pageopt.setData({
              deviceId: mdeviceId
            })
        })
      },
      function(t_ctx){
        pageopt.setData({
          login_status: 'create device Failed'
        })
      })

  },
  subscribe: function() {
    const TEST_CMD_ID = 1
    var pageopt = this
    var info=''
    thingsBoardUtil.subscribeInformation(mToken, this.data.subscribeType[this.data.index], TEST_CMD_ID, ENTITY_TYPE_DEVICE, this.data.deviceId, '', function(data) {
      console.log('testSubscription subscription update TEST1')
      //printMapObject('testSubscription res', data)
      printMapObject('testSubscription data', data['data'])
      //printMapObject('testSubscription latestValues', data['latestValues'])
      if(data['data']!=null){
        for (var key in data['data']) {
          info= info+ ','+ key + ':' + data['data'][key]
        }
        pageopt.setData({
          login_status: 'subscribe success'+info
        })
      }
    })
  },

  unsubscribe: function() {
    const TEST_CMD_ID = 1
    var pageopt = this
    thingsBoardUtil.unsubscribeInformation(mToken, this.data.subscribeType[this.data.index], TEST_CMD_ID)
    pageopt.setData({
      login_status: 'unsubscribe success'
    })
  },
})

function printMapObject(tag, map) {
  for (var key in map) {
    console.log(tag + ': printMapObject key \'' + key + '\' value ' + map[key])
  }
}





