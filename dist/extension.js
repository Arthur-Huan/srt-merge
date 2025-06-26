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
function activate(context) {
  console.log('Congratulations, your extension "srt-merge" is now active!');
  const disposable = vscode.commands.registerCommand("srt-merge.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from Script Shortcut Extension!");
  });
  const scriptCommand = vscode.commands.registerCommand("srt-merge.mergeSegments", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active text editor found");
      return;
    }
    const lineNumber = editor.selection.active.line;
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Processing line ${lineNumber + 1}...`,
        cancellable: false
      }, async () => {
        await mergeSegments(editor, lineNumber);
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Script execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  context.subscriptions.push(disposable, scriptCommand);
}
async function mergeSegments(editor, lineNumber) {
  const document = editor.document;
  const currentLine = document.lineAt(lineNumber);
  let i = lineNumber;
  let startLineNumber = 0;
  while (i > 0) {
    const line = document.lineAt(i);
    if (line.isEmptyOrWhitespace) {
      startLineNumber = i + 1;
      break;
    }
    i -= 1;
  }
  console.log(`Current cursor position: ${lineNumber + 1}`);
  console.log(`Start line found: ${startLineNumber + 1}`);
  let mergedText = "";
  let firstEnd = validateSRTFormat(document, startLineNumber);
  if (firstEnd === -1) {
    const errorMessage = "SRT format not recognized for first segment starting at line " + (startLineNumber + 1) + ".";
    console.log(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }
  console.log("SRT format validation passed");
  let firstTimestampInitPart = document.lineAt(startLineNumber + 1).text.trim().substring(0, 12);
  for (let j = startLineNumber + 2; j < firstEnd; j++) {
    const textLine = document.lineAt(j);
    if (!textLine.isEmptyOrWhitespace) {
      mergedText += textLine.text + " ";
    }
  }
  let secondStartLineNumber = firstEnd;
  let secondEnd = validateSRTFormat(document, secondStartLineNumber);
  if (secondEnd === -1) {
    const errorMessage = "SRT format not recognized for the second segment starting at line " + (secondStartLineNumber + 1) + ".";
    console.log(errorMessage);
    vscode.window.showErrorMessage(errorMessage);
    return;
  }
  console.log("SRT format validation for second segment passed");
  let secondTimestampEndPart = document.lineAt(secondStartLineNumber + 1).text.trim().substring(12, 29);
  for (let j = firstEnd + 2; j < secondEnd; j++) {
    const textLine = document.lineAt(j);
    if (!textLine.isEmptyOrWhitespace) {
      mergedText += textLine.text + " ";
    }
  }
  const sequenceNumber = document.lineAt(startLineNumber).text.trim();
  const combinedTimestamp = firstTimestampInitPart + secondTimestampEndPart;
  const newSegmentLines = [
    sequenceNumber,
    combinedTimestamp,
    mergedText.trim()
  ];
  const startPosition = new vscode.Position(startLineNumber, 0);
  const endPosition = new vscode.Position(secondEnd, 0);
  const rangeToReplace = new vscode.Range(startPosition, endPosition);
  const replacementText = newSegmentLines.join("\n") + "\n";
  await editor.edit((editBuilder) => {
    editBuilder.replace(rangeToReplace, replacementText);
  });
  console.log("Successfully merged SRT segments");
  vscode.window.showInformationMessage("SRT segments merged successfully");
}
function validateSRTFormat(document, startLineNumber) {
  let currentLine = startLineNumber;
  let validated = -1;
  while (currentLine <= document.lineCount - 3) {
    const numberLine = document.lineAt(currentLine);
    if (!isValidSubtitleNumber(numberLine.text.trim())) {
      console.log(`Invalid subtitle number at line ${currentLine + 1}: "${numberLine.text}"`);
      return -1;
    }
    currentLine++;
    const timestampLine = document.lineAt(currentLine);
    if (!isValidTimestamp(timestampLine.text.trim())) {
      console.log(`Invalid timestamp at line ${currentLine + 1}: "${timestampLine.text}"`);
      return -1;
    }
    currentLine++;
    while (currentLine < document.lineCount) {
      const textLine = document.lineAt(currentLine);
      if (textLine.isEmptyOrWhitespace) {
        currentLine++;
        validated = currentLine;
        return validated;
      }
      currentLine++;
    }
  }
  return validated;
}
function isValidSubtitleNumber(text) {
  return /^\d+$/.test(text) && parseInt(text) > 0;
}
function isValidTimestamp(text) {
  const timestampPattern = /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}$/;
  return timestampPattern.test(text);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
