import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PreviewWindow from './window/PreviewWindow';
import ViewScheduleWindow from './window/ViewScheduleWindow';
import "./styles.css";
import "./styles/dialog.css";
import "./styles/follow.css";
import { UIProvider } from "./store/ui";

const windowLabel = (window as any).__TAURI_WINDOW_LABEL__;

const renderSelectDom = () => {
  switch (windowLabel) {
    case 'schedule':
      return <ViewScheduleWindow />;
    case 'preview':
      return <PreviewWindow />;
    default:
      return <UIProvider><App /></UIProvider>;
  }
} 

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {renderSelectDom()}
  </React.StrictMode>,
);
