//TODO now only device control is complete

const co = require('../../libs/co')

const debug = true
var mServerAddress = ''
var mServerWsAddress=''
var mSubscribeCallbacks = [{}]
var mSocketTask

const SUBSCRIBE_TYPE_TS = 1 //timeseries
const SUBSCRIBE_TYPE_ATTR = 2 //attributes
const SUBSCRIBE_TYPE_HIS = 3 //history
const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404

/**
 * init util
 * @param {string} serverAddress: target server address
 */
function init(serverAddress, websocketAddress) {
  mServerAddress = serverAddress
  mServerWsAddress = websocketAddress
}

/**
 * login things board server
 * @param {string} userName: user name
 * @param {string} password: password
 * @param {function} callback for success or fail. param contain (boolean isSuccess, string token)
 */
function login(userName, password, task_ctx,func_success,func_fail) {
  wx.request({
    url: mServerAddress + '/api/auth/login',
    data: {
      username: userName,
      password: password,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('login success status code ' + res.statusCode + ' data ' + res.data['token'])
      //callback(true, res.data['token'])
      task_ctx.token=res.data['token']
      func_success(task_ctx)
    },
    fail(res) {
      if (debug) console.log('login fail')
      //callback(false, null)
      func_fail(task_ctx)
    },
  })
  
}


function findDevice(deviceName) {
  wx.request({
    url: mServerAddress + '//api/tenant/devices?deviceName=' + deviceName,
  })
}

/**
 * create device
 * TODO need more device information in parameter
 * @param {string} token: login token
 * @param {string} deviceName: created device name
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object resData)
 */
function createDevice(deviceName, type, task_ctx, func_success, func_fail) {
  var token= task_ctx.token
  wx.request({
    url: mServerAddress + '/api/device',
    data: {
      name: deviceName,
      type: type,
    },
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('createDevice success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        //callback(false, res.data)
        func_fail(res.data)
      } else {
        task_ctx.id = res.data['id']['id']
        //callback(true, res.data['id']['id'])
        console.log('device id='+res.data['id']['id'])
        func_success(task_ctx)
      }
    },
    fail(res) {
      if (debug) console.log('createDevice fail')
      //callback(false, null)
      func_fail(task_ctx)
    },
  })
}

/**
 * get device info by id
 * @param {string} token: login token
 * @param {string} id: device id
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object deviceData)
 */
function getDeviceById(token, id, callback) {
  if (debug) console.log('getDeviceById id ' + id)
  wx.request({
    url: mServerAddress + '/api/device/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getDeviceById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('getDeviceById fail')
      callback(false, null)
    }
  })
}

/**
 * get device info by name
 * @param {string} token: login token
 * @param {string} name: device name
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object deviceData)
 */
function getDeviceByName(token, name, callback) {
  if (debug) console.log('getDeviceByName name ' + name)
  wx.request({
    url: mServerAddress + '/api/tenant/devices?deviceName=' + name,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getDeviceByName success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('getDeviceByName fail')
      callback(false, null)
    }
  })
}

/**
 * delete device by id
 * @param {string} token: login token
 * @param {string} id: device id
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess)
 */
function deleteDeviceById(token, id, callback) {
  if (debug) console.log('deleteDeviceById id ' + id)
  wx.request({
    url: mServerAddress + '/api/device/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'DELETE',
    success(res) {
      if (debug) console.log('deleteDeviceById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false)
      } else {
        callback(true)
      }
    },
    fail(res) {
      if (debug) console.log('deleteDeviceById fail')
      callback(false)
    }
  })
}

/**
 * create asset
 * TODO need more asset information in parameter
 * @param {string} token: login token
 * @param {string} assetName: created asset name
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object resData)
 */
function createAsset(token, assetName, callback) {
  wx.request({
    url: mServerAddress + '/api/asset',
    data: {
      name: assetName,
      type: 'default',
    },
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('createAsset success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('createAsset fail')
      callback(false, null)
    },
  })
}

/**
 * get asset info by id
 * @param {string} token: login token
 * @param {string} id: asset id
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object assetData)
 */
