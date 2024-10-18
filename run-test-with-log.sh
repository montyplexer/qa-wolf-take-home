#!/bin/bash

# Generate current timestamp
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

# Create test output directory if it doesn't exist already
mkdir -p "logs"

# Create log file name 
log_file="logs/test_verified_articles_$timestamp.log"

# Run NodeJS script and record console output to log file
node index.js > "$log_file" 2>&1

# Let user know where log has been saved
echo "Console output saved to $log_file"
