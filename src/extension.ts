// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
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
	const scriptCommand = vscode.commands.registerCommand('srt-merge.runScript', async () => {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active text editor found');
			return;
		}

		// Get the current cursor position
		const position = editor.selection.active;
		const lineNumber = position.line; // Keep 0-based indexing for VS Code operations
		const document = editor.document;

		try {
			// Show a progress notification
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Processing line ${lineNumber + 1}...`,
				cancellable: false
			}, async () => {
				// Execute the script logic directly
				await executeScript(editor, lineNumber);
			});

		} catch (error) {
			vscode.window.showErrorMessage(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	});

	context.subscriptions.push(disposable, scriptCommand);
}

// Execute the main script logic
async function executeScript(editor: vscode.TextEditor, lineNumber: number): Promise<void> {
	const document = editor.document;
	const currentLine = document.lineAt(lineNumber);
	const filePath = document.fileName;
	
	vscode.window.showInformationMessage(`Script executed on line ${lineNumber + 1} in file: ${filePath}`);
	
	console.log(`Current line content: "${currentLine.text}"`);
}

// This method is called when your extension is deactivated
export function deactivate() {}
