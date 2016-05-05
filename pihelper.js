var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;

var WifiCharacteristic = require(__dirname + '/wifi_characteristic.js');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('pihelper', ['a07880d721f9451982e94c1081fcb32a']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: 'a07880d721f9451982e94c1081fcb32a',
        characteristics: [
          new WifiCharacteristic()
        ]
      })
    ]);
  }
});
