import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "srt-merge" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('srt-merge.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from Script Shortcut Extension!');
	});

	// Register the custom script command
	const scriptCommand = vscode.commands.registerCommand('srt-merge.mergeSegments', async () => {
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
			vscode.window.showErrorMessage(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	context.subscriptions.push(disposable, scriptCommand);
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

	// Validate SRT format from startLineNumber onwards for the first segment
	if (validateSRTFormat(document, startLineNumber) === -1) {
		const errorMessage = 'SRT format not recognized.';
		console.log(errorMessage);
		vscode.window.showErrorMessage(errorMessage);
		return;
	}
	console.log('SRT format validation passed');

	let first_timestamp = document.lineAt(startLineNumber + 1).text.trim().substring(0, 12);
	
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
				break;
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
