#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check for changes
if git diff-index --quiet HEAD --; then
    echo "No changes to commit."
    exit 0
fi

# Add all changes
echo "Staging all changes..."
git add .

# Prompt for commit message
read -p "Enter commit message: " COMMIT_MESSAGE

# Commit changes
echo "Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# Push changes
echo "Pushing changes to the remote repository..."
git push

echo "Changes have been successfully pushed."
