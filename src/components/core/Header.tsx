import paths from "../../json/path.json";

import ImageDialog from "../modifier/ImageDialog";

import { useUIContext } from "../../store/ui";
import { useRouterActions } from "../../hooks/useRouterActions";

type Props = {}

function Header(props: Props) {
  const { state } = useUIContext();
  const { requestViewtypeChange, toggleSidebar } = useRouterActions();
  const { viewtype: activePath } = state;

  const pageAction = (path: string) => {
    const shouldConfirm =
      activePath !== path &&
      (!state.isSaveConfirmOpen ||
        (state.inputCheckEnabled && state.inputCheckValue.trim() !== ""));

    requestViewtypeChange(path, shouldConfirm);
  }

  return (
    <header className="basic-header mb-4">
      <ul className="list flex">
        {paths.map((item,k) => <li
            key={k}
            className={["item","p-1","link", item.name === activePath ? "active" : "" ].join(" ")}
            onClick={() => pageAction(`${item.name}`)}>{item.name}
          </li>
        )}
      </ul>
      <ImageDialog />
    </header>
  );
}

export default Header;
