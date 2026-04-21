#!/bin/bash
echo "nameserver 8.8.8.8" > /etc/resolv.conf
echo "nameserver 8.8.4.4" >> /etc/resolv.conf

exec python3.12 -m train_lora_qwen_edit_2511.main
