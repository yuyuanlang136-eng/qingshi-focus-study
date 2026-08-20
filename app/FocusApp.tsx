"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import * as echarts from "echarts";
import {
  BarChart3, BookOpen, CalendarCheck, Check, CirclePause,
  CirclePlay, Clock3, Coffee, Edit3, Flame, Leaf, ListTodo, Pause,
  Play, Plus, RefreshCcw, RotateCcw, Save, Settings2, Sparkles, Target,
  Trash2,
} from "lucide-react";

type Task = { id: string; content: string; description?: string; status: "0" | "1"; createTime: string };
type ClockRecord = { date: string; studyTime: number; createTime: string };
type TimerConfig = { studyDuration: number; restDuration: number };
type Mode = "study" | "rest";

const KEYS = { tasks: "focus_tasks_v1", clocks: "focus_clocks_v1", config: "focus_config_v1", minutes: "focus_minutes_v1" };
const read = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; }
};
const write = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { return; } };
const todayKey = () => new Date().toLocaleDateString("sv-SE");
const dateKey = (date: Date) => date.toLocaleDateString("sv-SE");
const shortDate = (key: string) => `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`;
const weekLabel = ["日", "一", "二", "三", "四", "五", "六"];
const request = axios.create({ baseURL: "/api", timeout: 600 });

async function persist<T>(path: string, method: "post" | "put" | "delete", payload: T, local: () => void) {
  try { await request({ url: path.replace("/api", ""), method, data: payload }); } catch { local(); }
}

function Toast({ message }: { message: string }) {
  return <div className={`toast ${message ? "show" : ""}`} role="status"><Check size={16} />{message}</div>;
}

