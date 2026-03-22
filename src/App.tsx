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

import MenuLsitSidebar from "./components/modifier/MenuLsitSidebar";
import Footer from "./components/core/Footer";

import { DataProvider } from "./store/dataBox";
import { NotesProvider } from "./store/note";

function App() {
  const [viewtype, viewTypeSet] = useState("home");

  return (
    <BrowserRouter>
      <div className="div-outer">
        <MenuLsitSidebar
          activePath={viewtype}
          nextPageAction={(path:string) => viewTypeSet(path)}
        />
        <main className="main">
          {viewtype === "home" && <DataProvider><Home /></DataProvider> }
          {viewtype === "structsmake" && <Structsmake /> }
          {viewtype === "tokenizer" && <Tokenizer /> }
          {viewtype === "memolinker" && <NotesProvider><MemoLinker /></NotesProvider> }
          {viewtype === "memo" && <NotesProvider><MemoMaker /></NotesProvider> }
          {viewtype === "windowchecker" && <WindowChecker /> }
          {viewtype === "conceptsSearch" && <ConceptSearch /> }
          {viewtype === "schedule" && <Schedule /> }
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
