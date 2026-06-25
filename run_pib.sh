#!/bin/bash
# Navigate to the project directory
cd /home/dspratap/Downloads/PrepUp

# Run the PIB generator script using uv
# We use the full path to uv just in case cron doesn't have it in its PATH
$(command -v uv || echo "$HOME/.local/bin/uv" || echo "uv") run python auth_server/data/batch_pib_generator.py >> auth_server/data/pib_cron.log 2>&1
