import * as vscode from "vscode";
import { getContentForWebView, unifyContentOfHTML } from "../../utils/webView";
import * as path from "path";
import { IWebViewAction } from "../types";
import { ZoweNode } from "../../ZoweNode";

export interface ITreeWebViewItem {
    path: string;
    name: string;
}

export interface ITreeWebViewOptions {
    basePath: string;
    node?: ZoweNode;
    list?: ITreeWebViewItem[];
}

export enum InputAction {
    setList = "setList"
}

export enum OutputAction {
    selectedItems = "selectedItems"
}

class TreeWebView {
    private panel: vscode.WebviewPanel;
    private content: { html: string; js: string; css: string; };

    constructor(basePath: string) {
        this.content = getContentForWebView(path.resolve(basePath, "src", "webviews", "treeWebView"));
    }

    public initialize(title: string) {
        this.initView(title);
        this.initHTMLContent();
        this.setOutputEventHandler();
    }

    public setList(list: ITreeWebViewItem[]) {
        const message: IWebViewAction<InputAction, { list: ITreeWebViewItem[] }> = {
            type: InputAction.setList,
            content: {
                list
            }
        };

        this.panel.webview.postMessage(message);
    }

    private initView(title: string) {
        if (this.panel) {
            this.panel.dispose();
        }

        this.panel = vscode.window.createWebviewPanel(
            "treeWebView",
            title,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );
    }

    private initHTMLContent() {
        this.panel.webview.html = unifyContentOfHTML(this.content);
    }

    private setOutputEventHandler() {
        this.panel.webview.onDidReceiveMessage((event) => {
            console.log(event);
        });
    }
}

let instance = null as TreeWebView;

export function generateInstance(title: string, options?: ITreeWebViewOptions) {
    if (!instance) {
        if (options.basePath) {
            instance = new TreeWebView(options.basePath);
        } else {
            throw new Error("Setting of new Tree Web View requires basePath in options.");
        }
    }

    if (instance) {
        instance.initialize(title);
    }

    return instance;
}

export function getInstance() {
    if (instance) {
        return instance;
    } else {
        throw new Error("Please, first initialize an instance with corresponding function.");
    }
}
