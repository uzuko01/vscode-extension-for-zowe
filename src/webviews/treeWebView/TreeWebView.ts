/*
* This program and the accompanying materials are made available under the terms of the *
* Eclipse Public License v2.0 which accompanies this distribution, and is available at *
* https://www.eclipse.org/legal/epl-v20.html                                      *
*                                                                                 *
* SPDX-License-Identifier: EPL-2.0                                                *
*                                                                                 *
* Copyright Contributors to the Zowe Project.                                     *
*                                                                                 *
*/

import * as vscode from "vscode";
import { getContentForWebView, unifyContentOfHTML } from "../../utils/webView";
import * as path from "path";
import { IWebViewAction } from "../types";
import { ZoweNode } from "../../ZoweNode";
import { ZoweUSSNode } from "../../ZoweUSSNode";

type CombinedNode = ZoweNode | ZoweUSSNode;

export interface ITreeWebViewItem {
    name: string;
    type: string;
}

export interface ITreeWebViewOptions {
    basePath: string;
    node?: CombinedNode;
    list?: ITreeWebViewItem[];
}

export enum InputAction {
    setList = "setList"
}

export enum OutputAction {
    switchedPage = "switchedPage"
}

class TreeWebView {
    private panel: vscode.WebviewPanel;
    private content: { html: string; js: string; css: string; };
    private targetNode: CombinedNode;

    constructor(basePath: string) {
        this.content = getContentForWebView(path.resolve(basePath, "webviews", "treeWebView"));
    }

    public initialize(title: string, node: CombinedNode) {
        this.targetNode = node;

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
            switch (event.type) {
                case OutputAction.switchedPage:
                    const {content} = event as IWebViewAction<OutputAction.switchedPage, { page: number }>;
                    // TODO: Add to constants
                    const paginationCount = 50;
                    const paginatedList = (this.targetNode as any).fullChildrenList
                        .slice((content.page - 1) * paginationCount, content.page * paginationCount);
                    this.targetNode.children = paginatedList;
                    vscode.commands.executeCommand("zowe.refreshDataSetInTree", this.targetNode);
                    break;
            }
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
        instance.initialize(title, options.node);
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
