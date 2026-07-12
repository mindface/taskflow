import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// TODO Tauriバージョン次第で変更予定
// import { usePreviewListener } from '../hooks/useWindowSync';
// import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/core";
import SubMemo from "../components/modifier/SubMemo";
import 'github-markdown-css/github-markdown.css';
import '../styles/markdown.css';

export default function SubTextWindow() {
  const [title, setTitle] = useState('プレビュー準備中...');
  const [content, setContent] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const initial = await invoke<any>('get_current_preview_content');
        handleContentUpdate(initial);
      } catch (e) {
        console.error('failed to load initial content', e);
      }
    })();
  }, []);

  const handleContentUpdate = useCallback((payload: { content: string; title: string }) => {
    setTitle(payload.title || 'プレビュー');
    setContent(payload.content);
  }, []);


  return (
    <div className="preview-window" style={{ 
      height: '100vh', 
      overflow: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <div className="header mb-4 pb-4">サブ---マイカー
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>
      <SubMemo />
    </div>
  );
}