function getAssetById(token, id, callback) {
  if (debug) console.log('getAssetById id ' + id)
  wx.request({
    url: mServerAddress + '/api/asset/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getAssetById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('getAssetById fail')
      callback(false, null)
    }
  })
}

/**
 * get asset info by name
 * @param {string} token: login token
 * @param {string} name: asset name
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object assetData)
 */
function getAssetByName(token, name, callback) {
  if (debug) console.log('getAssetByName name ' + name)
  wx.request({
    url: mServerAddress + '/api/tenant/assets?assetName=' + name,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getAssetByName success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('getAssetByName fail')
      callback(false, null)
    }
  })
}

/**
 * delete asset by id
 * @param {string} token: login token
 * @param {string} id: asset id
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess)
 */
function deleteAssetById(token, id, callback) {
  if (debug) console.log('deleteAssetById id ' + id)
  wx.request({
    url: mServerAddress + '/api/asset/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'DELETE',
    success(res) {
      if (debug) console.log('deleteAssetById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false)
      } else {
        callback(true)
      }
    },
    fail(res) {
      if (debug) console.log('deleteAssetById fail')
      callback(false)
    }
  })
}

/**
 * create customer
 * TODO need more customer information in parameter
 * @param {string} token: login token
 * @param {string} title: created customer title
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object resData)
 */
function createCustomer(token, title, callback) {
  wx.request({
    url: mServerAddress + '/api/customer',
    data: {
      title: title,
    },
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('createCustomer success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('createCustomer fail')
      callback(false, null)
    },
  })
}

/**
 * get customer info by id
 * @param {string} token: login token
 * @param {string} id: customer id
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object customerData)
 */
function getCustomerById(token, id, callback) {
  if (debug) console.log('getCustomerById id ' + id)
  wx.request({
    url: mServerAddress + '/api/customer/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getCustomerById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('getCustomerById fail')
      callback(false, null)
    }
  })
}

/**
 * get customer info by title
 * @param {string} token: login token
 * @param {string} title: customer title
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object customerData)
 */
function getCustomerByTitle(token, title, callback) {
  if (debug) console.log('getCustomerByTitle title ' + title)
  wx.request({
    url: mServerAddress + '/api/tenant/customers?customerTitle=' + title,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getCustomerByTitle success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('getCustomerByTitle fail')
      callback(false, null)
    }
  })
}

/**
 * delete customer by id
 * @param {string} token: login token
 * @param {string} id: customer id
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess)
 */
function deleteCustomerById(token, id, callback) {
  if (debug) console.log('deleteCustomerById id ' + id)
  wx.request({
    url: mServerAddress + '/api/customer/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'DELETE',
    success(res) {
      if (debug) console.log('deleteCustomerById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false)
      } else {
        callback(true)
      }
    },
    fail(res) {
      if (debug) console.log('deleteCustomerById fail')
      callback(false)
    }
  })
}

function getDeviceTokenByDeviceId(token, id, callback) {
  if (debug) console.log('getDeviceTokenByDeviceId id=' + id)
  wx.request({
    url: mServerAddress + '/api/device/' + id +'/credentials',
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getDeviceTokenByDeviceId success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false,null)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        callback(false,null)
      } else {
        callback(true,res.data['credentialsId'])
        console.log('device token=' + res.data['credentialsId'])
      }
    },
    fail(res) {
      if (debug) console.log('getDeviceTokenByDeviceId fail')
      callback(false,null)
    }
  })
}

/**
 * subscribe entity information update
 * @param {string} token: login token
 * @param {number} subscribeType: subscribe type see {#SUBSCRIBE_TYPE_ATTR}
 * @param {number} cmdId: unique command id for this subscription
 * @param {string} entityType: entity type see {#ENTITY_TYPE_TENANT}
 * @param {string} entityId: target entity id
 * @param {string[]} keys: comma separated list of data keys
 * @param {function} callback: callback for subscription information is returned. param contain (Object returnData)
 */
