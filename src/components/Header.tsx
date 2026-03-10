import paths from "../json/path.json";

import ImageDialog from "./modifier/ImageDialog";

type Props = {
  activePath: string;
  nextPageAction: (path: string) => void
}

function Header(props: Props) {
  const { nextPageAction, activePath } = props
  const pageAction = nextPageAction ?? (() => {})
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
