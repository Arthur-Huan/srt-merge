import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "srt-merge" is now active!');

	// Register the command to merge SRT segments
	const srtMergeCommand = vscode.commands.registerCommand('srt-merge.mergeSegments', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found');
			return;
		}
		const lineNumber = editor.selection.active.line; // 0-based indexing

		try {
			// Show a progress notification
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Processing line ${lineNumber + 1}...`,
				cancellable: false
			}, async () => {
				// Execute main logic to merge segments 
				await mergeSegments(editor, lineNumber);
			});

		} catch (error) {
			vscode.window.showErrorMessage(
				`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	context.subscriptions.push(srtMergeCommand);
}

async function mergeSegments(editor: vscode.TextEditor, lineNumber: number): Promise<void> {
	const document = editor.document;
	const currentLine = document.lineAt(lineNumber);
	
	// Go from current line up until the first line before the first blank line
	let i = lineNumber;
	let startLineNumber = 0;
	// Go up from current line
	while (i > 0) {
		const line = document.lineAt(i);
		if (line.isEmptyOrWhitespace) {
			startLineNumber = i + 1;
			break;
		}
		i -= 1;
	}  // If no blank line was encountered, `startLineNumber` stays 0
	// Log the result for debugging, 1-based indexing for user-friendliness
	console.log(`Current cursor position: ${lineNumber + 1}`);
	console.log(`Start line found: ${startLineNumber + 1}`);

	let mergedText = '';
	
	// Validate SRT format from startLineNumber onwards for the first segment
	let firstEnd = validateSRTFormat(document, startLineNumber);
	if (firstEnd === -1) {
		const errorMessage = 'SRT format not recognized for first segment starting at line ' + (startLineNumber+1) + '.';
		console.log(errorMessage);
		vscode.window.showErrorMessage(errorMessage);
		return;
	}
	console.log(`Validated format for first segment: lines ${startLineNumber + 1} to ${firstEnd + 1}`);
	let firstTimestampInitPart = document.lineAt(startLineNumber + 1).text.trim().substring(0, 12);
	for (let j = startLineNumber + 2; j < firstEnd; j++) {
		const textLine = document.lineAt(j);
		if (!textLine.isEmptyOrWhitespace) {
			mergedText += textLine.text.trim() + ' ';
		}
	}
	
	let secondStartLineNumber = firstEnd;
	let secondEnd = validateSRTFormat(document, secondStartLineNumber);
	if (secondEnd === -1) {
		const errorMessage = 'SRT format not recognized for the second segment starting at line ' + (secondStartLineNumber + 1) + '.';
		console.log(errorMessage);
		vscode.window.showErrorMessage(errorMessage);
		return;
	}
	console.log(`Validated format for second segment: lines ${secondStartLineNumber + 1} to ${secondEnd + 1}`);
	let secondTimestampEndPart = document.lineAt(secondStartLineNumber+1).text.trim().substring(12, 29);
	for (let j = firstEnd + 2; j < secondEnd; j++) {
		const textLine = document.lineAt(j);
		if (!textLine.isEmptyOrWhitespace) {
			mergedText += textLine.text.trim() + ' ';
		}
	}

	// Write the combined segment
	const sequenceNumber = document.lineAt(startLineNumber).text.trim();
	const combinedTimestamp = firstTimestampInitPart + secondTimestampEndPart;

	// Create the new merged segment content
	const newSegmentLines = [
		sequenceNumber,
		combinedTimestamp,
		mergedText.trim(),
		'' // Newline to separate segments
	];

	// Calculate the range to replace (from startLineNumber to secondEnd)
	const startPosition = new vscode.Position(startLineNumber, 0);
	const endPosition = new vscode.Position(secondEnd, 0);
	const rangeToReplace = new vscode.Range(startPosition, endPosition);

	// Create the replacement text
	const replacementText = newSegmentLines.join('\n') + '\n';

	// Apply the edit using TextEditor.edit() to preserve undo functionality
	await editor.edit(editBuilder => {
		editBuilder.replace(rangeToReplace, replacementText);
	});

	console.log(`Merged segments: lines ${startLineNumber + 1} to ${secondEnd + 1}`);
	vscode.window.showInformationMessage(`Merged segments.`);
}

function validateSRTFormat(document: vscode.TextDocument, startLineNumber: number): number {
	let currentLine = startLineNumber;
	let validated = -1;
		
	while (currentLine <= document.lineCount - 3) {
		// 1. First line should be a number (subtitle index)
		const numberLine = document.lineAt(currentLine);
		if (!isValidSubtitleNumber(numberLine.text.trim())) {
			console.log(`Invalid subtitle number at line ${currentLine + 1}: "${numberLine.text}"`);
			return -1;
		}
		currentLine++;
		
		// 2. Second line should be a timestamp
		const timestampLine = document.lineAt(currentLine);
		if (!isValidTimestamp(timestampLine.text.trim())) {
			console.log(`Invalid timestamp at line ${currentLine + 1}: "${timestampLine.text}"`);
			return -1;
		}
		currentLine++;
		
		// 3. Read text lines until we hit a blank line or reach the end
		while (currentLine < document.lineCount) {
			const textLine = document.lineAt(currentLine);
			if (textLine.isEmptyOrWhitespace) {
				currentLine++; // Skip the blank line
				validated = currentLine; // Valid segment found
				return validated;
			}
			currentLine++;
		}
	}
	return validated;
}

function isValidSubtitleNumber(text: string): boolean {
	// Should be a positive integer
	return /^\d+$/.test(text) && parseInt(text) > 0;
}

function isValidTimestamp(text: string): boolean {
	// Format: HH:MM:SS,mmm --> HH:MM:SS,mmm
	const timestampPattern = /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}$/;
	return timestampPattern.test(text);
}

export function deactivate() {}