function subscribeInformation(token, subscribeType, cmdId, entityType, entityId, keys, callback) {
  console.log('subscribeInformation subscribeType ' + subscribeType + ' entityType ' + entityType + ' entityId ' + entityId)
  processSubscribe(token, subscribeType, cmdId, entityType, entityId, keys, callback, false)
}

/**
 * unsubscribe entity information
 * @param {string} token: login token
 * @param {number} subscribeType: subscribe type see {#SUBSCRIBE_TYPE_ATTR}
 * @param {number} cmdId: unique command id for subscription
 */
function unsubscribeInformation(token, subscribeType, cmdId) {
  processSubscribe(token, subscribeType, cmdId, null, null, null, null, true)
}

var mSocketIsOpen = false
/**
 * process subscribe
 * @param {string} token: login token
 * @param {number} subscribeType: subscribe type see {#SUBSCRIBE_TYPE_ATTR}
 * @param {number} cmdId: unique command id for this subscription
 * @param {string} entityType: entity type see {#ENTITY_TYPE_TENANT}
 * @param {string} entityId: target entity id
 * @param {string[]} keys: comma separated list of data keys
 * @param {function} callback: callback for subscription information is returned. param contain (Object returnData)
 * @param {boolean} isUnsubscribe: it is true if unsubscribe
 */
function processSubscribe(token, subscribeType, cmdId, entityType, entityId, keys, callback, isUnsubscribe) {
  function sendData() {
    var cmdsObject = [{
      entityType: entityType,
      entityId: entityId,
      keys: keys,
      cmdId: cmdId,
      unsubscribe: isUnsubscribe
    }]

    var object = {
      tsSubCmds: [],
      historyCmds: [],
      attrSubCmds: []
    };

    switch (subscribeType) {
      case SUBSCRIBE_TYPE_ATTR:
        object.attrSubCmds = cmdsObject
        break
      case SUBSCRIBE_TYPE_HIS:
        object.historyCmds = cmdsObject
        break
      case SUBSCRIBE_TYPE_TS:
        object.tsSubCmds = cmdsObject
        break
    }

    var data = JSON.stringify(object);
    mSocketTask.send({
      data: data,
    })
  }

  mSubscribeCallbacks[cmdId] = {
    callback: callback
  }

  if (mSocketTask == null) {
    mSocketTask = wx.connectSocket({
      url: mServerWsAddress + '/api/ws/plugins/telemetry?token=' + token,
    })
    mSocketTask.onMessage(function (res) {
      var object = JSON.parse(res['data'])
      if (mSubscribeCallbacks[object.subscriptionId].callback != null) {
        mSubscribeCallbacks[object.subscriptionId].callback(object)
      }
    })
    mSocketTask.onOpen(function (res) {
      mSocketIsOpen = true
      sendData()
    })
  } else {
    if (mSocketIsOpen) {
      sendData()
    } else {
      mSocketTask.onOpen(function (res) {
        sendData()
      })
    }
  }
}

function main(){
  var task_ctx={success:true,text:''}
  var type='gen'
  switch(type){
    case "gen":
      test_gen(task_ctx)
    case "prom":
      test_prom(task_ctx)
    default:
      console.log("must be gen|prom")
  }
}

/**
 * login process
 */
function ut_login(task_context,gen) {
  wx.request({
    url: mServerAddress + '/api/auth/login',
    data: {
      username: 'tenant@thingsboard.org',
      password: 'tenant',
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('login success status code ' + res.statusCode + ' data ' + res.data['token'])
      //callback(true, res.data['token'])
      task_context.token = res.data['token']
      //gen.next(res.data['token']);
      gen.next(task_context)
    },
    fail(res) {
      if (debug) console.log('login fail')
      //callback(false, null)
    },
  })

}

/**
 * create device process
 */
function ut_createDevice(task_context, deviceName, type, gen) {
  var token=task_context.token
  wx.request({
    url: mServerAddress + '/api/device',
    data: {
      name: deviceName,
      type: type,
    },
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('createDevice success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        //callback(false, res.data)
      } else {
        task_context.id= res.data['id']['id']
        //gen.next(res.data)
        gen.next(task_context)
        console.log('device id=' + res.data['id']['id'])
      }
    },
    fail(res) {
      if (debug) console.log('createDevice fail')
      //callback(false, null)
    },
  })
}

