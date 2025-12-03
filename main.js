import React from "react";
import ReactDOM from "react-dom/client";
import htm from "htm";
import App from "./src/App.js";

const html = htm.bind(React.createElement);

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(html`<${App} />`);
