// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';

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
		const lineNumber = position.line + 1; // VS Code uses 0-based indexing, script uses 1-based
		const filePath = editor.document.fileName;

		// Get the current workspace folder
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found');
			return;
		}

		// Check if the file has unsaved changes
		if (editor.document.isDirty) {
			const save = await vscode.window.showWarningMessage(
				'File has unsaved changes. Save before deleting line?',
				'Save and Continue',
				'Cancel'
			);
			if (save === 'Save and Continue') {
				await editor.document.save();
			} else {
				return;
			}
		}

		// Run the actual script file
		const scriptPath = path.join(workspaceFolder.uri.fsPath, 'my-script.sh');
		
		// Check if script exists
		if (!fs.existsSync(scriptPath)) {
			vscode.window.showErrorMessage(`Script not found: ${scriptPath}`);
			return;
		}

		const command = `bash "${scriptPath}" "${filePath}" ${lineNumber}`;

		// Show a progress notification
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Deleting line ${lineNumber}...`,
			cancellable: false
		}, async () => {
			return new Promise<void>((resolve, reject) => {
				exec(command, { cwd: workspaceFolder.uri.fsPath }, async (error, stdout, stderr) => {
					if (error) {
						vscode.window.showErrorMessage(`Script execution failed: ${error.message}`);
						reject(error);
						return;
					}

					if (stderr) {
						vscode.window.showWarningMessage(`Script warning: ${stderr}`);
					}

					// Reload the file to show the changes
					await vscode.commands.executeCommand('workbench.action.files.revert');
					
					// Show the output
					vscode.window.showInformationMessage(`${stdout.trim()}`);
					resolve();
				});
			});
		});
	});

	context.subscriptions.push(disposable, scriptCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