/**
 * get device by id
 */
function ut_getDeviceById(task_context, gen) {
  var token=task_context.token
  var id=task_context.id
  if (debug) console.log('getDeviceById id ' + id)
  wx.request({
    url: mServerAddress + '/api/device/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'GET',
    success(res) {
      if (debug) console.log('getDeviceById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        //callback(false, res.data)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        //callback(false, res.data)
      } else {
        var ret = gen.next()
        console.log("get device by id next().done = " + ret.done)
      }
    },
    fail(res) {
      if (debug) console.log('getDeviceById fail')
      //callback(false, null)
    }
  })
}

/**
 * delete device by id
 */
function ut_deleteDeviceById(task_context, gen) {
  var token=task_context.token
  var id=task_context.id
  if (debug) console.log('deleteDeviceById id ' + id)
  wx.request({
    url: mServerAddress + '/api/device/' + id,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'DELETE',
    success(res) {
      if (debug) console.log('deleteDeviceById success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        //callback(false)
      } else if (res.statusCode == HTTP_NOT_FOUND) {
        //callback(false)
      } else {
        var ret = gen.next();
        console.log("delete device next().done = " + ret.done)
      }
    },
    fail(res) {
      if (debug) console.log('deleteDeviceById fail')
      //callback(false)
    }
  })
}

/**
 * run ut
 */
function run_ut(){
  testGeneratorWithPromise();
}

function testGeneratorWithPromise() {
  var task_ctx = { statusCode: 200, token: ''};
  task_ctx.type = "generator_with_promise"
  co(generatorWithPromise, task_ctx)
  .catch(function(t_ctx){
    console.log("exception caught inside test_gen_with_promise catch phase")
    console.log(t_ctx)
  });
}

function* generatorWithPromise(task_ctx) {
  init('http://192.168.4.119:8080', 'ws://192.168.4.119:8080')

  try {
    yield promiseLogin(task_ctx);
    yield promiseGetDeviceByName(task_ctx, "test");
    if(task_ctx.statusCode == 200){
      yield promiseDeleteDeviceById(task_ctx, task_ctx.id);
    }
    yield promiseCreateDevice(task_ctx, "test", "default");
    yield promiseGetDeviceById(task_ctx, task_ctx.id);
    yield promiseGetDeviceByName(task_ctx, "test");
    yield promiseDeleteDeviceById(task_ctx, task_ctx.id);
  }
  catch (err) {
    console.log("exception caught inside generator_with_promise function")
    console.log(err)
  }
}

function testPromise() {
  init('http://192.168.4.119:8080', 'ws://192.168.4.119:8080');
  var task_context = { statusCode: 200, token: ''};
  promiseLogin(task_context)
  .then(function (task_context) {
    console.log('token------' + task_context.token)
    return promiseCreateDevice(task_context, "test", "default")
  }).then(function (task_context) {
    console.log('id------' + task_context.id)
    return promiseGetDeviceById(task_context)
  }).then(function (task_context) {
    console.log('start delete')
    promiseDeleteDeviceById(task_context)
  })

}

function promiseLogin(task_context) {
  var p= new Promise(function(resolve,reject){
    wx.request({
      url: mServerAddress + '/api/auth/login',
      data: {
        username: 'tenant@thingsboard.org',
        password: 'tenant',
      },
      method: 'POST',
      success(res) {
        if (debug) console.log('login success status code ' + res.statusCode + ' data ' + res.data['token'])
        var token = res.data['token']
        task_context.token=token
        task_context.statusCode = res.statusCode;
        resolve(task_context)
      },
      fail(res) {
        if (debug) console.log('login fail')
        task_context.statusCode = res.statusCode;
        reject(task_context)
      },
    })
  })
  return p;
}

