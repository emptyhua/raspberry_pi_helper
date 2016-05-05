var util = require('util');
var bleno = require('bleno');
var wpa_supplicant = require(__dirname + '/wpa_supplicant.js');

var BlenoCharacteristic = bleno.Characteristic;

var WifiCharacteristic = function() {
  WifiCharacteristic.super_.call(this, {
    uuid: 'a07880d721f9451982e94c1081fcb32b',
    properties: ['read', 'writeWithoutResponse', 'notify'],
    value: null
  });

  this._setting = {};
  this._updateValueCallback = null;
  this._writeTimer = null;
  this._state = 'normal';
  this._receivedData = '';

  this.loadWifiSetting();
};

util.inherits(WifiCharacteristic, BlenoCharacteristic);

WifiCharacteristic.prototype.loadWifiSetting = function(cb) {
    var self = this;
    var setting = {};
    wpa_supplicant.read_wifi_account(function(account, err) {
        if (err && self._updateValueCallback) {
            self._updateValueCallback(new Buffer(JSON.stringify({error:'read setting failed'})));
        } else {
            if (account) {
                setting['ssid'] = account.ssid;
                setting['psk'] = account.psk;
            } else {
                setting['ssid'] = '';
                setting['psk'] = '';
            }
            self._setting = setting;
            cb && cb();
        }
    });
};

WifiCharacteristic.prototype.onReadRequest = function(offset, callback) {
    this._setting['ip'] = wpa_supplicant.read_wlan0_ip();
    var value = new Buffer(JSON.stringify(this._setting));
    callback(this.RESULT_SUCCESS, value);
};

WifiCharacteristic.prototype.onReceiveData = function() {
    var self = this;
    console.log('received data', this._receivedData);
    try {
        var json = JSON.parse(this._receivedData);
    } catch(e) {
        console.log('JSON.parse', e);
        if (this._updateValueCallback) {
            this._updateValueCallback(new Buffer(JSON.stringify({error:'invalid json'})));
        }
        this._state = 'normal';
        return;
    }

    this._state = 'normal';

    if (!json.ssid) {
        if (this._updateValueCallback) {
            this._updateValueCallback(new Buffer(JSON.stringify({error:'invalid json'})));
        }
    } else {
        console.log('write wifi account', json);
        wpa_supplicant.write_wifi_account(json, function(err) {
            if (err) {
                if (self._updateValueCallback) {
                    self._updateValueCallback(new Buffer(JSON.stringify({error:'save config failed'})));
                }
            } else {
                self.loadWifiSetting(function() {
                    if (self._updateValueCallback) {
                        self._updateValueCallback(new Buffer('change'));
                    }
                });
            }
        });
    }
};

WifiCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
    var self = this;
    var strdata = data.toString('utf-8');
    console.log('read', strdata);
    if (this._state === 'normal' && strdata === 'start') {
        this._state = 'writing';
        this._receivedData = '';
        this._writeTimer = setTimeout(function() {
            console.log('write rquest timeout');
            self._writeTimer = null;
            if (self._state === 'writing') {
                self._receivedData = '';
                self._state = 'normal';
            }
        }, 2000);
    } else if (this._state === 'writing') {
        if (strdata === 'end') {
            this.onReceiveData();
            if (self._writeTimer) {
                clearTimeout(self._writeTimer);
                self._writeTimer = null;
            }
        } else {
            self._receivedData += strdata;
        }
    }

   //callback(this.RESULT_SUCCESS);
};

WifiCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('WifiCharacteristic - onSubscribe');

  this._updateValueCallback = updateValueCallback;
};

WifiCharacteristic.prototype.onUnsubscribe = function() {
  console.log('WifiCharacteristic - onUnsubscribe');

  this._updateValueCallback = null;
};

module.exports = WifiCharacteristic;
