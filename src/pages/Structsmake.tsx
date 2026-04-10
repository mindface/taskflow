import { useState } from "react";
import categoryData from "../json/ca.json";
import categoryErpData from "../json/erp.json";

function Structsmake() {
  const [tabSwitcher,tabSwitcherSet] = useState(false);
  const [erpInfo,_1] = useState(categoryErpData.categories);
  const [category,_2] = useState(categoryData.categories);

  const tabAction = () => {
    tabSwitcherSet(!tabSwitcher);
  }

  return (
    <div className="main-box">
      <main className="main">
        <div className="tab-action p-4">
          <button onClick={tabAction}>{ tabSwitcher ? 'システム系' : '学術系' }を確認</button>
        </div>
        { tabSwitcher ?
          <div className="academic-info">
            <h3 className="academic-info__title text-black">学術系</h3>
            {category.map((item) => <p key={item.id} className="p-4 text-black">{item.ja}</p>)}
          </div> :
          <div className="systemer-info">
            <h3 className="systemer-info__title text-black">システム系</h3>
            {erpInfo.map((item) => <div key={item.id} className="mb-4 p-2 text-black border rounded">
              <h3 className="p-2">{item.ja}</h3>
              <div className="p-2">{item.children.map((child) => <div key={child.numberId}>
                <h3>{child.title}</h3>
                <div>{(child?.infoList ?? []).map((info: any) => <div className="p-2" key={info.systemName}>
                  <h4 className="mb-4 p-2 border-b-2 border-gray-300">{info.systemName}</h4>
                  <p>{info.detail}</p>
                  <ul>{(info.systemInfoList ?? []).map((item:any) => <li key={item} className="pb-2">{item}</li>)}</ul>
                </div>)}</div>
                </div>)}
              </div>
            </div>)}
          </div>}
      </main>
    </div>
  );
}

export default Structsmake;
