const vscode = require('vscode');
const spawn =  require('child_process').spawn;
const fs = require('fs');
const path = require('path');
// log
function log(params) {
	let channel = vscode.OutputChannel
	if(channel) {
		channel.appendLine(params)
	}
}

function info(msg, ...items) {
	log(msg)
	vscode.window.showInformationMessage(msg, ...items)
}

function error(msg, ...items) {
	log(msg)
	vscode.window.showErrorMessage(msg, ...items)
}
// vscode entry
function activate(context) {

	console.log('Congratulations, your extension "paste-image-hardcode" is now active!');

	let disposable = vscode.commands.registerCommand('extension.Paste', () => {
		main();
	});

	context.subscriptions.push(disposable);
}

// main job
function main() {
	if(invalidEditFile()) {
		return;
	}
	pasteFromClipBoard(data => {
		if (!data) return;
		if (data === 'no image') {
			error('There is not a image in clipboard.');
			return;
		}
		edit(data);
	});
}

function invalidEditFile() {
        let editor = vscode.window.activeTextEditor;
        if (!editor) return true;
        let fileUri = editor.document.uri;
		if (!fileUri) return true;
        if (fileUri.scheme === 'untitled') {
            error('Before paste image, you need to save current edit file first.');
            return true;
		}
		if(!fileUri.path.endsWith('.md')) {
			error('Paste only works for Markdown files.')
			return true;
		}
		return false;
}

function pasteFromClipBoard(cb) {

	let platform = process.platform;
	if (platform === 'win32') {
		// Windows
		const scriptPath = path.join(__dirname, './res/windows.ps1');
		let command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
		let powershellExisted = fs.existsSync(command)
		if (!powershellExisted) {
			command = "powershell"
		}
		const powershell = spawn(command, [
			'-noprofile',
			'-noninteractive',
			'-nologo',
			'-sta',
			'-executionpolicy', 'unrestricted',
			'-windowstyle', 'hidden',
			'-file', scriptPath
		]);
		powershell.on('error', function (e) {
			if (e.code == "ENOENT") {
				error(`The powershell command is not in you PATH environment variables.Please add it and retry.`);
			} else {
				error(e);
			}
		});
		powershell.on('exit', function (code, signal) {
			log(`exit ${code} ${signal}`)
		});

		let arr = []
		powershell.stdout.on('data', function (data) {
			arr.push(data)
		});
		powershell.stdout.on('end', function () {
			cb(arr.join(''))
		});
	} else {
		info(`${platform} not supported.`);
	}
}

function edit(data) {
	let editor = vscode.window.activeTextEditor;
	editor.edit(edit => {
		let curr = editor.selection;
		let tg = getTextGenerator()
		let link = tg()
		let text = `![${link}][${link}]`
		if(curr.isEmpty) {
			edit.insert(curr.start, text)
		} else {
			edit.replace(curr.start, text)
		}
		let document = editor.document
		let lineCount = document.lineCount
		let eof = document.eol === vscode.EndOfLine.LF ? '\n' : '\r\n'
		edit.insert(new vscode.Position(lineCount+1, 0), `${eof}${eof}[${link}]:data:image/png;base64,${data}`)
	})
}
// image link generator
let pre = null
let i = 0
function getTextGenerator() {
	return () => {
		console.log(pre)
		let now = Date.now()
		if (now === pre) {
			return `${now}${++i}`
		} else {
			pre = now
			i = 0
			return `${now}${i}`
		}
	}
}

exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
