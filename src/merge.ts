#!/bin/bash
# This script receives the file path and line number as arguments
# Usage: ./my-script.sh <file_path> <line_number>

FILE_PATH="$1"
LINE_NUMBER="$2"

if [ -z "$FILE_PATH" ] || [ -z "$LINE_NUMBER" ]; then
    echo "Error: Missing arguments. Usage: $0 <file_path> <line_number>"
    exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File not found: $FILE_PATH"
    exit 1
fi

echo "Deleting line $LINE_NUMBER from $FILE_PATH"

# Use sed to delete the specified line
sed -i "${LINE_NUMBER}d" "$FILE_PATH"

echo "Line $LINE_NUMBER deleted successfully!"
