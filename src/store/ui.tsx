import type { Dispatch, ReactNode } from "react";
import { createContext, useContext, useReducer } from "react";

type UIState = {
  viewtype: string;
  isSidebarOpen: boolean;
  inputCheckValue: string;
  inputCheckLabel: string;
  inputCheckEnabled: boolean;
  isInputConfirmOpen: boolean;
  isSaveConfirmOpen: boolean;
  pendingViewtype: string | null;
};

type UIAction =
  | { type: "SET_VIEWTYPE"; payload: string }
  | { type: "REQUEST_VIEWTYPE_CHANGE"; payload: string }
  | { type: "CONFIRM_VIEWTYPE_CHANGE" }
  | { type: "CANCEL_VIEWTYPE_CHANGE" }
  | {
      type: "SET_INPUT_CHECK_VALUE";
      payload: {
        value: string;
        label?: string;
        enabled?: boolean;
      };
    }
  | { type: "SET_SAVE_CONFIRM_OPEN"; payload: boolean }
  | { type: "CLEAR_INPUT_CHECK_VALUE" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean };

const initialState: UIState = {
  viewtype: "home",
  isSidebarOpen: false,
  inputCheckValue: "",
  inputCheckLabel: "入力値",
  inputCheckEnabled: false,
  isInputConfirmOpen: false,
  isSaveConfirmOpen: true,
  pendingViewtype: null,
  
};

function reducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_VIEWTYPE":
      return {
        ...state,
        viewtype: action.payload,
      };
    case "REQUEST_VIEWTYPE_CHANGE":
      if (state.viewtype === action.payload) {
        return state;
      }

      if (
        !state.isSaveConfirmOpen ||
        (state.inputCheckEnabled && state.inputCheckValue.trim() !== "")) {
        return {
          ...state,
          isInputConfirmOpen: true,
          pendingViewtype: action.payload,
        };
      }

      return {
        ...state,
        viewtype: action.payload,
        inputCheckValue: "",
        inputCheckLabel: "入力値",
        inputCheckEnabled: false,
        isInputConfirmOpen: false,
        pendingViewtype: null,
      };
    case "CONFIRM_VIEWTYPE_CHANGE":
      return {
        ...state,
        viewtype: state.pendingViewtype ?? state.viewtype,
        inputCheckValue: "",
        inputCheckLabel: "入力値",
        inputCheckEnabled: false,
        isInputConfirmOpen: false,
        pendingViewtype: null,
      };
    case "CANCEL_VIEWTYPE_CHANGE":
      return {
        ...state,
        isInputConfirmOpen: false,
        pendingViewtype: null,
      };
    case "SET_INPUT_CHECK_VALUE":
      const {label,value,enabled} = action.payload;
      let inputCheckLabel = "";
      if(label) {
       inputCheckLabel = label;
      }
      return {
        ...state,
        inputCheckValue: value,
        inputCheckLabel: inputCheckLabel,
        inputCheckEnabled: enabled ?? true,
      };
    case "SET_SAVE_CONFIRM_OPEN":
      return {
        ...state,
        isSaveConfirmOpen: action.payload,
      };
    case "CLEAR_INPUT_CHECK_VALUE":
      return {
        ...state,
        inputCheckValue: "none",
        inputCheckLabel: "入力値",
        inputCheckEnabled: false,
        isSaveConfirmOpen: true,
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
