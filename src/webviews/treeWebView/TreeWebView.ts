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
import { getContentForWebView, injectConstantsBlockToHTML, unifyContentOfHTML } from "../../utils/webView";
import * as path from "path";
import { IWebViewAction } from "../types";
import { ZoweDatasetNode } from "../../ZoweDatasetNode";
import { ZoweUSSNode } from "../../ZoweUSSNode";
import { pagination } from "../../config/constants";

type CombinedNode = ZoweDatasetNode | ZoweUSSNode;

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
    switchedPage = "switchedPage",
    producedError = "producedError"
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
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
    }

    private initHTMLContent() {
        let htmlContent = unifyContentOfHTML(this.content);
        htmlContent = injectConstantsBlockToHTML(htmlContent, {pagination, actions: {input: InputAction, output: OutputAction}});
        this.panel.webview.html = htmlContent;
    }

    private setOutputEventHandler() {
        this.panel.webview.onDidReceiveMessage((event: any) => {
            let content;

            switch (event.type) {
                case OutputAction.switchedPage:
                    content = (event as IWebViewAction<OutputAction.switchedPage, { page: number }>).content;
                    const paginatedList = (this.targetNode as any).fullChildrenList
                        .slice((content.page - 1) * pagination.itemsPerPage, content.page * pagination.itemsPerPage);
                    this.targetNode.children = paginatedList;
                    vscode.commands.executeCommand("zowe.refreshDataSetInTree", this.targetNode);
                    break;
                case OutputAction.producedError:
                    content = (event as IWebViewAction<OutputAction.producedError, { message: string }>).content;
                    vscode.window.showErrorMessage(content.message);
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