export default function FocusApp() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clocks, setClocks] = useState<ClockRecord[]>([]);
  const [config, setConfig] = useState<TimerConfig>({ studyDuration: 25, restDuration: 5 });
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [mode, setMode] = useState<Mode>("study");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftConfig, setDraftConfig] = useState(config);
  const [taskText, setTaskText] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [range, setRange] = useState<7 | 30>(7);
  const [toast, setToast] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  const notify = useCallback((text: string) => {
    setToast(text); window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => {
    /* Browser storage is intentionally loaded once after hydration. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(read(KEYS.tasks, []));
    setClocks(read(KEYS.clocks, []));
    const savedConfig = read<TimerConfig>(KEYS.config, { studyDuration: 25, restDuration: 5 });
    setConfig(savedConfig); setDraftConfig(savedConfig); setRemaining(savedConfig.studyDuration * 60);
    const minuteStore = read<Record<string, number>>(KEYS.minutes, {});
    setTodayMinutes(minuteStore[todayKey()] || 0);
    setHydrated(true);
  }, []);

  const finishTimer = useCallback(() => {
    setRunning(false); setEndAt(null);
    if (mode === "study") {
      const minutes = config.studyDuration;
      const store = read<Record<string, number>>(KEYS.minutes, {});
      store[todayKey()] = (store[todayKey()] || 0) + minutes;
      write(KEYS.minutes, store); setTodayMinutes(store[todayKey()]);
      setMode("rest"); setRemaining(config.restDuration * 60);
      notify(`完成 ${minutes} 分钟专注，休息一下吧`);
    } else {
      setMode("study"); setRemaining(config.studyDuration * 60);
      notify("休息结束，准备开启下一轮专注");
    }
  }, [config, mode, notify]);

  useEffect(() => {
    if (!running || !endAt) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(next);
      if (next <= 0) finishTimer();
    };
    tick(); const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [running, endAt, finishTimer]);

  const startTimer = () => { if (!running) { setEndAt(Date.now() + remaining * 1000); setRunning(true); } };
  const pauseTimer = () => { setRunning(false); setEndAt(null); };
  const resetTimer = () => { setRunning(false); setEndAt(null); setRemaining((mode === "study" ? config.studyDuration : config.restDuration) * 60); };
  const switchMode = (next: Mode) => { setMode(next); setRunning(false); setEndAt(null); setRemaining((next === "study" ? config.studyDuration : config.restDuration) * 60); };

  const saveConfig = async () => {
    const study = Number(draftConfig.studyDuration), rest = Number(draftConfig.restDuration);
    if (!Number.isFinite(study) || !Number.isFinite(rest) || study < 1 || rest < 1 || study > 180 || rest > 60) {
      notify("请输入有效时长（专注 1–180，休息 1–60 分钟）"); return;
    }
    const next = { studyDuration: Math.round(study), restDuration: Math.round(rest) };
    setConfig(next); setRemaining((mode === "study" ? next.studyDuration : next.restDuration) * 60); setRunning(false); setSettingsOpen(false);
    await persist("/api/timer/config", "put", next, () => write(KEYS.config, next)); notify("计时设置已保存");
  };

  const addTask = async () => {
    const content = taskText.trim(); if (!content) { notify("先写下要完成的学习任务吧"); return; }
    const task: Task = { id: `${Date.now()}`, content, description: taskDesc.trim(), status: "0", createTime: new Date().toISOString() };
    const next = [task, ...tasks]; setTasks(next); setTaskText(""); setTaskDesc("");
    await persist("/api/task/add", "post", task, () => write(KEYS.tasks, next)); notify("任务已加入今日清单");
  };
  const updateTasks = (next: Task[]) => { setTasks(next); write(KEYS.tasks, next); };
  const toggleTask = async (id: string) => {
    const next = tasks.map(t => t.id === id ? { ...t, status: (t.status === "0" ? "1" : "0") as "0" | "1" } : t);
    updateTasks(next); await persist("/api/task/update", "put", next.find(t => t.id === id), () => write(KEYS.tasks, next));
  };
  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const next = tasks.map(t => t.id === id ? { ...t, content: editText.trim() } : t); updateTasks(next); setEditingId(null);
    await persist("/api/task/update", "put", next.find(t => t.id === id), () => write(KEYS.tasks, next));
  };
  const deleteTask = async (id: string) => {
    const next = tasks.filter(t => t.id !== id); updateTasks(next);
    await persist("/api/task/delete", "delete", { id }, () => write(KEYS.tasks, next)); notify("任务已删除");
  };
  const clearTasks = () => { if (!tasks.length || !window.confirm("确定清空全部任务吗？")) return; updateTasks([]); notify("任务清单已清空"); };

  const checkedToday = clocks.some(c => c.date === todayKey());
  const clockIn = async () => {
    if (checkedToday) { notify("今天已经打过卡啦"); return; }
    const record: ClockRecord = { date: todayKey(), studyTime: todayMinutes, createTime: new Date().toISOString() };
    const next = [record, ...clocks]; setClocks(next);
    await persist("/api/clock/add", "post", record, () => write(KEYS.clocks, next)); notify("打卡成功，今天也很棒！");
  };

  const stats = useMemo(() => {
    const minuteStore = hydrated ? read<Record<string, number>>(KEYS.minutes, {}) : {};
    return Array.from({ length: range }, (_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (range - 1 - i)); const key = dateKey(date);
      return { key, label: range === 7 ? `周${weekLabel[date.getDay()]}` : shortDate(key), value: key === todayKey() ? todayMinutes : minuteStore[key] || clocks.find(c => c.date === key)?.studyTime || 0 };
    });
  }, [range, clocks, todayMinutes, hydrated]);

  useEffect(() => {
    if (!chartRef.current || !hydrated) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      animationDuration: 700,
      grid: { left: 12, right: 12, top: 24, bottom: 8, containLabel: true },
      tooltip: { trigger: "axis", formatter: (items: Array<{ axisValue: string; value: number }>) => `${items[0].axisValue}<br/>专注 ${items[0].value} 分钟`, borderWidth: 0, backgroundColor: "#153c35", textStyle: { color: "#fff" } },
      xAxis: { type: "category", data: stats.map(s => s.label), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#87938f", fontSize: 12, interval: range === 30 ? 4 : 0 } },
      yAxis: { type: "value", minInterval: 30, axisLabel: { color: "#9ca7a3", formatter: "{value}m" }, splitLine: { lineStyle: { color: "#edf1ef", type: "dashed" } } },
      series: [{ type: "bar", data: stats.map(s => s.value), barWidth: range === 7 ? 28 : 10, itemStyle: { color: "#58b99d", borderRadius: [8, 8, 2, 2] }, emphasis: { itemStyle: { color: "#248b72" } } }],
    });
    const resize = () => chart.resize(); window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.dispose(); };
  }, [stats, hydrated, range]);

  const total = stats.reduce((sum, item) => sum + item.value, 0);
  const completed = tasks.filter(t => t.status === "1").length;
  const seconds = remaining % 60, minutes = Math.floor(remaining / 60);
  const totalSeconds = (mode === "study" ? config.studyDuration : config.restDuration) * 60;
  const progress = Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100));
  const today = new Date();

  if (!hydrated) return <main className="loading-screen"><Leaf size={30} /><span>青时正在准备你的专注空间…</span></main>;

  return (
    <main>
      <Toast message={toast} />
      <header className="topbar">
        <a className="brand" href="#focus" aria-label="青时首页"><span className="brand-mark"><Leaf size={21} /></span><span>青时</span><small>专注学习助手</small></a>
        <nav aria-label="页面导航"><a href="#focus">专注</a><a href="#tasks">任务</a><a href="#checkin">打卡</a><a href="#stats">统计</a></nav>
        <div className="today-chip"><CalendarCheck size={16} />{today.getMonth() + 1}月{today.getDate()}日 · 周{weekLabel[today.getDay()]}</div>
      </header>

      <section className="hero" id="focus">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> 今天，也专注地向前一点</div>
          <h1>把注意力，<br/><em>留给重要的事。</em></h1>
          <p>设定一个小目标，专注一段时间。每一次投入，都会成为看得见的成长。</p>
          <div className="hero-stats">
            <div><strong>{todayMinutes}</strong><span>今日分钟</span></div>
            <div><strong>{completed}<i>/{tasks.length}</i></strong><span>完成任务</span></div>
            <div><strong>{clocks.length}</strong><span>累计打卡</span></div>
          </div>
        </div>

        <section className="timer-card" aria-label="番茄专注计时器">
          <div className="timer-head">
            <div className="mode-tabs">
              <button className={mode === "study" ? "active" : ""} onClick={() => switchMode("study")}><BookOpen size={15}/>专注</button>
              <button className={mode === "rest" ? "active" : ""} onClick={() => switchMode("rest")}><Coffee size={15}/>休息</button>
            </div>
            <button className="icon-btn" onClick={() => { setDraftConfig(config); setSettingsOpen(v => !v); }} aria-label="计时设置"><Settings2 size={19}/></button>
          </div>
          {settingsOpen && <div className="settings-panel">
            <label>专注分钟<input type="number" min="1" max="180" value={draftConfig.studyDuration} onChange={e => setDraftConfig({ ...draftConfig, studyDuration: Number(e.target.value) })}/></label>
            <label>休息分钟<input type="number" min="1" max="60" value={draftConfig.restDuration} onChange={e => setDraftConfig({ ...draftConfig, restDuration: Number(e.target.value) })}/></label>
            <button onClick={saveConfig}><Save size={15}/>保存</button>
          </div>}
          <div className="timer-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <div className="timer-inner"><span>{mode === "study" ? "保持专注" : "放松片刻"}</span><strong>{String(minutes).padStart(2, "0")}<i>:</i>{String(seconds).padStart(2, "0")}</strong><small>{running ? "计时进行中" : "准备好了就开始"}</small></div>
          </div>
          <div className="timer-actions">
            <button className="sub-action" onClick={resetTimer} aria-label="重置"><RotateCcw size={20}/></button>
            <button className="primary-action" onClick={running ? pauseTimer : startTimer}>{running ? <Pause size={22} fill="currentColor"/> : <Play size={22} fill="currentColor"/>}<span>{running ? "暂停一下" : "开始专注"}</span></button>
            <button className="sub-action" onClick={() => switchMode(mode === "study" ? "rest" : "study")} aria-label="切换模式"><RefreshCcw size={20}/></button>
          </div>
          <div className="timer-tip"><Flame size={15}/>完成一轮将自动记录 {config.studyDuration} 分钟专注时长</div>
        </section>
      </section>

      <section className="content-grid">
        <section className="panel tasks-panel" id="tasks">
          <div className="section-head"><div><span className="section-kicker"><ListTodo size={15}/>学习任务</span><h2>今天准备完成什么？</h2></div><button className="text-button danger" onClick={clearTasks}><Trash2 size={15}/>清空</button></div>
          <div className="task-form">
            <div className="task-inputs"><input value={taskText} onChange={e => setTaskText(e.target.value)} onKeyDown={e => e.key === "Enter" && addTask()} placeholder="例如：完成高等数学第三章习题" aria-label="任务名称"/><input value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="补充说明（可选）" aria-label="任务说明"/></div>
            <button onClick={addTask}><Plus size={19}/><span>添加任务</span></button>
          </div>
          <div className="task-list">
            {tasks.length === 0 ? <div className="empty"><div><Target size={25}/></div><strong>清单还是空的</strong><span>写下第一个具体、可完成的小目标吧</span></div> : tasks.map(task => (
              <article className={`task-item ${task.status === "1" ? "done" : ""}`} key={task.id}>
                <button className="check" onClick={() => toggleTask(task.id)} aria-label={task.status === "1" ? "标记为未完成" : "标记为已完成"}>{task.status === "1" && <Check size={15}/>}</button>
                <div className="task-copy">
                  {editingId === task.id ? <input className="edit-input" value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(task.id)} /> : <><strong>{task.content}</strong>{task.description && <span>{task.description}</span>}</>}
                </div>
                <div className="task-tools">
                  {editingId === task.id ? <button onClick={() => saveEdit(task.id)} aria-label="保存"><Save size={16}/></button> : <button onClick={() => { setEditingId(task.id); setEditText(task.content); }} aria-label="编辑"><Edit3 size={16}/></button>}
                  <button onClick={() => deleteTask(task.id)} aria-label="删除"><Trash2 size={16}/></button>
                </div>
              </article>
            ))}
          </div>
          <div className="task-footer"><span>{tasks.length ? `已完成 ${completed} 项 · 还有 ${tasks.length - completed} 项待完成` : "专注，从清晰的目标开始"}</span>{tasks.length > 0 && <strong>{Math.round(completed / tasks.length * 100)}%</strong>}</div>
        </section>

        <section className="panel checkin-panel" id="checkin">
          <div className="section-head"><div><span className="section-kicker"><CalendarCheck size={15}/>每日打卡</span><h2>记录今天的努力</h2></div><span className="streak"><Flame size={15}/>连续 {getStreak(clocks)} 天</span></div>
          <div className={`checkin-hero ${checkedToday ? "checked" : ""}`}>
            <div className="date-card"><span>{weekLabel[today.getDay()]}</span><strong>{today.getDate()}</strong><small>{today.getFullYear()}.{String(today.getMonth() + 1).padStart(2, "0")}</small></div>
            <div><span>今日累计专注</span><strong>{todayMinutes}<small> 分钟</small></strong><p>{checkedToday ? "今日打卡已完成，继续保持 ✨" : todayMinutes ? "每一段专注，都值得被记录" : "完成一次专注后再来打卡吧"}</p></div>
          </div>
          <button className="checkin-button" disabled={checkedToday} onClick={clockIn}>{checkedToday ? <Check size={20}/> : <CalendarCheck size={20}/>} {checkedToday ? "今日已打卡" : "完成今日打卡"}</button>
          <div className="recent-title"><span>近期记录</span><small>最近 7 天</small></div>
          <div className="week-checks">{Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = dateKey(d), active = clocks.some(c => c.date === key); return <div key={key} className={active ? "active" : ""}><span>{weekLabel[d.getDay()]}</span><i>{active ? <Check size={14}/> : d.getDate()}</i></div>; })}</div>
        </section>
      </section>

      <section className="stats-section" id="stats">
        <div className="stats-copy"><span className="section-kicker"><BarChart3 size={15}/>学习数据</span><h2>看见积累的力量</h2><p>持续记录，让每一份努力都有迹可循。</p>
          <div className="summary-list"><div><span><Clock3 size={17}/>本周期专注</span><strong>{total}<small> 分钟</small></strong></div><div><span><CirclePlay size={17}/>日均专注</span><strong>{Math.round(total / range)}<small> 分钟</small></strong></div><div><span><CirclePause size={17}/>最佳状态</span><strong>{Math.max(...stats.map(s => s.value))}<small> 分钟</small></strong></div></div>
        </div>
        <div className="chart-card">
          <div className="chart-head"><div><strong>专注时长趋势</strong><span>{range === 7 ? "近一周" : "近 30 天"}学习投入</span></div><div className="range-tabs"><button className={range === 7 ? "active" : ""} onClick={() => setRange(7)}>近 7 天</button><button className={range === 30 ? "active" : ""} onClick={() => setRange(30)}>近 30 天</button></div></div>
          <div className="chart" ref={chartRef}/>
        </div>
      </section>

      <footer><a className="brand" href="#focus"><span className="brand-mark"><Leaf size={18}/></span><span>青时</span></a><p>专注当下，静待花开。</p><span>数据仅保存在你的设备中 · 安心使用</span></footer>
    </main>
  );
}

function getStreak(clocks: ClockRecord[]) {
  let streak = 0; const days = new Set(clocks.map(c => c.date)); const date = new Date();
  if (!days.has(dateKey(date))) date.setDate(date.getDate() - 1);
  while (days.has(dateKey(date))) { streak++; date.setDate(date.getDate() - 1); }
  return streak;
}
