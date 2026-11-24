import paths from "../../json/path.json";

import ImageDialog from "../modifier/iconDialog/ImageDialog";

import { useUIContext } from "../../store/ui";
import { useCallback, useRef, useState } from "react";
import HeaderPageWindow from "./HeaderPageWindow";

type HeaderWindow = {
  id: string;
  pageName: string;
};

function Header() {
  const { state } = useUIContext();
  const { viewtype: activePath } = state;
  const [windows, setWindows] = useState<HeaderWindow[]>([]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openPage = (pageName: string, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setWindows((current) => [...current, { id: crypto.randomUUID(), pageName }]);
  };

  const closeWindow = useCallback((id: string) => {
    setWindows((current) => current.filter((window) => window.id !== id));
    if (windows.length === 1) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, [windows.length]);

  const focusWindow = useCallback((id: string) => {
    setWindows((current) => {
      const index = current.findIndex((window) => window.id === id);
      if (index < 0 || index === current.length - 1) return current;
      const next = [...current];
      const [focusedWindow] = next.splice(index, 1);
      next.push(focusedWindow);
      return next;
    });
  }, []);

  const activePage = windows[windows.length - 1]?.pageName;

  return (
    <header className="basic-header mb-4">
      <ul className="list flex">
        {paths.map((item) => (
          <li
            key={item.id}
            className={[
              "item",
              item.name === (activePage ?? activePath) ? "active" : "",
            ].join(" ")}
          >
            <button
              type="button"
              className="header-page-link"
              aria-haspopup="dialog"
              onClick={(event) => openPage(item.name, event.currentTarget)}
            >
              {item.label ?? item.name}
            </button>
          </li>
        ))}
      </ul>
      <ImageDialog />
      {windows.length > 0 && (
        <div className="header-page-window-layer">
          {windows.map((window, index) => (
            <HeaderPageWindow
              key={window.id}
              pageName={window.pageName}
              title={
                paths.find((item) => item.name === window.pageName)?.label ??
                window.pageName
              }
              stackIndex={index}
              isActive={index === windows.length - 1}
              onClose={() => closeWindow(window.id)}
              onFocus={() => focusWindow(window.id)}
            />
          ))}
        </div>
      )}
    </header>
  );
}

export default Header;
