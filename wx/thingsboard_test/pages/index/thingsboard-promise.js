const co = require('../../libs/co')

const debug = true
var mSubscribeCallbacks = [{}]
var mSocketTask

const SUBSCRIBE_TYPE_TS = 1 //timeseries
const SUBSCRIBE_TYPE_ATTR = 2 //attributes
const SUBSCRIBE_TYPE_HIS = 3 //history

const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404

function createContext() {
  var ctx = { debug: debug };
  return ctx;
}

function clearContext(ctx){
  for (var key in ctx) {
    delete ctx[key];
  }
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

async function testCo() {
  var task_ctx = createContext();
  task_ctx.type = "generator_with_promise";
  task_ctx.restServerAddress = "http://192.168.4.119:8080";
  task_ctx.wsServerAddress = "ws://192.168.4.119:8080";
  task_ctx.statusCode = 200;
  task_ctx.token = "";
  task_ctx.username ="tenant@thingsboard.org"
  task_ctx.password="tenant"

  await co(generatorWithPromise_Device, task_ctx)
  .catch(function(t_ctx){
    console.log("exception caught inside device catch phase")
    console.log(t_ctx)
  });

  await co(generatorWithPromise_Customer, task_ctx)
  .catch(function (t_ctx) {
    console.log("exception caught inside customer catch phase")
    console.log(t_ctx)
  });

  await co(generatorWithPromise_Asset, task_ctx)
  .catch(function (t_ctx) {
    console.log("exception caught inside asset catch phase")
    console.log(t_ctx)
  });
  
  clearContext(task_ctx);
}

function* generatorWithPromise_Device(task_ctx) {
  try {
    yield promiseLogin(task_ctx);
    // test device
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
    console.log("exception caught inside device function")
    console.log(err)
  }
}
function* generatorWithPromise_Customer(task_ctx) {
  try {
    // test customer
    yield promiseGetCustomerByTitle(task_ctx, "test");
    if (task_ctx.statusCode == 200) {
      yield promiseDeleteCustomerById(task_ctx, task_ctx.data['id']['id']);
    }
    yield promiseCreateCustomer(task_ctx, "test");
    yield promiseGetCustomerById(task_ctx, task_ctx.data['id']['id']);
    yield promiseGetCustomerByTitle(task_ctx, task_ctx.data['title']);
    yield promiseDeleteCustomerById(task_ctx, task_ctx.data['id']['id']);
  }
  catch (err) {
    console.log("exception caught inside customer function")
    console.log(err)
  }
}

function* generatorWithPromise_Asset(task_ctx) {
  try {
    // test asset
    yield promiseGetAssetByName(task_ctx, "test");
    if (task_ctx.statusCode == 200) {
      yield promiseDeleteAssetById(task_ctx, task_ctx.data['id']['id']);
    }
    yield promiseCreateAsset(task_ctx, "test");
    yield promiseGetAssetById(task_ctx, task_ctx.data['id']['id']);
    yield promiseGetAssetByName(task_ctx, task_ctx.data['name']);
    yield promiseDeleteAssetById(task_ctx, task_ctx.data['id']['id']);
  }
  catch (err) {
    console.log("exception caught inside asset function")
    console.log(err)
  }
}


function testPromise() {
  var task_ctx = createContext();
  task_ctx.type = "generator_with_promise";
  task_ctx.restServerAddress = "http://192.168.4.119:8080";
  task_ctx.wsServerAddress = "ws://192.168.4.119:8080";
  task_ctx.statusCode = 200;
  task_ctx.token = "";
  task_ctx.username = "tenant@thingsboard.org"
  task_ctx.password = "tenant"

  promiseLogin(task_ctx)
  .then(function (ctx) {
    console.log('token------' + ctx.token)
    return promiseCreateDevice(ctx, "test", "default")
  })
  .then(function (ctx) {
    console.log('id------' + ctx.id)
    return promiseGetDeviceById(ctx, ctx.id)
  })
  .then(function (ctx) {
    console.log('start delete')
    promiseDeleteDeviceById(ctx, ctx.id)
  })

  //clearContext(task_ctx);
}

function promiseLogin(task_context) {
  var p= new Promise(function(resolve,reject){
    wx.request({
      url: task_context.restServerAddress + '/api/auth/login',
      data: {
        username: task_context.username,
        password: task_context.password,
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
      url: task_context.restServerAddress + '/api/device',
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
      url: task_context.restServerAddress + '/api/device/' + device_id,
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
      url: task_context.restServerAddress + '/api/tenant/devices?deviceName=' + device_name,
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

function promiseGetDeviceTokenByDeviceId(task_context, id) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('getDeviceTokenByDeviceId id=' + id)
    wx.request({
      url: task_context.restServerAddress + '/api/device/' + id + '/credentials',
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('getDeviceTokenByDeviceId success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
          console.log('device token=' + res.data['credentialsId'])
        }
      },
      fail(res) {
        if (debug) console.log('getDeviceTokenByDeviceId fail')
        reject(task_context)
      }
    })
  })
}

/**
 * delete device by id
 */
function promiseDeleteDeviceById(task_context, device_id) {
  var token=task_context.token
  var p = new Promise(function (resolve, reject) {
    wx.request({
      url: task_context.restServerAddress + '/api/device/' + device_id,
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

function promiseCreateCustomer(task_context, title) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: task_context.restServerAddress + '/api/customer',
      data: {
        title: title,
      },
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'POST',
      success(res) {
        if (debug) console.log('createCustomer success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('createCustomer fail')
        reject(task_context)
      },
    })
  })
  return p
}

function promiseGetCustomerById(task_context, id) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('getCustomerById id ' + id)
    wx.request({
      url: task_context.restServerAddress + '/api/customer/' + id,
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('getCustomerById success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('getCustomerById fail')
        reject(task_context)
      }
    })
  })
}

function promiseGetCustomerByTitle(task_context, title) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('getCustomerByTitle title ' + title)
    wx.request({
      url: task_context.restServerAddress + '/api/tenant/customers?customerTitle=' + title,
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('getCustomerByTitle success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('getCustomerByTitle fail')
        reject(task_context)
      }
    })
  })
}

