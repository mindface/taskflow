import { useState, useCallback, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// TODO Tauriバージョン次第で変更予定
// import { usePreviewListener } from '../hooks/useWindowSync';
// import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from "@tauri-apps/api/core";
import { NoteData } from '../models/Notes';
import 'github-markdown-css/github-markdown.css';
import '../styles/markdown.css';

export default function PreviewWindow() {
  const [title, setTitle] = useState('プレビュー準備中...');
  const [content, setContent] = useState('');
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugRef = useRef((msg: string) => {
    console.log('[PreviewWindow]', msg);
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  });

  useEffect(() => {
    addDebugRef.current('PreviewWindow mounted');
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
    addDebugRef.current(`Content update received: title="${payload.title}", content length=${payload.content.length}`);
    setTitle(payload.title || 'プレビュー');
    setContent(payload.content);
  }, []);


  return (
    <div className="preview-window" style={{ 
      height: '100vh', 
      overflow: 'auto',
      padding: '24px',
      backgroundColor: '#ffffff'
    }}>
      {/* デバッグ情報 */}
      <div style={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        background: 'rgba(0,0,0,0.8)', 
        color: 'white', 
        padding: '8px', 
        fontSize: '10px',
        borderRadius: '4px',
        maxWidth: '300px',
        zIndex: 9999
      }}>
        {debugInfo.map((info, i) => <div key={i}>{info}</div>)}
      </div>

      <div className="header mb-4 pb-4 border-b">
        <h1 className="text-3xl font-bold">{title}</h1>
      </div>

      <div className="markdown-body mb-6" style={{ minHeight: '200px' }}>
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        ) : (
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Markdownを入力すると、ここにプレビューが表示されます
          </p>
        )}
      </div>

      {noteData && (
        <div className="note-data-preview p-6 mt-6 border-t bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Note Data</h2>
          <div className="concepts mb-6">
            <h3 className="text-xl font-medium mb-3">
              Concepts ({noteData.concepts.length})
            </h3>
            <div className="grid gap-4">
              {noteData.concepts.map((concept) => (
                <div 
                  key={concept.id} 
                  className="concept-card p-4 bg-white rounded shadow-sm"
                  style={{ borderLeft: '4px solid #3b82f6' }}
                >
                  <h4 className="font-bold text-lg mb-2">{concept.name}</h4>
                  <p className="text-gray-700 mb-2">{concept.description}</p>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {concept.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relations">
            <h3 className="text-xl font-medium mb-3">
              Relations ({noteData.relations.length})
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {noteData.relations.map((relation, index) => (
                <li 
                  key={index} 
                  className="p-3 bg-white rounded shadow-sm mb-2"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    Concept {relation.from_concept_id}
                  </span>
                  <span style={{ margin: '0 8px', color: '#666' }}>→</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    Concept {relation.to_concept_id}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '12px',
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {relation.relation_type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}