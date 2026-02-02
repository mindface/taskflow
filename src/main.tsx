import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PreviewWindow from './pages/PreviewWindow';
import "./styles.css";
import "./styles/modal.css";

const windowLabel = (window as any).__TAURI_WINDOW_LABEL__;
const isPreview = windowLabel === 'preview';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {isPreview ? <PreviewWindow /> : <App />}
  </React.StrictMode>,
);
