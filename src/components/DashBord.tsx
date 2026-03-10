import { useState , useContext } from "react";
import { dataContext } from "../store/dataBox";

export default function Header() {
  const { state, dispatch} = useContext(dataContext);
  const [list, listSet] = useState(state.dataBoxList ?? [])

  return (
    <div className="DashBord">
      ダッシュボード11
      {list.map((item,k) => <p key={`item${k}`} className="p-2">{item.title}</p>)}
    </div>
  );
}
