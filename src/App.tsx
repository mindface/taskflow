import { useState } from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Structsmake from "./pages/Structsmake";
import Tokenizer from "./pages/Tokenizer";
import MakerText from "./pages/MakerText";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { DataProvider } from "./store/dataBox";

function App() {
  const [viewtype, viewTypeSet] = useState("home");

  // react-router-domでエラーのため、タブのようにして表示 20230716
  return (
    <BrowserRouter>
      <div className="div-outer">
        <Header
          nextPageAction={(path:string) => viewTypeSet(path)}
        />
        <>{viewtype}</>
        <main className="main">
          {viewtype === "home " && <DataProvider><Home/></DataProvider> }
          {viewtype === "structsmake" && <Structsmake/> }
          {viewtype === "tokenizer" && <Tokenizer/> }
          {viewtype === "makertext" && <MakerText/> }
        </main>
        <Footer />
      </div>
    </BrowserRouter>
    
  );
}

export default App;
