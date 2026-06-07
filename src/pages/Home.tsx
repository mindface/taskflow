import DashBord from "../components/DashBord";
import Guidelines from "../components/Guidelines";
import Header from "../components/core/Header"

function Home() {
  return (
    <div className="main-box">
      <Header />
      <main className="main">
        <Guidelines />
        <DashBord />
      </main>
    </div>
  );
}

export default Home;
