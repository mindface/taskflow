import AndroidMemoList from "../components/AndroidMemoList";
import AndroidSelectSymbolList from "../components/AndroidSelectSymbolList";

const ViewAndroidMemo: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <AndroidMemoList />
      <div className="my-8"></div>
      <AndroidSelectSymbolList />
    </div>
  );
};

export default ViewAndroidMemo;
