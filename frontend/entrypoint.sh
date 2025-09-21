#!/bin/sh

# Exit on error
set -e

# Substitute environment variables in the nginx template
envsubst '${AUTH_SERVER_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
exec nginx -g 'daemon off;'
