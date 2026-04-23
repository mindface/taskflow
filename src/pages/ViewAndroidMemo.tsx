import AndroidMemoList from "../components/AndroidMemoList";
interface AndroidNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const ViewAndroidMemo: React.FC = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <AndroidMemoList />
    </div>
  );
};

export default ViewAndroidMemo;
