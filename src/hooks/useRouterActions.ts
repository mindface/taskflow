import { useUIContext } from "../store/ui";
import { useNavigate } from "@tanstack/react-router";
import { viewTypeToPath } from "../utils/pageRoutes";

export function useRouterActions() {
  const { dispatch } = useUIContext();
  const navigate = useNavigate();

  return {
    requestViewtypeChange: (path: string, shouldConfirm: boolean) => {
      dispatch({
        type: "REQUEST_VIEWTYPE_CHANGE",
        payload: path,
      });

      if (!shouldConfirm) {
        void navigate({ to: viewTypeToPath(path) });
      }
    },
    toggleSidebar: () => {
      dispatch({
        type: "TOGGLE_SIDEBAR",
      });
    },
  };
}
