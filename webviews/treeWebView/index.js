const vscode = acquireVsCodeApi();
let list = [];
let countPerPage = 50;
let pagination = {
    current: 1,
    total: 0
};

function setListHandler() {
    if (list && list.length) {
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

function setPagination() {
    const paginationContainer = document.querySelector(".pagination-controls");
    let htmlContent = "";

    htmlContent += `<button class="backward" ${pagination.current > 1 ? "" : "disabled"} onclick="backwardPage()"><</button>`;
    htmlContent += `<button class="forward" ${pagination.total < 2 || pagination.current === pagination.total ? "disabled" : ""} onclick="forwardPage()">></button>`;

    paginationContainer.innerHTML = htmlContent;
}

function backwardPage() {
    switchPage(pagination.current - 1);
}

function forwardPage() {
    switchPage(pagination.current + 1);
}

function switchPage(page) {
    pagination.current = page;
    setPagination();
    setListHandler();

    try {
        vscode.postMessage({
            type: "switchedPage",
            content: {
                page: page
            }
        });
    } catch(err) {
        document.querySelector('body').innerHTML += err;
    }
}

window.addEventListener('message', event => {
    const {type, content} = event.data;

    switch (type) {
        case "setList":
            list = content.list;
            pagination.total = Math.ceil(list.length / countPerPage);
            setListHandler();
            setPagination();
            break;
    }
});
