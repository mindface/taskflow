import DashBord from "../components/DashBord";
import Guidelines from "../components/Guidelines";
import Header from "../components/core/Header"
import DbInspector from "../components/DbInspector";

function Home() {
  return (
    <div className="main-box">
      <Header />
      <main className="main">
        <Guidelines />
        <DbInspector />
        <DashBord />
      </main>
    </div>
  );
}

export default Home;
