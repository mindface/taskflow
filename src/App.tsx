import "./App.css";
import { BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Structsmake from "./pages/Structsmake";
import Tokenizer from "./pages/Tokenizer";
import MemoLinker from "./pages/MemoLinker";
import MemoMaker from "./pages/MemoMaker";
import WindowChecker from "./pages/WindowChecker";
import ConceptSearch from "./pages/ConceptSearch";
import Schedule from "./pages/Schedule";
import ViewAndroidMemo from "./pages/ViewAndroidMemo";
import LlmMemoPage from "./pages/LlmMemo";

import MenuLsit from "./components/modifier/MenuLsit";
import Footer from "./components/core/Footer";
import HoverFollow from "./components/modifier/HoverFollow";
import CoreDialog from "./components/core/CoreDialog";

import { DataProvider } from "./store/dataBox";
import { NotesProvider } from "./store/note";
import { useUIContext } from "./store/ui";

function App() {
  const { state, dispatch } = useUIContext();
  const viewtype = state.viewtype;

  return (
    <BrowserRouter>
      <div className="div-outer">{viewtype}
          <HoverFollow
            className="app-main-follow" glowClassName="app-main-follow__orb"
          >
            <main className="main">
            {viewtype === "home" && <DataProvider><Home /></DataProvider> }
            {viewtype === "structsmake" && <Structsmake /> }
            {viewtype === "tokenizer" && <Tokenizer /> }
            {viewtype === "memolinker" && <NotesProvider><MemoLinker /></NotesProvider> }
            {viewtype === "memo" && <NotesProvider><MemoMaker /></NotesProvider> }
            {viewtype === "windowchecker" && <WindowChecker /> }
            {viewtype === "conceptsSearch" && <ConceptSearch /> }
            {viewtype === "schedule" && <Schedule /> }
            {viewtype === "viewAndroidMemo" && <ViewAndroidMemo /> }
            {viewtype === "llmMemo" && <LlmMemoPage /> }
            </main>
            <MenuLsit />
          </HoverFollow>
          <Footer />
          <CoreDialog
            isOpen={state.isInputConfirmOpen}
            onClose={() => dispatch({ type: "CANCEL_VIEWTYPE_CHANGE" })}
            title="入力値の確認"
          >
            <div className="p-2">
              <div className="pb-4">
                {state.inputCheckLabel}が入力されています。ページを移動してよろしいですか？
              </div>
              <div className="flex gap-4">
                <button onClick={() => dispatch({ type: "CONFIRM_VIEWTYPE_CHANGE" })}>
                  移動する
                </button>
                <button onClick={() => dispatch({ type: "CANCEL_VIEWTYPE_CHANGE" })}>
                  キャンセル
                </button>
              </div>
            </div>
          </CoreDialog>
      </div>
    </BrowserRouter>
  );
}

export default App;
