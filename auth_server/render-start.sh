#!/usr/bin/env bash

# Exit on error
set -o errexit

# Apply database migrations
python manage.py migrate

# Start Gunicorn
gunicorn auth_project.wsgi:application --bind 0.0.0.0:8000
