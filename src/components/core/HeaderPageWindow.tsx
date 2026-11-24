import { useEffect, useRef, useState, type PointerEvent } from "react";
import ConceptSearch from "../../pages/ConceptSearch";
import DataLibrary from "../../pages/DataLibrary";
import { DataProvider } from "../../store/dataBox";
import { NotesProvider } from "../../store/note";
import Guidelines from "../Guidelines";
import DbInspector from "../DbInspector";
import DashBord from "../DashBord";
import Structsmake from "../../pages/Structsmake";
import Tokenizer from "../../pages/Tokenizer";
import MemoLinker from "../../pages/MemoLinker";
import Schedule from "../../pages/Schedule";
import MemoMaker from "../../pages/MemoMaker";
import WindowChecker from "../../pages/WindowChecker";
import ViewAndroidMemo from "../../pages/ViewAndroidMemo";
import LlmMemoPage from "../../pages/LlmMemo";
import UserRegister from "../../pages/UserRegister";
import ShareNotes from "../../pages/ShareNotes";
import ClipboardHistory from "../../pages/ClipboardHistory";
import SearchTotal from "../../pages/SearchTotal";
import "../../styles/headerPageWindow.css";

type Props = {
  pageName: string;
  title: string;
  stackIndex: number;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
};

type Position = {
  left: number;
  top: number;
};

type DragState = {
  pointerX: number;
  pointerY: number;
  left: number;
  top: number;
};

type ResizeState = {
  pointerX: number;
  width: number;
};

type HeightResizeState = {
  pointerY: number;
  height: number;
};

const MIN_WIDTH = 360;
const MIN_HEIGHT = 180;
const WINDOW_MARGIN = 16;

function renderPage(pageName: string) {
  switch (pageName) {
    case "home":
      return (
        <DataProvider>
          <div className="space-y-4">
            <Guidelines />
            <DbInspector />
            <DashBord />
          </div>
        </DataProvider>
      );
    case "structsmake":
      return <Structsmake />;
    case "tokenizer":
      return <Tokenizer />;
    case "memolinker":
      return (
        <NotesProvider>
          <MemoLinker />
        </NotesProvider>
      );
    case "schedule":
      return <Schedule />;
    case "memo":
      return (
        <NotesProvider>
          <MemoMaker />
        </NotesProvider>
      );
    case "windowchecker":
      return <WindowChecker />;
    case "conceptsSearch":
      return <ConceptSearch />;
    case "viewAndroidMemo":
      return <ViewAndroidMemo />;
    case "llmMemo":
      return <LlmMemoPage />;
    case "userRegister":
      return <UserRegister />;
    case "shareNotes":
      return <ShareNotes />;
    case "clipboardHistory":
      return <ClipboardHistory />;
    case "searchTotal":
      return <SearchTotal />;
    case "dataLibrary":
      return <DataLibrary />;
    default:
      return <p>このページは表示できません。</p>;
  }
}

