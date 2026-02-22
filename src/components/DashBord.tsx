import { useState , useContext } from "react";
import { dataContext } from "../store/dataBox";

export default function Header() {
  const { state, dispatch} = useContext(dataContext);
  const [list, listSet] = useState(state.dataBoxList ?? [])

  return (
    <div className="DashBord">
      ダッシュボード
      {list.map((item,k) => <span key={`item${k}`}>{item.title}</span>)}
    </div>
  );
}
