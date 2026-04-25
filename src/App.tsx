import { useState } from "react";
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

import MenuLsit from "./components/modifier/MenuLsit";
import Footer from "./components/core/Footer";
import HoverFollow from "./components/modifier/HoverFollow";

import { DataProvider } from "./store/dataBox";
import { NotesProvider } from "./store/note";
import { useUIContext } from "./store/ui";

function App() {
  const { state } = useUIContext();
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
            </main>
            <MenuLsit />
          </HoverFollow>
          <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
