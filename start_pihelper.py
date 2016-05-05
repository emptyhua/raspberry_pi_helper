#!/usr/bin/env python
import sys
import os
import time
from uuid import getnode as get_mac

uart_bluetooth = None
while not uart_bluetooth:
    for line in os.popen('hciconfig'):
        if 'UART' in line:
            uart_bluetooth = line.split(':')[0].replace('hci', '')
            break
    if not uart_bluetooth:
        time.sleep(1)

if not uart_bluetooth:
    print 'can\'t find uart bluetooth'
    sys.exit(1)

mac = os.popen('ifconfig eth0 | grep HWaddr |cut -dH -f2|cut -d\  -f2').read().strip().replace(':', '')
js = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pihelper.js')
cmd = 'BLENO_DEVICE_NAME="RPi %s" BLENO_HCI_DEVICE_ID=%s node %s' % (mac, uart_bluetooth, js)
print cmd
os.system(cmd)
