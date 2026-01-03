import { useEffect } from "react";
import paths from "../json/path.json";

type Props = {
  nextPageAction: (path: string) => void
}

function Header(props: Props) {
  const { nextPageAction } = props
  const pageAction = nextPageAction ?? (() => {})
  useEffect(() => {
    console.log(paths)
  },[])
  return (
    <header className="header">
      {paths.map((item,k) => <span key={k} className="p-1 link" onClick={() => pageAction(`${item.name}`)}>{item.name}</span>)}
    </header>
  );
}

export default Header;
