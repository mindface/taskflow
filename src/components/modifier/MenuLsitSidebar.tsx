import paths from "../../json/path.json";
import ImageDialog from "./ImageDialog";
import { useUIContext } from "../../store/ui";
import { useNavigate } from "@tanstack/react-router";
import { viewTypeToPath } from "../../utils/pageRoutes";

export default function MenuLsitDialog() {
  const { state, dispatch } = useUIContext();
  const navigate = useNavigate();
  const { viewtype: activePath, isSidebarOpen: switcher } = state;

  const switcherAction = () => {
    dispatch({
      type: "TOGGLE_SIDEBAR",
    });
  };

  const pageAction = (path: string) => {
    const shouldConfirm =
      activePath !== path &&
      (!state.isSaveConfirmOpen ||
        (state.inputCheckEnabled && state.inputCheckValue.trim() !== ""));

    dispatch({
      type: "REQUEST_VIEWTYPE_CHANGE",
      payload: path,
    });

    if (!shouldConfirm) {
      void navigate({ to: viewTypeToPath(path) });
    }
  };

  return (
    <div className={ switcher ? "sidebar-outer sidebar-on p-4" : "sidebar-outer p-4" }>
      <div className="sidebar-on-overlay"></div>
      <div className="sidebar relative">
        <div>
          <div className="sidebar-btn">
            <button
              className="box-shadow"
              onClick={switcherAction}>
                {switcher?"close":"open"}
            </button>
          </div>
          <ul className="list">
            {paths.map((item,k) => <li
                key={k}
                className={`block cursor-pointer p-2 transition-all text-left
                  ${activePath === item.name ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"}
                `}
                onClick={() => pageAction(item.name)}>{item.name}
              </li>
            )}
          </ul>
          <div className="absolute left-0 bottom-0">
            <ImageDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
