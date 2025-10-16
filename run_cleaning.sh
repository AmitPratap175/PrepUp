#!/bin/bash

# Activate the virtual environment
source .venv/bin/activate

# Run the first script
python auth_server/data/cat/clean_cracku_dt.py

# Wait for user confirmation
read -p "Press 'y' to continue to the next script: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  # Run the second script
  python auth_server/data/cat/clean_cracku_solutions.py
fi

# Deactivate the virtual environment
deactivate
