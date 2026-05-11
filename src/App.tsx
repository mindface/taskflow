import "./App.css";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

import MenuLsit from "./components/modifier/MenuLsit";
import Footer from "./components/core/Footer";
import HoverFollow from "./components/modifier/HoverFollow";
import CoreDialog from "./components/core/CoreDialog";

import { useUIContext } from "./store/ui";
import { pathToViewType, viewTypeToPath } from "./utils/pageRoutes";

function App() {
  const { state, dispatch } = useUIContext();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (routerState) => routerState.location.pathname,
  });
  const viewtype = state.viewtype;

  useEffect(() => {
    dispatch({ type: "SET_VIEWTYPE", payload: pathToViewType(pathname) });
  }, [dispatch, pathname]);

  const confirmViewtypeChange = () => {
    const pendingViewtype = state.pendingViewtype;
    dispatch({ type: "CONFIRM_VIEWTYPE_CHANGE" });
    if (pendingViewtype) {
      void navigate({ to: viewTypeToPath(pendingViewtype) });
    }
  };

  return (
      <div className="div-outer">{viewtype}
          <HoverFollow
            className="app-main-follow" glowClassName="app-main-follow__orb"
          >
            <main className="main">
              <Outlet />
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
                <button onClick={confirmViewtypeChange}>
                  移動する
                </button>
                <button onClick={() => dispatch({ type: "CANCEL_VIEWTYPE_CHANGE" })}>
                  キャンセル
                </button>
              </div>
            </div>
          </CoreDialog>
      </div>
  );
}

export default App;