function promiseCreateDevice(task_context, deviceName, type) {
  var token=task_context.token
  var p = new Promise(function (resolve, reject) {
    wx.request({
      url: mServerAddress + '/api/device',
      data: {
        name: deviceName,
        type: type,
      },
      header: {
        'X-Authorization': 'Bearer ' + token,
      },
      method: 'POST',
      success(res) {
        if (debug) console.log('createDevice success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode;
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context);
        } else {
          console.log('device id=' + res.data['id']['id'])
          task_context.id = res.data['id']['id']
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('createDevice fail')
        task_context.statusCode = res.statusCode;
        reject(task_context);
      },
    })
  })
  return p;
}

/**
 * get device by id
 */
function promiseGetDeviceById(task_context, device_id) {
  var token=task_context.token
  var p = new Promise(function (resolve, reject) {
    wx.request({
      url: mServerAddress + '/api/device/' + device_id,
      header: {
        'X-Authorization': 'Bearer ' + token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('promiseGetDeviceById success statusCode: ' + res.statusCode)
        task_context.statusCode = res.statusCode;
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context);
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context);
        } else {
          console.log("get device by id success ")
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('getDeviceById fail')
        task_context.statusCode = res.statusCode;
        reject(task_context);
      },
    })
  })
  return p;
}

function promiseGetDeviceByName(task_context, device_name) {
  if (debug) console.log('promiseGetDeviceByName, name: ', device_name);
  var token = task_context.token;
  var p = new Promise(function (resolve, reject) {
    wx.request({
      url: mServerAddress + '/api/tenant/devices?deviceName=' + device_name,
      header: {
        'X-Authorization': 'Bearer ' + token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('getDeviceByName success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode;
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context);
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context);
        } else {
          console.log('device id=' + res.data['id']['id'])
          task_context.id = res.data['id']['id']
          resolve(task_context);
        }
      },
      fail(res) {
        if (debug) console.log('promiseGetDeviceByName fail')
        task_context.statusCode = res.statusCode;
        reject(task_context);
      }
    })
  });
  return p;
}

/**
 * delete device by id
 */
function promiseDeleteDeviceById(task_context, device_id) {
  var token=task_context.token
  var p = new Promise(function (resolve, reject) {
    wx.request({
      url: mServerAddress + '/api/device/' + device_id,
      header: {
        'X-Authorization': 'Bearer ' + token,
      },
      method: 'DELETE',
      success(res) {
        if (debug) console.log('deleteDeviceById success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode;
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context);
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context);
        } else {
          console.log('deleteDeviceById success!!!')
          resolve(task_context);
        }
      },
      fail(res) {
        if (debug) console.log('deleteDeviceById fail')
        task_context.statusCode = res.statusCode;
        reject(task_context);
      }
    })
  })
  return p;
}


/**
 * test all function
 */
function utilTest() {
  init('http://192.168.4.119:8080', 'ws://192.168.6.108:8080')
  //init('https://lianluotu.cn')
  var mToken = ''
  login('tenant@thingsboard.org', 'tenant',
    function (isSuccess, token) {
      console.log('login test isSuccess ' + isSuccess + ' token ' + token)
      mToken = token
      testDevice(mToken)
      testAsset(mToken)
      testCusomer(mToken)
      testSubscription(mToken)
    })
}

/**
 * test case about device
 */
function testDevice(token) {
  createDevice(token, "test", function (isSuccess, resData) {
    printMapObject('testDevice createDevice', resData)

    getDeviceById(token, resData['id']['id'], function (isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testDevice getDeviceById', resData)
      } else {
        console.log('testDevice getDeviceById fail')
      }
    })

    getDeviceByName(token, resData['name'], function (isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testDevice getDeviceByName', resData)
      } else {
        console.log('testDevice getDeviceByName fail')
      }
    })

    deleteDeviceById(token, resData['id']['id'], function (isSuccess) {
      console.log('testDevice deleteDeviceById isSuccess ' + isSuccess)
    })
  })
}

/**
 * test case about asset
 */