export default function HeaderPageWindow({
  pageName,
  title,
  stackIndex,
  isActive,
  onClose,
  onFocus,
}: Props) {
  const [position, setPosition] = useState<Position>(() => ({
    left: WINDOW_MARGIN + stackIndex * 28,
    top: WINDOW_MARGIN + stackIndex * 28,
  }));
  const [width, setWidth] = useState(() =>
    Math.min(900, Math.max(MIN_WIDTH, window.innerWidth - WINDOW_MARGIN * 2)),
  );
  const [height, setHeight] = useState(() =>
    Math.min(
      600,
      Math.max(MIN_HEIGHT, window.innerHeight - WINDOW_MARGIN * 2),
    ),
  );
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const heightResizeRef = useRef<HeightResizeState | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const maxWidth = Math.max(MIN_WIDTH, window.innerWidth - WINDOW_MARGIN * 2);
    const initialWidth = Math.min(900, maxWidth);
    setWidth(initialWidth);
    setPosition({
      left: Math.min(
        window.innerWidth - initialWidth - WINDOW_MARGIN,
        Math.max(WINDOW_MARGIN, (window.innerWidth - initialWidth) / 2 + stackIndex * 28),
      ),
      top: Math.min(
        window.innerHeight - 80,
        Math.max(WINDOW_MARGIN, (window.innerHeight - 600) / 2 + stackIndex * 28),
      ),
    });
    dialogRef.current?.focus();
  }, [pageName]);

  function startResizingHeight(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocus();
    heightResizeRef.current = { pointerY: event.clientY, height };
  }

  function resizeWindowHeight(event: PointerEvent<HTMLButtonElement>) {
    const resize = heightResizeRef.current;
    if (!resize) return;
    const maxHeight = Math.max(
      MIN_HEIGHT,
      window.innerHeight - position.top - WINDOW_MARGIN,
    );
    setHeight(
      Math.min(
        maxHeight,
        Math.max(
          Math.min(MIN_HEIGHT, maxHeight),
          resize.height + event.clientY - resize.pointerY,
        ),
      ),
    );
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const insideNestedDialog =
        event.target instanceof Element && Boolean(event.target.closest("dialog[open]"));
      if (event.key === "Escape" && isActive && !insideNestedDialog) {
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  function startDragging(event: PointerEvent<HTMLDivElement>) {
    onFocus();
    if ((event.target as HTMLElement).closest("button")) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      left: position.left,
      top: position.top,
    };
  }

  function dragWindow(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const dialog = dialogRef.current;
    if (!drag || !dialog) return;
    const maxLeft = Math.max(WINDOW_MARGIN, window.innerWidth - width - WINDOW_MARGIN);
    const maxTop = Math.max(WINDOW_MARGIN, window.innerHeight - 80);
    setPosition({
      left: Math.min(maxLeft, Math.max(WINDOW_MARGIN, drag.left + event.clientX - drag.pointerX)),
      top: Math.min(maxTop, Math.max(WINDOW_MARGIN, drag.top + event.clientY - drag.pointerY)),
    });
  }

  function startResizing(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = { pointerX: event.clientX, width };
  }

  function resizeWindow(event: PointerEvent<HTMLButtonElement>) {
    const resize = resizeRef.current;
    if (!resize) return;
    const maxWidth = Math.max(
      MIN_WIDTH,
      window.innerWidth - position.left - WINDOW_MARGIN,
    );
    setWidth(
      Math.min(
        maxWidth,
        Math.max(
          Math.min(MIN_WIDTH, maxWidth),
          resize.width + event.clientX - resize.pointerX,
        ),
      ),
    );
  }

  function finishDragging() {
    dragRef.current = null;
  }

  function finishResizing() {
    resizeRef.current = null;
  }

  function finishResizingHeight() {
    heightResizeRef.current = null;
  }

  function resizeByKeyboard(amount: number) {
    const maxWidth = Math.max(
      MIN_WIDTH,
      window.innerWidth - position.left - WINDOW_MARGIN,
    );
    setWidth((current) =>
      Math.min(maxWidth, Math.max(Math.min(MIN_WIDTH, maxWidth), current + amount)),
    );
  }

  function resizeHeightByKeyboard(amount: number) {
    const maxHeight = Math.max(
      MIN_HEIGHT,
      window.innerHeight - position.top - WINDOW_MARGIN,
    );
    setHeight((current) =>
      Math.min(maxHeight, Math.max(Math.min(MIN_HEIGHT, maxHeight), current + amount)),
    );
  }

  return (
    <section
      ref={dialogRef}
      className="header-page-window"
      role="dialog"
      aria-modal={false}
      aria-label={title}
      tabIndex={-1}
      onPointerDown={onFocus}
      style={{
        left: position.left,
        top: position.top,
        width,
        height,
        zIndex: 1000 + stackIndex,
      }}
    >
      <div
        className="header-page-window__titlebar"
        onPointerDown={startDragging}
        onPointerMove={dragWindow}
        onPointerUp={finishDragging}
        onPointerCancel={finishDragging}
      >
        <h2>{title}</h2>
        <button type="button" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </div>
      <div className="header-page-window__content">{renderPage(pageName)}</div>
      <button
        type="button"
        className="header-page-window__resize-handle"
        aria-label="ウィンドウの幅を変更（左右の矢印キーでも変更できます）"
        title="ドラッグまたは左右の矢印キーで幅を変更"
        onPointerDown={startResizing}
        onPointerMove={resizeWindow}
        onPointerUp={finishResizing}
        onPointerCancel={finishResizing}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            resizeByKeyboard(-16);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            resizeByKeyboard(16);
          }
        }}
      />
      <button
        type="button"
        className="header-page-window__height-resize-handle"
        aria-label="ウィンドウの高さを変更（上下の矢印キーでも変更できます）"
        title="ドラッグまたは上下の矢印キーで高さを変更"
        onPointerDown={startResizingHeight}
        onPointerMove={resizeWindowHeight}
        onPointerUp={finishResizingHeight}
        onPointerCancel={finishResizingHeight}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") {
            event.preventDefault();
            resizeHeightByKeyboard(-16);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            resizeHeightByKeyboard(16);
          }
        }}
      />
    </section>
  );
}
