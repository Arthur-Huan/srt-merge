# SRT Merge Extension

A VS Code extension that allows you to easily merge consecutive SRT subtitle segments with a simple keyboard shortcut.

## Features

- **F3 Keyboard Shortcut**: Merge two consecutive SRT subtitle segments instantly
- **Smart Detection**: Automatically finds the current subtitle segment and the next one
- **Timestamp Merging**: Combines start time from first segment with end time from second segment
- **Text Concatenation**: Merges subtitle text from both segments with proper spacing
- **Error Validation**: Validates SRT format before attempting to merge

## TODOs

- Allow custom keybind for functionality

## Usage

1. Open an SRT subtitle file in VS Code
2. Place your cursor anywhere within the first subtitle segment you want to merge
3. Press **F3**
4. The current segment and the next segment will be merged into one

## Requirements

- VS Code 1.101.0 or higher

## Release Notes

### 0.0.1

Initial release of SRT Merge Extension

**Features:**
- Merge consecutive SRT subtitle segments with F3
- Smart SRT format validation  
- Undo/redo support
- Automatic timestamp and text merging

---
