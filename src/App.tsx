import { useState } from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Structsmake from "./pages/Structsmake";
import Tokenizer from "./pages/Tokenizer";
import MemoLinker from "./pages/MemoLinker";
import MemoMaker from "./pages/MemoMaker";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { DataProvider } from "./store/dataBox";
import { NotesProvider } from "./store/note";

function App() {
  const [viewtype, viewTypeSet] = useState("home");

  return (
    <BrowserRouter>
      <div className="div-outer">
        <Header
          nextPageAction={(path:string) => viewTypeSet(path)}
        />
        <p className="text-black">{viewtype}</p>
        <main className="main">
          {viewtype === "home " && <DataProvider><Home /></DataProvider> }
          {viewtype === "structsmake" && <Structsmake /> }
          {viewtype === "tokenizer" && <Tokenizer /> }
          {viewtype === "memolinker" && <NotesProvider><MemoLinker /></NotesProvider> }
          {viewtype === "memo" && <NotesProvider><MemoMaker /></NotesProvider> }
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
