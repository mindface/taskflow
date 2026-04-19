import DashBord from "../components/DashBord";
import Guidelines from "../components/Guidelines";
import ViewAndroidMemo from "./ViewAndroidMemo";

function Home() {

  return (
    <div className="main-box">
      <main className="main">
        <Guidelines />
        <DashBord />
        <ViewAndroidMemo />
      </main>
    </div>
  );
}

export default Home;
