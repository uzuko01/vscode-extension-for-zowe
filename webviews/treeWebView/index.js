/**
 * Reads constants and sets global variables which are used later by other parts of webview
 */
function setGlobalConfiguration() {
    try {
        let constants = document.querySelector("body").getAttribute("constants");
        window.constants = {};

        if (constants) {
            constants = JSON.parse(atob(constants));
            window.constants.countPerPage = constants.pagination.itemsPerPage;
            window.constants.actions = constants.actions;
        }

        window.pagination = {
            current: 1,
            total: 0
        };
        window.vscode = acquireVsCodeApi();
        window.list = [];
    } catch (err) {
        const {actions} = window.constants;

        vscode.postMessage({
            type: actions.output.producedError,
            content: {
                message: `From TreeWebView: ${err}`
            }
        });
    }
}

/**
 * Sets render functions which can be later used to manipulate DOM
 */
function defineRenderers() {
    window.renderers = {
        renderPaginationElement: (pagination) => {
            const paginationContainer = document.querySelector(".pagination-controls");
            let htmlContent = "";

            htmlContent += `<button class="backward" ${pagination.current > 1 ? "" : "disabled"} onclick="backwardPage()"><</button>`;
            htmlContent += `<button class="forward" ${pagination.total < 2 || pagination.current === pagination.total ? "disabled" : ""} onclick="forwardPage()">></button>`;

            paginationContainer.innerHTML = htmlContent;
        },
        renderListElement: (list, pagination) => {
            if (list && list.length) {
                const {countPerPage} = window.constants;
                const truncatedList = list.slice((pagination.current - 1) * countPerPage, pagination.current * countPerPage);

                if (truncatedList && truncatedList.length) {
                    const tableElement = document.querySelector('table');

                    let htmlContent = '';
                    for (let entry of truncatedList) {
                        htmlContent += `<tr><td>${entry.name}</td><td>${entry.type}</td></tr>`;
                    }

                    tableElement.innerHTML = htmlContent;
                }
            }
        }
    };
}

/**
 * Sets helper functions which can be later used by other parts of webview
 */
function defineHelperFunctions() {
    window.helpers = {
        switchPage: (page) => {
            const {renderPaginationElement, renderListElement} = window.renderers;
            const {actions} = window.constants;

            try {
                window.pagination.current = page;
                renderPaginationElement(window.pagination);
                renderListElement(window.list, window.pagination);

                vscode.postMessage({
                    type: actions.output.switchedPage,
                    content: {
                        page: page
                    }
                });
            } catch (err) {
                vscode.postMessage({
                    type: actions.output.producedError,
                    content: {
                        message: `From TreeWebView: ${err}`
                    }
                });
            }
        }
    };
}

/**
 * Sets JS Event handlers which can be used directly inside HTML document
 */
function defineGlobalEventHandlers() {
    window.backwardPage = () => {
        const {switchPage} = window.helpers;
        switchPage(window.pagination.current - 1);
    };
    window.forwardPage = () => {
        const {switchPage} = window.helpers;
        switchPage(window.pagination.current + 1);
    };
}

/**
 * Sets message handlers for input events
 */
function defineMessageEventHandlers() {
    const {actions, countPerPage} = window.constants;

    window.addEventListener("message", event => {
        const {type, content} = event.data;

        try {
            switch (type) {
                case actions.input.setList:
                    const {renderListElement, renderPaginationElement} = window.renderers;
                    window.list = content.list;
                    window.pagination.total = Math.ceil(list.length / countPerPage);

                    renderListElement(window.list, window.pagination);
                    renderPaginationElement(window.pagination);
                    break;
            }
        } catch (err) {
            const {actions} = window.constants;

            vscode.postMessage({
                type: actions.output.producedError,
                content: {
                    message: `From TreeWebView: ${err}`
                }
            });
        }
    });
}

setGlobalConfiguration();
defineRenderers();
defineHelperFunctions();
defineGlobalEventHandlers();
defineMessageEventHandlers();
