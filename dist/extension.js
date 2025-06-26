"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var import_child_process = require("child_process");
function activate(context) {
  console.log('Congratulations, your extension "srt-merge" is now active!');
  const disposable = vscode.commands.registerCommand("srt-merge.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from Script Shortcut Extension!");
  });
  const scriptCommand = vscode.commands.registerCommand("srt-merge.runScript", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active text editor found");
      return;
    }
    const position = editor.selection.active;
    const lineNumber = position.line + 1;
    const filePath = editor.document.fileName;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder found");
      return;
    }
    if (editor.document.isDirty) {
      const save = await vscode.window.showWarningMessage(
        "File has unsaved changes. Save before deleting line?",
        "Save and Continue",
        "Cancel"
      );
      if (save === "Save and Continue") {
        await editor.document.save();
      } else {
        return;
      }
    }
    const scriptPath = path.join(workspaceFolder.uri.fsPath, "my-script.sh");
    if (!fs.existsSync(scriptPath)) {
      vscode.window.showErrorMessage(`Script not found: ${scriptPath}`);
      return;
    }
    const command = `bash "${scriptPath}" "${filePath}" ${lineNumber}`;
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Deleting line ${lineNumber}...`,
      cancellable: false
    }, async () => {
      return new Promise((resolve, reject) => {
        (0, import_child_process.exec)(command, { cwd: workspaceFolder.uri.fsPath }, async (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(`Script execution failed: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            vscode.window.showWarningMessage(`Script warning: ${stderr}`);
          }
          await vscode.commands.executeCommand("workbench.action.files.revert");
          vscode.window.showInformationMessage(`${stdout.trim()}`);
          resolve();
        });
      });
    });
  });
  context.subscriptions.push(disposable, scriptCommand);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
