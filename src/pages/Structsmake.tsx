import { useState } from "react";
import categoryData from "../json/ca.json";

function Structsmake() {

  const [category,_] = useState(categoryData.categories)

  return (
    <div className="main-box">
      <main className="main">
        {category.map((item) => <p className="p-4">{item.ja}</p>)}
      </main>
    </div>
  );
}

export default Structsmake;
