import { FormEvent, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { User } from "../models/User";
import { useUIContext } from "../store/ui";

type UiSelectionPayload = {
  [key: string]: unknown;
};

export default function UserRegister() {
  const { dispatch } = useUIContext();
  const [firebaseUid, setFirebaseUid] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activated, setActivated] = useState(true);
  const [roles, setRoles] = useState("");
  const [uiSelection, setUiSelection] = useState("{\n  \"theme\": \"light\",\n  \"sidebarOpen\": true,\n  \"voiceInputEnabled\": false\}");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const result = await invoke<User[]>("list_users");
      console.log("Fetched Users:", result);
      setUsers(result || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const setUiSelectionValue = (taget: string, value: unknown) => {
    const currentSelection = parseUiSelection(uiSelection) || {};
    const nextSelection = {
      ...currentSelection,
      [taget]: value,
    };
    const nextSelectionString = JSON.stringify(nextSelection, null, 2);
    setUiSelection(nextSelectionString);
    dispatch({ type: "SET_UI_SELECTION", payload: nextSelection });
  };

  const parseUiSelection = (value: string | null | undefined): UiSelectionPayload | null => {
    if (!value) {
      return null;
    }

    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed !== null ? parsed : null;
    } catch {
      const payload: UiSelectionPayload = {};
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => {
          const [key, val] = item.split(":").map((part) => part.trim());
          if (key && val !== undefined) {
            payload[key] = val;
          }
        });
      return Object.keys(payload).length ? payload : null;
    }
  };

  const applyUserUiSelection = (user: User) => {
    const parsed = parseUiSelection(user.ui_selection);
    if (!parsed) {
      window.alert("このユーザーの UI 情報は適用できません。");
      return;
    }
    dispatch({ type: "SET_UI_SELECTION", payload: parsed });
    setSelectedUserId(user.id);
    window.alert("ユーザーの UI 情報を適用しました。");
  };

  const parsedUiSelection = parseUiSelection(uiSelection) || {};
  const voiceInputEnabled = parsedUiSelection.voiceInputEnabled === true;

  const populateFormWithUser = (user: User) => {
    setSelectedUserId(user.id);
    setFirebaseUid(user.firebase_uid);
    setEmail(user.email);
    setDisplayName(user.display_name);
    setActivated(user.activated);
    setRoles(user.roles ?? "");
    setUiSelection(user.ui_selection ?? "{\n  \"theme\": \"light\",\n  \"sidebarOpen\": true\n}");
    applyUserUiSelection(user);
  };

  const handleUserSelect = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      populateFormWithUser(user);
    }
  };

  const clearSelection = () => {
    setSelectedUserId(null);
    setFirebaseUid("");
    setEmail("");
    setDisplayName("");
    setActivated(true);
    setRoles("");
    setUiSelection("{\n  \"theme\": \"light\",\n  \"sidebarOpen\": true,\n  \"voiceInputEnabled\": false\}");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (selectedUserId) {
        const userId = await invoke<number>("update_user", {
          id: selectedUserId,
          firebaseUid,
          email,
          displayName,
          activated,
          roles: roles || null,
          uiSelection: uiSelection || null,
        });
        window.alert(`User updated: ${userId}`);
      } else {
        const userId = await invoke<number>("add_user", {
          firebaseUid,
          email,
          displayName,
          activated,
          roles: roles || null,
          uiSelection: uiSelection || null,
        });
        window.alert(`User created: ${userId}`);
      }
      clearSelection();
      fetchUsers();
    } catch (error) {
      console.error(error);
      window.alert("Failed to save user");
    }
  };

  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold mb-4">{selectedUserId ? "Edit User" : "User Registration"}</h1>
      <form className="space-y-4 mb-8" onSubmit={handleSubmit}>
        <div className="pb-4">
          <label className="block text-sm font-medium">Firebase UID</label>
          <input
            className="mt-1 block w-full rounded border px-3 py-2"
            value={firebaseUid}
            onChange={(e) => setFirebaseUid(e.target.value)}
            required
          />
        </div>
        <div className="pb-4">
          <label className="block text-sm font-medium">Email</label>
          <input
            className="mt-1 block w-full rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="pb-4">
          <label className="block text-sm font-medium">Display Name</label>
          <input
            className="mt-1 block w-full rounded border px-3 py-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="pb-4">
          <input
            id="activated"
            type="checkbox"
            checked={activated}
            onChange={(e) => setActivated(e.target.checked)}
          />
          <label htmlFor="activated" className="text-sm">
            ユーザーを有効化する
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium">Roles</label>
          <input
            className="mt-1 block w-full rounded border px-3 py-2"
            value={roles}
            onChange={(e) => setRoles(e.target.value)}
            placeholder="admin,editor"
          />
        </div>
        <div className="space-y-3">
          <div>
            Select UI:
            <select
              name="ui-select"
              id="pet-select"
              onChange={(e) => setUiSelectionValue("moveUi", e.target.value)}
              value={String(parsedUiSelection.moveUi ?? "")}
              className="mt-1 block w-full rounded border px-3 py-2"
            >
              <option value="">--1 つ選択してください--</option>
              <option value="1">nomal</option>
              <option value="2">mover</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="voice-input-enabled"
              type="checkbox"
              checked={voiceInputEnabled}
              onChange={(e) => setUiSelectionValue("voiceInputEnabled", e.target.checked)}
            />
            <label htmlFor="voice-input-enabled" className="text-sm">
              音声入力を有効化
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">UI Selection JSON</label>
          <textarea
            className="mt-1 block w-full rounded border px-3 py-2"
            rows={6}
            value={uiSelection}
            onChange={(e) => setUiSelection(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {selectedUserId ? "Update User" : "Register User"}
          </button>
          {selectedUserId && (
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={clearSelection}
            >
              Clear Selection
            </button>
          )}
        </div>
      </form>

      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-3">Existing Users</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium">Select User to Apply Settings:</label>
          <select
            className="mt-1 block w-full rounded border px-3 py-2"
            value={selectedUserId ?? ""}
            onChange={(e) => {
              const id = e.target.value ? parseInt(e.target.value, 10) : null;
              if (id) {
                handleUserSelect(id);
              } else {
                clearSelection();
              }
            }}
          >
            <option value="">-- Select a user --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.display_name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`rounded border p-3 transition-all ${
                selectedUserId === user.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="font-semibold">{user.display_name} ({user.email})</div>
              <div className="text-sm text-slate-600">UID: {user.firebase_uid}</div>
              <div className="text-sm">Activated: {user.activated ? "Yes" : "No"}</div>
              {user.roles && <div className="text-sm">Roles: {user.roles}</div>}
              {selectedUserId === user.id && (
                <div className="mt-2 rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                  ✓ Selected
                </div>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className={`rounded px-3 py-1 text-white transition-all ${
                    selectedUserId === user.id
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={() => applyUserUiSelection(user)}
                >
                  {selectedUserId === user.id ? "Selected" : "Apply UI"}
                </button>
              </div>
              {user.ui_selection && (
                <pre className="mt-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs">
                  {user.ui_selection}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
