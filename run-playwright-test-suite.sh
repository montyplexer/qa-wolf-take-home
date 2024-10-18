#!/bin/bash

# Generate current timestamp
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")

# Create test output directory if it doesn't exist already
mkdir -p "logs"

# Create log file name 
log_file="logs/playwright_test_suite_$timestamp.log"

# Run playwright test suite, generate html report, and record console output to log file
npx playwright test --reporter=html > "$log_file" 2>&1

# Let user know where log has been saved
echo "Test suite output saved to $log_file"