function promiseDeleteCustomerById(task_context, id) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('deleteCustomerById id ' + id)
    wx.request({
      url: task_context.restServerAddress + '/api/customer/' + id,
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'DELETE',
      success(res) {
        if (debug) console.log('deleteCustomerById success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('deleteCustomerById fail')
        reject(task_context)
      }
    })
  })
}

function promiseCreateAsset(task_context, assetName) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: task_context.restServerAddress + '/api/asset',
      data: {
        name: assetName,
        type: 'default',
      },
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'POST',
      success(res) {
        if (debug) console.log('createAsset success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('createAsset fail')
        reject(task_context)
      },
    })
  })
}

function promiseGetAssetById(task_context, id) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('getAssetById id ' + id)
    wx.request({
      url: task_context.restServerAddress + '/api/asset/' + id,
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('getAssetById success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('getAssetById fail')
        reject(task_context)
      }
    })
  })
}

function promiseGetAssetByName(task_context, name) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('getAssetByName name ' + name)
    wx.request({
      url: task_context.restServerAddress + '/api/tenant/assets?assetName=' + name,
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'GET',
      success(res) {
        if (debug) console.log('getAssetByName success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        task_context.data = res.data
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('getAssetByName fail')
        reject(task_context)
      }
    })
  })
}

function promiseDeleteAssetById(task_context, id) {
  return new Promise(function (resolve, reject) {
    if (debug) console.log('deleteAssetById id ' + id)
    wx.request({
      url: task_context.restServerAddress + '/api/asset/' + id,
      header: {
        'X-Authorization': 'Bearer ' + task_context.token,
      },
      method: 'DELETE',
      success(res) {
        if (debug) console.log('deleteAssetById success status code ' + res.statusCode)
        task_context.statusCode = res.statusCode
        if (res.statusCode == HTTP_UNAUTHORIZED) {
          reject(task_context)
        } else if (res.statusCode == HTTP_NOT_FOUND) {
          resolve(task_context)
        } else {
          resolve(task_context)
        }
      },
      fail(res) {
        if (debug) console.log('deleteAssetById fail')
        reject(task_context)
      }
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
    console.log(tag + ': printMapObject key \'', key, '\' value ', map[key])
  }
}

module.exports = {
  SUBSCRIBE_TYPE_TS: SUBSCRIBE_TYPE_TS,
  SUBSCRIBE_TYPE_ATTR: SUBSCRIBE_TYPE_ATTR,
  SUBSCRIBE_TYPE_HIS: SUBSCRIBE_TYPE_HIS,

  createContext: createContext,
  promiseLogin: promiseLogin,
  promiseCreateDevice: promiseCreateDevice,
  promiseGetDeviceById: promiseGetDeviceById,
  promiseGetDeviceByName: promiseGetDeviceByName,
  promiseDeleteDeviceById: promiseDeleteDeviceById,
  promiseCreateAsset: promiseCreateAsset,
  promiseGetAssetById: promiseGetAssetById,
  promiseGetAssetByName: promiseGetAssetByName,
  promiseDeleteAssetById: promiseDeleteAssetById,
  promiseCreateCustomer: promiseCreateCustomer,
  promiseGetCustomerById: promiseGetCustomerById,
  promiseGetCustomerByTitle: promiseGetCustomerByTitle,
  promiseDeleteCustomerById: promiseDeleteCustomerById,
  promiseGetDeviceTokenByDeviceId: promiseGetDeviceTokenByDeviceId,
  subscribeInformation: subscribeInformation,
  unsubscribeInformation: unsubscribeInformation,
  testCo: testCo,
  testPromise: testPromise,
}
