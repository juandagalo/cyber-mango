#!/bin/sh
# Publishes an mDNS A record for the app's local domain pointing at this
# machine's LAN address. Runs until killed (managed by systemd).
set -eu

DOMAIN="${1:-board.local}"
IP="$(ip -4 route get 1.1.1.1 | sed -n 's/.*src \([0-9.]*\).*/\1/p')"

if [ -z "$IP" ]; then
  echo "Could not determine LAN IP address" >&2
  exit 1
fi

exec avahi-publish -a -R "$DOMAIN" "$IP"
