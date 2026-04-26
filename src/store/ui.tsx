import type { Dispatch, ReactNode } from "react";
import { createContext, useContext, useReducer } from "react";

type UIState = {
  viewtype: string;
  isSidebarOpen: boolean;
};

type UIAction =
  | { type: "SET_VIEWTYPE"; payload: string }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean };

const initialState: UIState = {
  viewtype: "home",
  isSidebarOpen: false,
};

function reducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_VIEWTYPE":
      return {
        ...state,
        viewtype: action.payload,
      };
    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    case "SET_SIDEBAR_OPEN":
      return {
        ...state,
        isSidebarOpen: action.payload,
      };
    default:
      return state;
  }
}

const UIContext = createContext<{
  state: UIState;
  dispatch: Dispatch<UIAction>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <UIContext.Provider value={{ state, dispatch }}>{children}</UIContext.Provider>;
}

export function useUIContext() {
  return useContext(UIContext);
}
