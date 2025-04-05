#!/bin/bash

echo "=== Raspberry Pi Model Information ==="
cat /proc/cpuinfo | grep "Model"
cat /proc/cpuinfo | grep "model name"
echo -e "\n=== Hardware Information ==="
cat /proc/cpuinfo | grep "Hardware"
cat /proc/cpuinfo | grep "Revision"
echo -e "\n=== Architecture Information ==="
uname -m
dpkg --print-architecture
echo -e "\n=== OS Information ==="
cat /etc/os-release | grep "PRETTY_NAME"
lsb_release -a 2>/dev/null
echo -e "\n=== Memory Information ==="
free -h 