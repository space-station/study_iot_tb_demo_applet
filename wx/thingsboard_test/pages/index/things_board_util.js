//TODO now only device control is complete

const debug = false
var mServerAddress = ''
var mServerWsAddress = ''
var mSocketTask
var mSubscribeCallbacks = [{}]

const HTTP_BAD_REQUEST = 400
const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404

const SUBSCRIBE_TYPE_TS = 1 //timeseries
const SUBSCRIBE_TYPE_ATTR = 2 //attributes
const SUBSCRIBE_TYPE_HIS = 3 //history

const ENTITY_TYPE_TENANT = "TENANT"
const ENTITY_TYPE_CUSTOMER = "CUSTOMER"
const ENTITY_TYPE_USER = "USER"
const ENTITY_TYPE_DASHBOARD = "DASHBOARD"
const ENTITY_TYPE_ASSET = "ASSET"
const ENTITY_TYPE_DEVICE = "DEVICE"
const ENTITY_TYPE_ALARM = "ALARM"

/**
 * init util
 * @param {string} serverAddress: target server address
 * @param {string} websocketAddress: target server websocket address
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
function login(userName, password, callback) {
  wx.request({
    url: mServerAddress + '/api/auth/login',
    data: {
      username: userName,
      password: password,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('login success status code ' + res.statusCode + ' data ' + res.data['token'])
      callback(true, res.data['token'])
    },
    fail(res) {
      if (debug) console.log('login fail')
      callback(false, null)
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
function createDevice(token, deviceName, callback) {
  wx.request({
    url: mServerAddress + '/api/device',
    data: {
      name: deviceName,
      type: 'default',
    },
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('createDevice success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else if (res.statusCode == HTTP_BAD_REQUEST) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('createDevice fail')
      callback(false, null)
    },
  })
}

/**
 * save device(create or modify)
 * TODO need more device information in parameter
 * @param {string} token: login token
 * @param {Object} deviceData: created or modified device data
 * @param {function} callback: callback for success or fail. param contain (boolean isSuccess, Object resData)
 */
function saveDevice(token, deviceData, callback) {
  wx.request({
    url: mServerAddress + '/api/device',
    data: deviceData,
    header: {
      'X-Authorization': 'Bearer ' + token,
    },
    method: 'POST',
    success(res) {
      if (debug) console.log('createDevice success status code ' + res.statusCode)
      if (res.statusCode == HTTP_UNAUTHORIZED) {
        callback(false, res.data)
      } else {
        callback(true, res.data)
      }
    },
    fail(res) {
      if (debug) console.log('createDevice fail')
      callback(false, null)
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
    mSocketTask.onMessage(function(res) {
      var object = JSON.parse(res['data'])
      if (mSubscribeCallbacks[object.subscriptionId].callback != null) {
        mSubscribeCallbacks[object.subscriptionId].callback(object)
      }
    })
    mSocketTask.onOpen(function(res) {
      mSocketIsOpen = true
      sendData()
    })
  } else {
    if (mSocketIsOpen) {
      sendData()
    } else {
      mSocketTask.onOpen(function(res) {
        sendData()
      })
    }
  }
}

/**
 * test all function
 */
function utilTest() {
  init('http://192.168.6.108:8080', 'ws://192.168.6.108:8080')
  //init('http://192.168.4.119:8080', 'ws://192.168.4.119:8080')
  //init('https://lianluotu.cn', 'wss://lianluotu.cn')
  var mToken = ''
  login('tenant@thingsboard.org', 'tenant',
    function(isSuccess, token) {
      console.log('login test isSuccess ' + isSuccess + ' token ' + token)
      mToken = token
      testDevice(mToken)
      testAsset(mToken)
      testCusomer(mToken)
      testSubscription(mToken)
    })
}

function testSubscription(token) {
  const TEST_CMD_ID = 1
  const TEST_CMD_ID_2 = 2
  const TEST_CMD_ID_3 = 3
  createDevice(token, "subscription_test", function(isSuccess, resData) {
    if (isSuccess) {
      subscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID, ENTITY_TYPE_DEVICE, resData['id']['id'], '', function(data) {
        console.log('testSubscription subscription update TEST1 data ' + data)
      })

      subscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID_2, ENTITY_TYPE_DEVICE, resData['id']['id'], '', function(data) {
        console.log('testSubscription subscription update TEST2 data ' + data)
      })

      unsubscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID_2)

      setTimeout(function() {
        subscribeInformation(token, SUBSCRIBE_TYPE_ATTR, TEST_CMD_ID_3, ENTITY_TYPE_DEVICE, resData['id']['id'], '', function(data) {
          console.log('testSubscription subscription update TEST3 data ' + data)
        })
      }, 2000)
    }

    setTimeout(function() {
      deleteDeviceById(token, resData['id']['id'], function(isSuccess) {
        console.log('testDevice deleteDeviceById isSuccess ' + isSuccess)
      })
    }, 10000)

  })
}

/**
 * test case about device
 */
function testDevice(token) {
  createDevice(token, "test", function(isSuccess, resData) {
    printMapObject('testDevice createDevice', resData)

    if (!isSuccess) return
    getDeviceById(token, resData['id']['id'], function(isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testDevice getDeviceById', resData)
      } else {
        console.log('testDevice getDeviceById fail')
      }
    })

    getDeviceByName(token, resData['name'], function(isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testDevice getDeviceByName', resData)
      } else {
        console.log('testDevice getDeviceByName fail')
      }
    })

    deleteDeviceById(token, resData['id']['id'], function(isSuccess) {
      console.log('testDevice deleteDeviceById isSuccess ' + isSuccess)
    })
  })
}

/**
 * test case about asset
 */
function testAsset(token) {
  createAsset(token, "test", function(isSuccess, resData) {
    printMapObject('testAsset createAsset', resData)

    getAssetById(token, resData['id']['id'], function(isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testAsset getAssetById', resData)
      } else {
        console.log('testAsset getAssetById fail')
      }
    })

    getAssetByName(token, resData['name'], function(isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testAsset getAssetByName', resData)
      } else {
        console.log('testAsset getAssetByName fail')
      }
    })

    deleteAssetById(token, resData['id']['id'], function(isSuccess) {
      console.log('testAsset deleteAssetById isSuccess ' + isSuccess)
    })
  })
}

/**
 * test case about customer
 */
function testCusomer(token) {
  createCustomer(token, "test", function(isSuccess, resData) {
    printMapObject('testCusomer createCustomer', resData)

    getCustomerById(token, resData['id']['id'], function(isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testCusomer getCustomerById', resData)
      } else {
        console.log('testCusomer getCustomerById fail')
      }
    })

    getCustomerByTitle(token, resData['title'], function(isSuccess, resData) {
      if (isSuccess) {
        printMapObject('testCusomer getCustomerByTitle', resData)
      } else {
        console.log('testCusomer getCustomerByTitle fail')
      }
    })

    deleteCustomerById(token, resData['id']['id'], function(isSuccess) {
      console.log('testCusomer deleteCustomerById isSuccess ' + isSuccess)
    })
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

module.exports = {
  init: init,
  login: login,
  createDevice: createDevice,
  saveDevice: saveDevice,
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
  subscribeInformation: subscribeInformation,
  unsubscribeInformation: unsubscribeInformation,
  utilTest: utilTest,
}