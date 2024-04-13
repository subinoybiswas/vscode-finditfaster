"use strict";
/**
 * TODO:
 * [ ] Show relative paths whenever possible
 *     - This might be tricky. I could figure out the common base path of all dirs we search, I guess?
 *
 * Feature options:
 * [ ] Buffer of open files / show currently open files / always show at bottom => workspace.textDocuments is a bit curious / borked
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
var os_1 = require("os");
var vscode = require("vscode");
var cp = require("child_process");
var fs = require("fs");
var path = require("path");
var os = require("os");
var assert = require("assert");
// Let's keep it DRY and load the package here so we can reuse some data from it
var PACKAGE;
// Reference to the terminal we use
var term;
var previousActiveTerminal;
var isExtensionChangedTerminal = false;
var commands = {
    findFiles: {
        script: "find_files", // we append a platform-specific extension later
        uri: undefined,
        preRunCallback: undefined,
        postRunCallback: undefined,
    },
    findFilesWithType: {
        script: "find_files",
        uri: undefined,
        preRunCallback: selectTypeFilter,
        postRunCallback: function () {
            CFG.useTypeFilter = false;
        },
    },
    findWithinFiles: {
        script: "find_within_files",
        uri: undefined,
        preRunCallback: undefined,
        postRunCallback: undefined,
    },
    findWithinFilesWithType: {
        script: "find_within_files",
        uri: undefined,
        preRunCallback: selectTypeFilter,
        postRunCallback: function () {
            CFG.useTypeFilter = false;
        },
    },
    listSearchLocations: {
        script: "list_search_locations",
        uri: undefined,
        preRunCallback: writePathOriginsFile,
        postRunCallback: undefined,
    },
    flightCheck: {
        script: "flight_check",
        uri: undefined,
        preRunCallback: undefined,
        postRunCallback: undefined,
    },
    resumeSearch: {
        script: "resume_search", // Dummy. We will set the uri from the last-run script. But we will use this value to check whether we are resuming.
        uri: undefined,
        preRunCallback: undefined,
        postRunCallback: undefined,
    },
};
var PathOrigin;
(function (PathOrigin) {
    PathOrigin[PathOrigin["cwd"] = 1] = "cwd";
    PathOrigin[PathOrigin["workspace"] = 2] = "workspace";
    PathOrigin[PathOrigin["settings"] = 4] = "settings";
})(PathOrigin || (PathOrigin = {}));
function getTypeOptions() {
    var result = cp.execSync("rg --type-list").toString();
    return result
        .split("\n")
        .map(function (line) {
        var _a = line.split(":"), typeStr = _a[0], typeInfo = _a[1];
        return new FileTypeOption(typeStr, typeInfo, CFG.findWithinFilesFilter.has(typeStr));
    })
        .filter(function (x) { return x.label.trim().length !== 0; });
}
var FileTypeOption = /** @class */ (function () {
    function FileTypeOption(typeStr, types, picked) {
        if (picked === void 0) { picked = false; }
        this.label = typeStr;
        this.description = types;
        this.picked = picked;
    }
    return FileTypeOption;
}());
function selectTypeFilter() {
    return __awaiter(this, void 0, void 0, function () {
        var opts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    opts = getTypeOptions();
                    return [4 /*yield*/, new Promise(function (resolve, _) {
                            var qp = vscode.window.createQuickPick();
                            var hasResolved = false; // I don't understand why this is necessary... Seems like I can resolve twice?
                            qp.items = opts;
                            qp.title = "Type one or more type identifiers below and press Enter,\n        OR select the types you want below. Example: typing \"py cpp<Enter>\"\n        (without ticking any boxes will search within python and C++ files.\n        Typing nothing and selecting those corresponding entries will do the\n        same. Typing \"X\" (capital x) clears all selections.";
                            qp.placeholder = "enter one or more types...";
                            qp.canSelectMany = true;
                            // https://github.com/microsoft/vscode/issues/103084
                            // https://github.com/microsoft/vscode/issues/119834
                            qp.selectedItems = qp.items.filter(function (x) {
                                return CFG.findWithinFilesFilter.has(x.label);
                            });
                            qp.value = __spreadArray([], CFG.findWithinFilesFilter.keys(), true).reduce(function (x, y) { return x + " " + y; }, "");
                            qp.matchOnDescription = true;
                            qp.show();
                            qp.onDidChangeValue(function () {
                                if (qp.value.length > 0 && qp.value[qp.value.length - 1] === "X") {
                                    // This is where we're fighting with VS Code a little bit.
                                    // When you don't reassign the items, the "X" will still be filtering the results,
                                    // which we obviously don't want. Currently (6/2021), this works as expected.
                                    qp.value = "";
                                    qp.selectedItems = [];
                                    qp.items = qp.items; // keep this
                                }
                            });
                            qp.onDidAccept(function () {
                                CFG.useTypeFilter = true;
                                console.log(qp.activeItems);
                                CFG.findWithinFilesFilter.clear(); // reset
                                if (qp.selectedItems.length === 0) {
                                    // If there are no active items, use the string that was entered.
                                    // split on empty string yields an array with empty string, catch that
                                    var types = qp.value === "" ? [] : qp.value.trim().split(/\s+/);
                                    types.forEach(function (x) { return CFG.findWithinFilesFilter.add(x); });
                                }
                                else {
                                    // If there are active items, use those.
                                    qp.selectedItems.forEach(function (x) { return CFG.findWithinFilesFilter.add(x.label); });
                                }
                                hasResolved = true;
                                resolve(true);
                                qp.dispose();
                            });
                            qp.onDidHide(function () {
                                qp.dispose();
                                if (!hasResolved) {
                                    resolve(false);
                                }
                            });
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
var CFG = {
    extensionName: undefined,
    searchPaths: [],
    searchPathsOrigins: {},
    disableStartupChecks: false,
    useEditorSelectionAsQuery: true,
    useGitIgnoreExcludes: true,
    useWorkspaceSearchExcludes: true,
    findFilesPreviewEnabled: true,
    findFilesPreviewCommand: "",
    findFilesPreviewWindowConfig: "",
    findWithinFilesPreviewEnabled: true,
    findWithinFilesPreviewCommand: "",
    findWithinFilesPreviewWindowConfig: "",
    findWithinFilesFilter: new Set(),
    workspaceSettings: {
        folders: [],
    },
    canaryFile: "",
    selectionFile: "",
    lastQueryFile: "",
    lastPosFile: "",
    hideTerminalAfterSuccess: false,
    hideTerminalAfterFail: false,
    clearTerminalAfterUse: false,
    showMaximizedTerminal: false,
    flightCheckPassed: false,
    additionalSearchLocations: [],
    additionalSearchLocationsWhen: "never",
    searchCurrentWorkingDirectory: "never",
    searchWorkspaceFolders: true,
    extensionPath: "",
    tempDir: "",
    useTypeFilter: false,
    lastCommand: "",
    batTheme: "",
    openFileInPreviewEditor: false,
    killTerminalAfterUse: false,
    fuzzRipgrepQuery: false,
    restoreFocusTerminal: false,
    forceBashOnWindows: true,
};
/** Ensure that whatever command we expose in package.json actually exists */
function checkExposedFunctions() {
    for (var _i = 0, _a = PACKAGE.contributes.commands; _i < _a.length; _i++) {
        var x = _a[_i];
        var fName = x.command.substring(PACKAGE.name.length + ".".length);
        assert(fName in commands);
    }
}
/** We need the extension context to get paths to our scripts. We do that here. */
function setupConfig(context) {
    CFG.extensionName = PACKAGE.name;
    assert(CFG.extensionName);
    var localScript = function (x) {
        return CFG.forceBashOnWindows && x !== "flight_check"
            ? vscode.Uri.file("powershell \"".concat(path.join(context.extensionPath, commands.findFiles.script) + ".ps1", "\""))
            : vscode.Uri.file(path.join(context.extensionPath, x) +
                (os.platform() === "win32" ? ".ps1" : ".sh"));
    };
    commands.findFiles.uri = localScript(commands.findFiles.script);
    commands.findFilesWithType.uri = localScript(commands.findFiles.script);
    commands.findWithinFiles.uri = localScript(commands.findWithinFiles.script);
    commands.findWithinFilesWithType.uri = localScript(commands.findWithinFiles.script);
    commands.listSearchLocations.uri = localScript(commands.listSearchLocations.script);
    commands.flightCheck.uri = localScript(commands.flightCheck.script);
}
/** Register the commands we defined with VS Code so users have access to them */
function registerCommands() {
    Object.keys(commands).map(function (k) {
        vscode.commands.registerCommand("".concat(CFG.extensionName, ".").concat(k), function () {
            executeTerminalCommand(k);
        });
    });
}
/** Entry point called by VS Code */
function activate(context) {
    CFG.extensionPath = context.extensionPath;
    var local = function (x) { return vscode.Uri.file(path.join(CFG.extensionPath, x)); };
    // Load our package.json
    PACKAGE = JSON.parse(fs.readFileSync(local("package.json").fsPath, "utf-8"));
    setupConfig(context);
    checkExposedFunctions();
    handleWorkspaceSettingsChanges();
    handleWorkspaceFoldersChanges();
    registerCommands();
    reinitialize();
}
exports.activate = activate;
/* Called when extension is deactivated by VS Code */
function deactivate() {
    term === null || term === void 0 ? void 0 : term.dispose();
    fs.rmSync(CFG.canaryFile, { force: true });
    fs.rmSync(CFG.selectionFile, { force: true });
    if (fs.existsSync(CFG.lastQueryFile)) {
        fs.rmSync(CFG.lastQueryFile, { force: true });
    }
    if (fs.existsSync(CFG.lastPosFile)) {
        fs.rmSync(CFG.lastPosFile, { force: true });
    }
}
exports.deactivate = deactivate;
/** Map settings from the user-configurable settings to our internal data structure */
function updateConfigWithUserSettings() {
    function getCFG(key) {
        var userCfg = vscode.workspace.getConfiguration();
        var ret = userCfg.get("".concat(CFG.extensionName, ".").concat(key));
        assert(ret !== undefined);
        return ret;
    }
    CFG.disableStartupChecks = getCFG("advanced.disableStartupChecks");
    CFG.useEditorSelectionAsQuery = getCFG("advanced.useEditorSelectionAsQuery");
    CFG.useWorkspaceSearchExcludes = getCFG("general.useWorkspaceSearchExcludes");
    CFG.useGitIgnoreExcludes = getCFG("general.useGitIgnoreExcludes");
    CFG.additionalSearchLocations = getCFG("general.additionalSearchLocations");
    CFG.additionalSearchLocationsWhen = getCFG("general.additionalSearchLocationsWhen");
    CFG.searchCurrentWorkingDirectory = getCFG("general.searchCurrentWorkingDirectory");
    CFG.searchWorkspaceFolders = getCFG("general.searchWorkspaceFolders");
    CFG.hideTerminalAfterSuccess = getCFG("general.hideTerminalAfterSuccess");
    CFG.hideTerminalAfterFail = getCFG("general.hideTerminalAfterFail");
    CFG.clearTerminalAfterUse = getCFG("general.clearTerminalAfterUse");
    CFG.killTerminalAfterUse = getCFG("general.killTerminalAfterUse");
    CFG.showMaximizedTerminal = getCFG("general.showMaximizedTerminal");
    CFG.batTheme = getCFG("general.batTheme");
    (CFG.openFileInPreviewEditor = getCFG("general.openFileInPreviewEditor")),
        (CFG.findFilesPreviewEnabled = getCFG("findFiles.showPreview"));
    CFG.findFilesPreviewCommand = getCFG("findFiles.previewCommand");
    CFG.findFilesPreviewWindowConfig = getCFG("findFiles.previewWindowConfig");
    CFG.findWithinFilesPreviewEnabled = getCFG("findWithinFiles.showPreview");
    CFG.findWithinFilesPreviewCommand = getCFG("findWithinFiles.previewCommand");
    CFG.findWithinFilesPreviewWindowConfig = getCFG("findWithinFiles.previewWindowConfig");
    CFG.fuzzRipgrepQuery = getCFG("findWithinFiles.fuzzRipgrepQuery");
    CFG.restoreFocusTerminal = getCFG("general.restoreFocusTerminal");
    CFG.forceBashOnWindows = getCFG("general.forceBashOnWindows");
}
function collectSearchLocations() {
    var locations = [];
    // searchPathsOrigins is for diagnostics only
    CFG.searchPathsOrigins = {};
    var setOrUpdateOrigin = function (path, origin) {
        if (CFG.searchPathsOrigins[path] === undefined) {
            CFG.searchPathsOrigins[path] = origin;
        }
        else {
            CFG.searchPathsOrigins[path] |= origin;
        }
    };
    // cwd
    var addCwd = function () {
        var cwd = process.cwd();
        locations.push(cwd);
        setOrUpdateOrigin(cwd, PathOrigin.cwd);
    };
    switch (CFG.searchCurrentWorkingDirectory) {
        case "always":
            addCwd();
            break;
        case "never":
            break;
        case "noWorkspaceOnly":
            if (vscode.workspace.workspaceFolders === undefined) {
                addCwd();
            }
            break;
        default:
            assert(false, "Unhandled case");
    }
    // additional search locations from extension settings
    var addSearchLocationsFromSettings = function () {
        locations.push.apply(locations, CFG.additionalSearchLocations);
        CFG.additionalSearchLocations.forEach(function (x) {
            return setOrUpdateOrigin(x, PathOrigin.settings);
        });
    };
    switch (CFG.additionalSearchLocationsWhen) {
        case "always":
            addSearchLocationsFromSettings();
            break;
        case "never":
            break;
        case "noWorkspaceOnly":
            if (vscode.workspace.workspaceFolders === undefined) {
                addSearchLocationsFromSettings();
            }
            break;
        default:
            assert(false, "Unhandled case");
    }
    // add the workspace folders
    if (CFG.searchWorkspaceFolders &&
        vscode.workspace.workspaceFolders !== undefined) {
        var dirs = vscode.workspace.workspaceFolders.map(function (x) {
            var uri = decodeURI(x.uri.toString());
            if (uri.substring(0, 7) === "file://") {
                if (os.platform() === "win32") {
                    return uri.substring(8).replace(/\//g, "\\").replace(/%3A/g, ":");
                }
                else {
                    return uri.substring(7);
                }
            }
            else {
                vscode.window.showErrorMessage("Non-file:// uri's not currently supported...");
                return "";
            }
        });
        locations.push.apply(locations, dirs);
        dirs.forEach(function (x) { return setOrUpdateOrigin(x, PathOrigin.workspace); });
    }
    return locations;
}
/** Produce a human-readable string explaining where the search paths come from */
function explainSearchLocations(useColor) {
    if (useColor === void 0) { useColor = false; }
    var listDirs = function (which) {
        var str = "";
        Object.entries(CFG.searchPathsOrigins).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if ((v & which) !== 0) {
                str += "- ".concat(k, "\n");
            }
        });
        if (str.length === 0) {
            str += "- <none>\n";
        }
        return str;
    };
    var maybeBlue = function (s) {
        return useColor ? "\\033[36m".concat(s, "\\033[0m") : s;
    };
    var ret = "";
    ret += maybeBlue("Paths added because they're the working directory:\n");
    ret += listDirs(PathOrigin.cwd);
    ret += maybeBlue("Paths added because they're defined in the workspace:\n");
    ret += listDirs(PathOrigin.workspace);
    ret += maybeBlue("Paths added because they're the specified in the settings:\n");
    ret += listDirs(PathOrigin.settings);
    return ret;
}
function writePathOriginsFile() {
    fs.writeFileSync(path.join(CFG.tempDir, "paths_explain"), explainSearchLocations(os.platform() !== "win32"));
    return true;
}
function handleWorkspaceFoldersChanges() {
    CFG.searchPaths = collectSearchLocations();
    // Also re-update when anything changes
    vscode.workspace.onDidChangeWorkspaceFolders(function (event) {
        console.log("workspace folders changed: ", event);
        CFG.searchPaths = collectSearchLocations();
    });
}
function handleWorkspaceSettingsChanges() {
    updateConfigWithUserSettings();
    // Also re-update when anything changes
    vscode.workspace.onDidChangeConfiguration(function (_) {
        updateConfigWithUserSettings();
        // This may also have affected our search paths
        CFG.searchPaths = collectSearchLocations();
        // We need to update the env vars in the terminal
        reinitialize();
    });
}
/** Check seat belts are on. Also, check terminal commands are on PATH */
function doFlightCheck() {
    var parseKeyValue = function (line) {
        return line.split(": ", 2);
    };
    try {
        var errStr = "";
        var kvs_1 = {};
        var out = "";
        if (os.platform() === "win32") {
            out = cp
                .execFileSync("powershell " + getCommandString(commands.flightCheck, false, false), { shell: true })
                .toString("utf-8");
        }
        else {
            out = cp
                .execFileSync(getCommandString(commands.flightCheck, false, false), {
                shell: true,
            })
                .toString("utf-8");
        }
        out.split("\n").map(function (x) {
            var maybeKV = parseKeyValue(x);
            if (maybeKV.length === 2) {
                kvs_1[maybeKV[0]] = maybeKV[1];
            }
        });
        if (kvs_1["which bat"] === undefined || kvs_1["which bat"] === "") {
            errStr += "bat not found on your PATH\n. ";
        }
        if (kvs_1["which fzf"] === undefined || kvs_1["which fzf"] === "") {
            errStr += "fzf not found on your PATH\n. ";
        }
        if (kvs_1["which rg"] === undefined || kvs_1["which rg"] === "") {
            errStr += "rg not found on your PATH\n. ";
        }
        if (os.platform() !== "win32" &&
            (kvs_1["which sed"] === undefined || kvs_1["which sed"] === "")) {
            errStr += "sed not found on your PATH\n. ";
        }
        if (errStr !== "") {
            vscode.window.showErrorMessage("Failed to activate plugin: ".concat(errStr, "\nMake sure you have the required command line tools installed as outlined in the README."));
        }
        return errStr === "";
    }
    catch (error) {
        vscode.window.showErrorMessage("Failed to run checks before starting extension. Maybe this is helpful: ".concat(error));
        return false;
    }
}
/**
 * All the logic that's the same between starting the plugin and re-starting
 * after user settings change
 */
function reinitialize() {
    term === null || term === void 0 ? void 0 : term.dispose();
    updateConfigWithUserSettings();
    // console.log('plugin config:', CFG);
    if (!CFG.flightCheckPassed && !CFG.disableStartupChecks) {
        CFG.flightCheckPassed = doFlightCheck();
    }
    if (!CFG.flightCheckPassed && !CFG.disableStartupChecks) {
        return false;
    }
    //
    // Set up a file watcher. Its contents tell us what files the user selected.
    // It also means the command was completed so we can do stuff like
    // optionally hiding the terminal.
    //
    CFG.tempDir = fs.mkdtempSync("".concat((0, os_1.tmpdir)()).concat(path.sep).concat(CFG.extensionName, "-"));
    CFG.canaryFile = path.join(CFG.tempDir, "snitch");
    CFG.selectionFile = path.join(CFG.tempDir, "selection");
    CFG.lastQueryFile = path.join(CFG.tempDir, "last_query");
    CFG.lastPosFile = path.join(CFG.tempDir, "last_position");
    fs.writeFileSync(CFG.canaryFile, "");
    fs.watch(CFG.canaryFile, function (eventType) {
        if (eventType === "change") {
            handleCanaryFileChange();
        }
        else if (eventType === "rename") {
            vscode.window.showErrorMessage("Issue detected with extension ".concat(CFG.extensionName, ". You may have to reload it."));
        }
    });
    return true;
}
/** Interpreting the terminal output and turning them into a vscode command */
function openFiles(data) {
    var filePaths = data.split("\n").filter(function (s) { return s !== ""; });
    assert(filePaths.length > 0);
    filePaths.forEach(function (p) {
        var _a = p.split(":", 3), file = _a[0], lineTmp = _a[1], charTmp = _a[2];
        // TODO: We might want to just do this the RE way on all platforms?
        //       On Windows at least the c: makes the split approach problematic.
        if (os.platform() === "win32") {
            var re = /^\s*(?<file>([a-zA-Z][:])?[^:]+)([:](?<lineTmp>\d+))?\s*([:](?<charTmp>\d+))?.*/;
            var v = p.match(re);
            if (v && v.groups) {
                file = v.groups["file"];
                lineTmp = v.groups["lineTmp"];
                charTmp = v.groups["charTmp"];
                //vscode.window.showWarningMessage('File: ' + file + "\nlineTmp: " + lineTmp + "\ncharTmp: " + charTmp);
            }
            else {
                vscode.window.showWarningMessage("Did not match anything in filename: [" + p + "] could not open file!");
            }
        }
        // On windows we sometimes get extra characters that confound
        // the file lookup.
        file = file.trim();
        var line = 0, char = 0;
        var range = new vscode.Range(0, 0, 0, 0);
        if (lineTmp !== undefined) {
            if (charTmp !== undefined) {
                char = parseInt(charTmp) - 1; // 1 based in rg, 0 based in VS Code
            }
            line = parseInt(lineTmp) - 1; // 1 based in rg, 0 based in VS Code
            assert(line >= 0);
            assert(char >= 0);
        }
        vscode.window.showTextDocument(vscode.Uri.file(file), {
            preview: CFG.openFileInPreviewEditor,
            selection: new vscode.Range(line, char, line, char),
        });
    });
}
/** Logic of what to do when the user completed a command invocation on the terminal */
function handleCanaryFileChange() {
    if (CFG.clearTerminalAfterUse) {
        term.sendText("clear");
    }
    if (CFG.killTerminalAfterUse) {
        // Some folks like having a constant terminal open. This will kill ours such that VS Code will
        // switch back to theirs. We don't have more control over the terminal so this is the best we
        // can do. This is not the default because creating a new terminal is sometimes expensive when
        // people use e.g. powerline or other fancy PS1 stuff.
        //
        // We set a timeout here to address #56. Don't have a good hypothesis as to why this works but
        // it seems to fix the issue consistently.
        setTimeout(function () { return term.dispose(); }, 100);
    }
    fs.readFile(CFG.canaryFile, { encoding: "utf-8" }, function (err, data) {
        if (err) {
            // We shouldn't really end up here. Maybe leave the terminal around in this case...
            vscode.window.showWarningMessage("Something went wrong but we don't know what... Did you clean out your /tmp folder?");
        }
        else {
            var commandWasSuccess = data.length > 0 && data[0] !== "1";
            // open the file(s)
            if (commandWasSuccess) {
                openFiles(data);
            }
            if (CFG.restoreFocusTerminal && previousActiveTerminal) {
                handleTerminalFocusRestore(commandWasSuccess);
                return;
            }
            if (commandWasSuccess && CFG.hideTerminalAfterSuccess) {
                term.hide();
            }
            else if (!commandWasSuccess && CFG.hideTerminalAfterFail) {
                term.hide();
            }
            else {
                // Don't hide the terminal and make clippy angry
            }
        }
    });
}
function handleTerminalFocusRestore(commandWasSuccess) {
    var shouldHideTerminal = (commandWasSuccess && CFG.hideTerminalAfterSuccess) ||
        (!commandWasSuccess && CFG.hideTerminalAfterFail);
    if (shouldHideTerminal) {
        var disposable_1 = vscode.window.onDidChangeActiveTerminal(function (activeTerminal) {
            if (isExtensionChangedTerminal &&
                activeTerminal === previousActiveTerminal) {
                previousActiveTerminal === null || previousActiveTerminal === void 0 ? void 0 : previousActiveTerminal.hide();
                previousActiveTerminal = null;
                isExtensionChangedTerminal = false;
                disposable_1.dispose();
            }
        });
    }
    isExtensionChangedTerminal = true;
    previousActiveTerminal === null || previousActiveTerminal === void 0 ? void 0 : previousActiveTerminal.show();
}
function createTerminal() {
    term = vscode.window.createTerminal({
        name: "F️indItFaster",
        hideFromUser: true,
        env: {
            /* eslint-disable @typescript-eslint/naming-convention */
            FIND_IT_FASTER_ACTIVE: "1",
            HISTCONTROL: "ignoreboth", // bash
            // HISTORY_IGNORE: '*',        // zsh
            EXTENSION_PATH: CFG.extensionPath,
            FIND_FILES_PREVIEW_ENABLED: CFG.findFilesPreviewEnabled ? "1" : "0",
            FIND_FILES_PREVIEW_COMMAND: CFG.findFilesPreviewCommand,
            FIND_FILES_PREVIEW_WINDOW_CONFIG: CFG.findFilesPreviewWindowConfig,
            FIND_WITHIN_FILES_PREVIEW_ENABLED: CFG.findWithinFilesPreviewEnabled
                ? "1"
                : "0",
            FIND_WITHIN_FILES_PREVIEW_COMMAND: CFG.findWithinFilesPreviewCommand,
            FIND_WITHIN_FILES_PREVIEW_WINDOW_CONFIG: CFG.findWithinFilesPreviewWindowConfig,
            USE_GITIGNORE: CFG.useGitIgnoreExcludes ? "1" : "0",
            GLOBS: CFG.useWorkspaceSearchExcludes ? getIgnoreString() : "",
            CANARY_FILE: CFG.canaryFile,
            SELECTION_FILE: CFG.selectionFile,
            LAST_QUERY_FILE: CFG.lastQueryFile,
            LAST_POS_FILE: CFG.lastPosFile,
            EXPLAIN_FILE: path.join(CFG.tempDir, "paths_explain"),
            BAT_THEME: CFG.batTheme,
            FUZZ_RG_QUERY: CFG.fuzzRipgrepQuery ? "1" : "0",
            /* eslint-enable @typescript-eslint/naming-convention */
        },
    });
}
function getWorkspaceFoldersAsString() {
    // For bash invocation. Need to wrap in quotes so spaces within paths don't
    // split the path into two strings.
    return CFG.searchPaths.reduce(function (x, y) { return x + " '".concat(y, "'"); }, "");
}
function getCommandString(cmd, withArgs, withTextSelection) {
    if (withArgs === void 0) { withArgs = true; }
    if (withTextSelection === void 0) { withTextSelection = true; }
    assert(cmd.uri);
    var ret = "";
    var cmdPath = cmd.uri.fsPath;
    if (CFG.useEditorSelectionAsQuery && withTextSelection) {
        var editor = vscode.window.activeTextEditor;
        if (editor) {
            var selection = editor.selection;
            if (!selection.isEmpty) {
                //
                // Fun story on text selection:
                // My first idea was to use an env var to capture the selection.
                // My first test was to use a selection that contained shell script...
                // This breaks. And fixing it is not easy. See https://unix.stackexchange.com/a/600214/128132.
                // So perhaps we should write this to file, and see if we can get bash to interpret this as a
                // string. We'll use an env var to indicate there is a selection so we don't need to read a
                // file in the general no-selection case, and we don't have to clear the file after having
                // used the selection.
                //
                var selectionText = editor.document.getText(selection);
                fs.writeFileSync(CFG.selectionFile, selectionText);
                if (os.platform() === "win32") {
                    ret += "$Env:HAS_SELECTION=1; ";
                }
                else {
                    ret += "HAS_SELECTION=1 ";
                }
            }
        }
    }
    // useTypeFilter should only be try if we activated the corresponding command
    if (CFG.useTypeFilter && CFG.findWithinFilesFilter.size > 0) {
        if (os.platform() === "win32") {
            ret +=
                "$Env:TYPE_FILTER=" +
                    "'" +
                    __spreadArray([], CFG.findWithinFilesFilter, true).reduce(function (x, y) { return x + ":" + y; }) +
                    "'; ";
        }
        else {
            ret +=
                "TYPE_FILTER=" +
                    __spreadArray([], CFG.findWithinFilesFilter, true).reduce(function (x, y) { return x + ":" + y; }) +
                    " ";
        }
    }
    if (cmd.script === "resume_search") {
        if (os.platform() === "win32") {
            ret += "$Env:RESUME_SEARCH=1; ";
        }
        else {
            ret += "RESUME_SEARCH=1 ";
        }
    }
    ret += cmdPath;
    if (withArgs) {
        var paths = getWorkspaceFoldersAsString();
        ret += " ".concat(paths);
    }
    return ret;
}
function getIgnoreGlobs() {
    var exclude = vscode.workspace.getConfiguration("search.exclude"); // doesn't work though the docs say it should?
    var globs = [];
    Object.entries(exclude).forEach(function (_a) {
        var k = _a[0], v = _a[1];
        // Messy proxy object stuff
        if (typeof v === "function") {
            return;
        }
        if (v) {
            globs.push("!".concat(k));
        }
    });
    return globs;
}
function getIgnoreString() {
    var globs = getIgnoreGlobs();
    // We separate by colons so we can have spaces in the globs
    return globs.reduce(function (x, y) { return x + "".concat(y, ":"); }, "");
}
function executeTerminalCommand(cmd) {
    return __awaiter(this, void 0, void 0, function () {
        var cb, cbResult, postRunCallback;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    getIgnoreGlobs();
                    if (!CFG.flightCheckPassed && !CFG.disableStartupChecks) {
                        if (!reinitialize()) {
                            return [2 /*return*/];
                        }
                    }
                    if (cmd === "resumeSearch") {
                        // Run the last-run command again
                        if (os.platform() === "win32") {
                            vscode.window.showErrorMessage("Resume search is not implemented on Windows. Sorry! PRs welcome.");
                            return [2 /*return*/];
                        }
                        if (CFG.lastCommand === "") {
                            vscode.window.showErrorMessage("Cannot resume the last search because no search was run yet.");
                            return [2 /*return*/];
                        }
                        commands["resumeSearch"].uri = commands[CFG.lastCommand].uri;
                        commands["resumeSearch"].preRunCallback =
                            commands[CFG.lastCommand].preRunCallback;
                        commands["resumeSearch"].postRunCallback =
                            commands[CFG.lastCommand].postRunCallback;
                    }
                    else if (cmd.startsWith("find")) {
                        // Keep track of last-run cmd, but we don't want to resume `listSearchLocations` etc
                        CFG.lastCommand = cmd;
                    }
                    if (!term || term.exitStatus !== undefined) {
                        createTerminal();
                        if (os.platform() !== "win32") {
                            term.sendText("bash");
                            term.sendText('export PS1="::: Terminal allocated for FindItFaster. Do not use. ::: "; clear');
                        }
                    }
                    assert(cmd in commands);
                    cb = commands[cmd].preRunCallback;
                    cbResult = true;
                    if (!(cb !== undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, cb()];
                case 1:
                    cbResult = _b.sent();
                    _b.label = 2;
                case 2:
                    if (cbResult === true) {
                        term.sendText(getCommandString(commands[cmd]));
                        if (CFG.showMaximizedTerminal) {
                            vscode.commands.executeCommand("workbench.action.toggleMaximizedPanel");
                        }
                        if (CFG.restoreFocusTerminal) {
                            previousActiveTerminal = (_a = vscode.window.activeTerminal) !== null && _a !== void 0 ? _a : null;
                        }
                        term.show();
                        postRunCallback = commands[cmd].postRunCallback;
                        if (postRunCallback !== undefined) {
                            postRunCallback();
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
