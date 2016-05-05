var fs = require('fs');

var wpa_supplicant = '/etc/wpa_supplicant/wpa_supplicant.conf';


function read_wifi_account(cb) {
    fs.readFile(wpa_supplicant,
            {encoding:'utf-8'},
            function(err, data) {
        if (err) {
            cb(null, error); return;
        } else {
            console.log('read', data);
            var matches = data.match(/network\s*=\s*{[^}]+}/ig)
            if (!matches) {
                cb(null, null); return;
            } else {
                var ssid, psk;
                var tmp = matches[0];
                matches = tmp.match(/ssid\s*=\s*"([^"]+)"/i)
                if (!matches) {
                    cb(null, new Error('can not find ssid')); return;
                } else {
                    ssid = matches[1];
                }
                matches = tmp.match(/psk="([^"]+)"/i)
                if (!matches) {
                    // cb(null, new Error('can not find psk')); return;
                    psk = null;
                } else {
                    psk = matches[1];
                }
                cb({ssid:ssid, psk:psk}, null); return;
            }
        }
    });
}

function write_wifi_account(a, cb) {
    var lines = [];
    lines.push('ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev');
    lines.push('update_config=0');
    lines.push('network={');
    lines.push('ssid="'+a.ssid+'"');
    if (a.psk) {
        lines.push('psk="'+a.psk+'"');
    }
    lines.push('}');
    var new_cfg = lines.join('\n');
    console.log('write', new_cfg);
    fs.writeFile(wpa_supplicant, lines.join('\n'), function(err) {
        if (err) {
            cb(err);
        } else {
            var exec = require('child_process').exec;
            var child = exec('/etc/init.d/networking restart', function(error, stdout, stderr) {
                console.log(error, stdout, stderr);
                setTimeout(function() {cb(null);}, 1000);
            });
        }
    });
}

function read_wlan0_ip() {
    var os = require('os');
    var ifaces = os.networkInterfaces();
    if (!ifaces['wlan0']) return null;
    var addrs = ifaces['wlan0'];
    for (var i = 0;i < addrs.length; i++) {
        if (addrs[i]['family'].toLowerCase() === 'ipv4') {
            return addrs[i]['address'];
        }
    }
    return null;
}

exports.read_wlan0_ip = read_wlan0_ip;
exports.read_wifi_account = read_wifi_account;
exports.write_wifi_account = write_wifi_account;

