import paths from "../json/path.json";

type Props = {
  activePath: string;
  nextPageAction: (path: string) => void
}

function Header(props: Props) {
  const { nextPageAction, activePath } = props
  const pageAction = nextPageAction ?? (() => {})
  return (
    <header className="basic-header">
      <ul className="list flex">
      {paths.map((item,k) => <li
        key={k}
        className={["item","p-1","link", item.name === activePath ? "active" : "" ].join(" ")} onClick={() => pageAction(`${item.name}`)}>{item.name}</li>)}
      </ul>
    </header>
  );
}

export default Header;
