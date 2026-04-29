import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import type { LlmMemo } from "../models/LlmMemo";
import CoreDialog from "../components/core/CoreDialog";

const initialForm = {
  title: "",
  content: "",
  tag: "",
  role: "",
};

export default function LlmMemoPage() {
  const [memos, setMemos] = useState<LlmMemo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState(initialForm.title);
  const [content, setContent] = useState(initialForm.content);
  const [tag, setTag] = useState(initialForm.tag);
  const [role, setRole] = useState(initialForm.role);
  const [filterTag, setFilterTag] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingMemo, setEditingMemo] = useState<LlmMemo | null>(null);
  const [deletingMemo, setDeletingMemo] = useState<LlmMemo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editRole, setEditRole] = useState("");

  async function loadMemos() {
    setLoading(true);
    try {
      const result = await invoke<LlmMemo[]>("list_llm_memos");
      setMemos(result ?? []);
    } catch (error) {
      console.error("list_llm_memos error", error);
    } finally {
      setLoading(false);
    }
  }

  async function selectMemo(id: number) {
    try {
      const memo = await invoke<LlmMemo>("get_llm_memo", { id });
      setSelectedId(memo.id);
      setTitle(memo.title);
      setContent(memo.content);
      setTag(memo.tag);
      setRole(memo.role);
    } catch (error) {
      console.error("get_llm_memo error", error);
    }
  }

  async function createMemo() {
    try {
      const newId = await invoke<number>("add_llm_memo", {
        title: title || "untitled",
        content,
        tag,
        role,
      });
      await loadMemos();
      await selectMemo(newId);
    } catch (error) {
      console.error("add_llm_memo error", error);
    }
  }

  async function saveMemo() {
    if (selectedId == null) {
      return;
    }

    try {
      await invoke("update_llm_memo", {
        id: selectedId,
        title,
        content,
        tag,
        role,
      });
      await loadMemos();
    } catch (error) {
      console.error("update_llm_memo error", error);
    }
  }

  async function deleteMemo(id: number) {
    try {
      await invoke("delete_llm_memo", { id });
      if (selectedId === id) {
        resetForm();
      }
      await loadMemos();
    } catch (error) {
      console.error("delete_llm_memo error", error);
    }
  }

  async function saveEditingMemo() {
    if (editingMemo == null) {
      return;
    }

    try {
      await invoke("update_llm_memo", {
        id: editingMemo.id,
        title: editTitle,
        content: editContent,
        tag: editTag,
        role: editRole,
      });
      setEditingMemo(null);
      await loadMemos();
      await selectMemo(editingMemo.id);
    } catch (error) {
      console.error("update_llm_memo modal error", error);
    }
  }

  async function confirmDeleteMemo() {
    if (deletingMemo == null) {
      return;
    }

    await deleteMemo(deletingMemo.id);
    setDeletingMemo(null);
  }

  function openEditDialog(memo: LlmMemo) {
    setEditingMemo(memo);
    setEditTitle(memo.title);
    setEditContent(memo.content);
    setEditTag(memo.tag);
    setEditRole(memo.role);
  }

  function closeEditDialog() {
    setEditingMemo(null);
  }

  function openDeleteDialog(memo: LlmMemo) {
    setDeletingMemo(memo);
  }

  function closeDeleteDialog() {
    setDeletingMemo(null);
  }

  function resetForm() {
    setSelectedId(null);
    setTitle(initialForm.title);
    setContent(initialForm.content);
    setTag(initialForm.tag);
    setRole(initialForm.role);
  }

  useEffect(() => {
    void loadMemos();
  }, []);

  const filteredMemos = memos.filter((memo) => {
    const tagMatched =
      filterTag.trim() === "" ||
      memo.tag.toLowerCase().includes(filterTag.trim().toLowerCase());
    const roleMatched =
      filterRole.trim() === "" ||
      memo.role.toLowerCase().includes(filterRole.trim().toLowerCase());

    return tagMatched && roleMatched;
  });

  return (
    <div className="p-4">
      <section className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-size-title">LLM Memo</h2>
          <div className="flex gap-4">
            <button onClick={loadMemos}>再読み込み</button>
            <button onClick={resetForm}>新規</button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-half border rounded p-4">
            <div className="pb-2 flex gap-4">
              <input
                className="w-100"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="タイトル"
              />
            </div>
            <div className="pb-2 flex gap-4">
              <input
                className="w-half"
                value={tag}
                onChange={(event) => setTag(event.target.value)}
                placeholder="tag"
              />
              <input
                className="w-half"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="role"
              />
            </div>
            <div className="pb-2">
              <textarea
                className="p-4"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="LLMメモ本文"
                style={{ width: "100%", minHeight: "50vh" }}
              />
            </div>
            <div className="flex gap-4">
              <button onClick={selectedId == null ? createMemo : saveMemo}>
                {selectedId == null ? "作成" : "保存"}
              </button>
              {selectedId != null && (
                <button onClick={() => deleteMemo(selectedId)}>削除</button>
              )}
            </div>
          </div>
          <div className="w-half border rounded p-4">
            <div className="pb-2 font-size-middle">一覧</div>
            <div className="pb-4 flex gap-4">
              <input
                className="w-half"
                value={filterTag}
                onChange={(event) => setFilterTag(event.target.value)}
                placeholder="tagで絞り込み"
              />
              <input
                className="w-half"
                value={filterRole}
                onChange={(event) => setFilterRole(event.target.value)}
                placeholder="roleで絞り込み"
              />
            </div>
            {loading && <div className="pb-2">loading...</div>}
            <ul>
              {filteredMemos.map((memo) => (
                <li
                  key={memo.id}
                  className="sidebar-item relative p-2 border-b border-gray-200"
                >
                  <div className="flex justify-between items-center pb-2">
                    <strong
                      className="inline-block hover"
                      onClick={() => selectMemo(memo.id)}
                    >
                      {memo.title}
                    </strong>
                    <small>{memo.updated_at}</small>
                  </div>
                  <div className="pb-2">tag: {memo.tag || "-"}</div>
                  <div className="pb-2">role: {memo.role || "-"}</div>
                  <p>{memo.content.slice(0, 120)}</p>
                  <div className="action-items flex gap-2">
                    <div
                      className="hover shot-icon-btn p-2"
                      onClick={() => openEditDialog(memo)}
                    >
                      更新
                    </div>
                    <div
                      className="hover shot-icon-btn p-2"
                      onClick={() => openDeleteDialog(memo)}
                    >
                      削除
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {!loading && filteredMemos.length === 0 && (
              <div className="p-2 border rounded">一致するLLMメモはありません</div>
            )}
          </div>
        </div>
      </section>
      <CoreDialog
        className="daialog-content-wide"
        isOpen={editingMemo != null}
        title="llm memo edit dialog"
        onClose={closeEditDialog}
      >
        <div className="p-2">
          <div className="pb-2 flex gap-4">
            <input
              className="w-100"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              placeholder="タイトル"
            />
          </div>
          <div className="pb-2 flex gap-4">
            <input
              className="w-half"
              value={editTag}
              onChange={(event) => setEditTag(event.target.value)}
              placeholder="tag"
            />
            <input
              className="w-half"
              value={editRole}
              onChange={(event) => setEditRole(event.target.value)}
              placeholder="role"
            />
          </div>
          <div className="pb-2">
            <textarea
              className="p-4"
              value={editContent}
              onChange={(event) => setEditContent(event.target.value)}
              style={{ width: "100%", minHeight: "40vh" }}
            />
          </div>
          <div className="flex gap-4">
            <button onClick={saveEditingMemo}>保存</button>
            <button onClick={closeEditDialog}>閉じる</button>
          </div>
        </div>
      </CoreDialog>
      <CoreDialog
        isOpen={deletingMemo != null}
        title="llm memo delete dialog"
        onClose={closeDeleteDialog}
      >
        <div className="p-2">
          <div className="pb-4">
            {deletingMemo?.title || "(無題)"} を削除してよろしいですか？
          </div>
          <div className="flex gap-4">
            <button onClick={confirmDeleteMemo}>削除する</button>
            <button onClick={closeDeleteDialog}>キャンセル</button>
          </div>
        </div>
      </CoreDialog>
    </div>
  );
}
