import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { Schedule } from '../models/Schedule';
import 'github-markdown-css/github-markdown.css';
import '../styles/markdown.css';

import ScheduleItem from "../components/modifier/ScheduleItem";

export default function ViewScheduleWindow() {
  const [scheduleData, setScheduleData] = useState<Schedule>();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugRef = useRef((msg: string) => {
    setDebugInfo((prev) => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${msg}`]);
  });

  useEffect(() => {
    addDebugRef.current('PreviewWindow mounted');
    (async () => {
      try {
        const getData = await invoke<any>('get_target_schedule_content');
        setScheduleData(getData)
      } catch (e) {
        console.error('failed to load initial content', e);
      }
    })();
  }, []);

  return (
    <div className="preview-window" style={{ 
      height: '100vh', 
      overflow: 'auto',
      padding: '24px',
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
        zIndex: 10
      }}>
        {debugInfo.map((info, i) => <div key={i}>{info}</div>)}
      </div>

      <div className="header mb-4 pb-4">
        <h2 className="text-3xl font-bold">{scheduleData?.title || 'プレビュー'}</h2>
      </div>
      {scheduleData && <ScheduleItem
        schedule={scheduleData}
        loadSchedules={() => {}}
        setScheduleAction={() => {}}
        viewBtons={{ dialog: true, update: true, delete: true, view: false }}  
      />}
    </div>
  );
}