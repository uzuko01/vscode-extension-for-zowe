import * as fs from "fs";
import * as path from "path";

export function getContentForWebView(directory: string): {html: string; js: string; css: string;} {
    return {
        html: fs.readFileSync(path.resolve(directory, "static", "index.html"), "UTF-8"),
        js: fs.readFileSync(path.resolve(directory, "static", "index.js"), "UTF-8"),
        css: fs.readFileSync(path.resolve(directory, "static", "index.css"), "UTF-8")
    };
}

export function unifyContentOfHTML(content: {html: string; js: string; css: string;}) {
    let html = content.html;
    html = html.replace("<style-inject></style-inject>", `<style>${content.css}</style>`);
    html = html.replace("<script-inject></script-inject>", `<script>${content.js}</script>`);

    return html;
}