function testAsset(token) {
  createAsset(token, "test", function (isSuccess, resData) {
    printMapObject('testAsset createAsset', resData)

    getAssetById(token, resData['id']['id'], function (isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testAsset getAssetById', resData)
      } else {
        console.log('testAsset getAssetById fail')
      }
    })

    getAssetByName(token, resData['name'], function (isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testAsset getAssetByName', resData)
      } else {
        console.log('testAsset getAssetByName fail')
      }
    })

    deleteAssetById(token, resData['id']['id'], function (isSuccess) {
      console.log('testAsset deleteAssetById isSuccess ' + isSuccess)
    })
  })
}

/**
 * test case about customer
 */
function testCusomer(token) {
  createCustomer(token, "test", function (isSuccess, resData) {
    printMapObject('testCusomer createCustomer', resData)

    getCustomerById(token, resData['id']['id'], function (isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testCusomer getCustomerById', resData)
      } else {
        console.log('testCusomer getCustomerById fail')
      }
    })

    getCustomerByTitle(token, resData['title'], function (isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testCusomer getCustomerByTitle', resData)
      } else {
        console.log('testCusomer getCustomerByTitle fail')
      }
    })

    deleteCustomerById(token, resData['id']['id'], function (isSuccess) {
      console.log('testCusomer deleteCustomerById isSuccess ' + isSuccess)
    })
  })
}

function testSubscription(token) {
  const TEST_CMD_ID = 1
  const TEST_CMD_ID_2 = 2
  const TEST_CMD_ID_3 = 3
  createDevice(token, "subscription_test", function (isSuccess, resData) {
    if (isSuccess) {
      subscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID, ENTITY_TYPE_DEVICE, resData['id']['id'], '', function (data) {
        console.log('testSubscription subscription update TEST1 data ' + data)
      })

      subscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID_2, ENTITY_TYPE_DEVICE, resData['id']['id'], '', function (data) {
        console.log('testSubscription subscription update TEST2 data ' + data)
      })

      unsubscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID_2)

      setTimeout(function () {
        subscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID_3, ENTITY_TYPE_DEVICE, resData['id']['id'], '', function (data) {
          console.log('testSubscription subscription update TEST3 data ' + data)
        })
      }, 2000)
    }

    setTimeout(function () {
      deleteDeviceById(token, resData['id']['id'], function (isSuccess) {
        console.log('testDevice deleteDeviceById isSuccess ' + isSuccess)
      })
    }, 10000)

  })
}

/**
 * print map object for json data
 * @param {string} tag: log tag
 * @param {Object} map: type data
 */
function printMapObject(tag, map, indent) {
  for (var key in map) {
    console.log(tag + ': printMapObject key \'' + key + '\' value ' + map[key])
  }
}

function loginSuccess() {
  console.log('login test isSuccess ' + isSuccess + ' token ' + token)
  var mToken = token
  testDevice(mToken)
  testAsset(mToken)
  testCusomer(mToken)
  testSubscription(mToken)

}



module.exports = {
  SUBSCRIBE_TYPE_TS: SUBSCRIBE_TYPE_TS,
  SUBSCRIBE_TYPE_ATTR: SUBSCRIBE_TYPE_ATTR,
  SUBSCRIBE_TYPE_HIS: SUBSCRIBE_TYPE_HIS,

  init: init,
  login: login,
  createDevice: createDevice,
  getDeviceById: getDeviceById,
  getDeviceByName: getDeviceByName,
  deleteDeviceById: deleteDeviceById,
  createAsset: createAsset,
  getAssetById: getAssetById,
  getAssetByName: getAssetByName,
  deleteAssetById: deleteAssetById,
  createCustomer: createCustomer,
  getCustomerById: getCustomerById,
  getCustomerByTitle: getCustomerByTitle,
  deleteCustomerById: deleteCustomerById,
  getDeviceTokenByDeviceId: getDeviceTokenByDeviceId,
  utilTest: utilTest,
  subscribeInformation: subscribeInformation,
  unsubscribeInformation: unsubscribeInformation,
  run_ut: run_ut,
  testPromise: testPromise,
}
