 "use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertCircle, ArrowDownToLine, ArrowUpFromLine, CalendarDays,
  Check, CheckCircle2, ChevronDown, Circle, Clock3, Filter, LayoutDashboard,
  ListTodo, MoreHorizontal, Pencil, Plus, Search, Sparkles, Target, Trash2,
  X, Zap
} from "lucide-react";

type Status = "Not Started" | "In Progress" | "On Hold" | "Completed";
type Priority = "Critical" | "High" | "Medium" | "Low";
type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  progress: number;
  updatedAt: string;
  activity: string[];
};

const STORAGE_KEY = "taskflow.tasks.v1";
const statusOptions: Status[] = ["Not Started", "In Progress", "On Hold", "Completed"];
const priorityOptions: Priority[] = ["Critical", "High", "Medium", "Low"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dateLabel(value: string) {
  if (!value) return "No date";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function isOverdue(task: Task) {
  return task.status !== "Completed" && !!task.dueDate && task.dueDate < todayISO();
}
function daysLeft(task: Task) {
  if (!task.dueDate) return null;
  const today = new Date(`${todayISO()}T00:00:00`).getTime();
  const due = new Date(`${task.dueDate}T00:00:00`).getTime();
  return Math.round((due - today) / 86400000);
}
function seedTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    { id: "sample-1", title: "Finalize project roadmap", description: "Align milestones, owners and delivery dependencies.", category: "Work", startDate: todayISO(), dueDate: todayISO(), priority: "High", status: "In Progress", progress: 65, updatedAt: now, activity: ["Task created", "Progress updated to 65%"] },
    { id: "sample-2", title: "Review Q4 priorities", description: "Review key deliverables and confirm next actions.", category: "Planning", startDate: todayISO(), dueDate: "", priority: "Medium", status: "Not Started", progress: 0, updatedAt: now, activity: ["Task created"] },
    { id: "sample-3", title: "Prepare stakeholder update", description: "Share a concise status summary and highlight key risks.", category: "Work", startDate: todayISO(), dueDate: "", priority: "Low", status: "Completed", progress: 100, updatedAt: now, activity: ["Task created", "Marked as completed"] }
  ];
}

const emptyForm = {
  title: "", description: "", category: "Work", startDate: todayISO(), dueDate: "",
  priority: "Medium" as Priority, status: "Not Started" as Status, progress: 0
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("due");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setTasks(saved ? JSON.parse(saved) as Task[] : seedTasks());
    } catch {
      setTasks(seedTasks());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.status === "Completed").length;
    const overdue = tasks.filter(isOverdue).length;
    const active = tasks.filter(t => t.status === "In Progress").length;
    const progress = tasks.length ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length) : 0;
    return { total: tasks.length, completed, overdue, active, progress };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = tasks.filter(t => {
      const matchesQuery = !q || [t.title, t.description, t.category].some(v => v.toLowerCase().includes(q));
      const matchesFilter =
        filter === "All" ? true :
        filter === "Overdue" ? isOverdue(t) :
        filter === "Upcoming" ? !!t.dueDate && !isOverdue(t) && t.status !== "Completed" :
        t.status === filter;
      return matchesQuery && matchesFilter;
    });
    return result.sort((a, b) => {
      if (sort === "priority") return priorityOptions.indexOf(a.priority) - priorityOptions.indexOf(b.priority);
      if (sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });
  }, [tasks, query, filter, sort]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function openNew() {
    setEditingId(null); setForm({ ...emptyForm, startDate: todayISO() }); setModalOpen(true);
  }
  function openEdit(task: Task) {
    setEditingId(task.id);
    setForm({ title: task.title, description: task.description, category: task.category, startDate: task.startDate, dueDate: task.dueDate, priority: task.priority, status: task.status, progress: task.progress });
    setModalOpen(true);
  }
  function saveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.startDate && form.dueDate && form.dueDate < form.startDate) {
      notify("Due date cannot be earlier than the start date."); return;
    }
    const now = new Date().toISOString();
    if (editingId) {
      setTasks(prev => prev.map(t => {
        if (t.id !== editingId) return t;
        const changes = [
          t.status !== form.status ? `Status changed to ${form.status}` : "",
          t.progress !== Number(form.progress) ? `Progress updated to ${form.progress}%` : "",
          t.dueDate !== form.dueDate ? `Due date changed to ${form.dueDate || "none"}` : ""
        ].filter(Boolean);
        return { ...t, ...form, progress: form.status === "Completed" ? 100 : Number(form.progress), updatedAt: now, activity: [...changes, ...t.activity].slice(0, 12) };
      }));
      notify("Task updated successfully.");
    } else {
      const task: Task = { ...form, id: crypto.randomUUID(), progress: form.status === "Completed" ? 100 : Number(form.progress), updatedAt: now, activity: ["Task created"] };
      setTasks(prev => [task, ...prev]);
      notify("New task added.");
    }
    setModalOpen(false);
  }
  function updateTask(id: string, patch: Partial<Task>, activity?: string) {
    const now = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch, updatedAt: now, activity: activity ? [activity, ...t.activity].slice(0, 12) : t.activity } : t));
  }
  function removeTask(id: string) {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    if (detailTask?.id === id) setDetailTask(null);
    notify("Task deleted.");
  }
  function exportTasks() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `taskflow-backup-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url); notify("Backup exported.");
  }
  function importTasks(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed) || parsed.some(t => !t.id || !t.title)) throw new Error("Invalid file");
        if (window.confirm(`Import ${parsed.length} tasks? This will replace your current task list.`)) {
          setTasks(parsed); notify("Tasks imported successfully.");
        }
      } catch { notify("Could not import. Please choose a valid TaskFlow JSON backup."); }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Zap size={19} fill="currentColor" /></div><span>taskflow</span></div>
        <div className="workspace-label">WORKSPACE</div>
        <button className={`nav-item ${filter === "All" ? "active" : ""}`} onClick={() => setFilter("All")}><LayoutDashboard size={18}/> Overview</button>
        <button className={`nav-item ${filter === "In Progress" ? "active" : ""}`} onClick={() => setFilter("In Progress")}><Activity size={18}/> In progress</button>
        <button className={`nav-item ${filter === "Upcoming" ? "active" : ""}`} onClick={() => setFilter("Upcoming")}><CalendarDays size={18}/> Upcoming</button>
        <button className={`nav-item ${filter === "Completed" ? "active" : ""}`} onClick={() => setFilter("Completed")}><CheckCircle2 size={18}/> Completed</button>
        <button className={`nav-item ${filter === "Overdue" ? "active" : ""}`} onClick={() => setFilter("Overdue")}><AlertCircle size={18}/> Overdue {stats.overdue > 0 && <span className="nav-count">{stats.overdue}</span>}</button>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><Sparkles size={17}/><strong>Stay on top of it</strong><p>Small steps every day add up to big progress.</p></div>
          <div className="profile"><div className="avatar">Y</div><div><strong>My workspace</strong><span>Personal tasks</span></div><MoreHorizontal size={18}/></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{filter === "All" ? "Overview" : filter}</strong></div>
          <div className="top-actions">
            <button className="icon-button" title="Import backup" onClick={() => importRef.current?.click()}><ArrowUpFromLine size={17}/></button>
            <button className="icon-button" title="Export backup" onClick={exportTasks}><ArrowDownToLine size={17}/></button>
            <button className="primary-button" onClick={openNew}><Plus size={17}/> New task</button>
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={e => importTasks(e.target.files?.[0])}/>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><div className="eyebrow">YOUR PERSONAL COMMAND CENTRE</div><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"} <span>👋</span></h1><p>Make today count. Here's where things stand.</p></div>
            <div className="today-chip"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</div>
          </div>

          <div className="stats-grid">
            <StatCard label="Total tasks" value={stats.total} note="Across your workspace" icon={<ListTodo size={19}/>} tone="purple"/>
            <StatCard label="In progress" value={stats.active} note="Currently being worked on" icon={<Activity size={19}/>} tone="blue"/>
            <StatCard label="Completed" value={stats.completed} note={`${stats.total ? Math.round(stats.completed / stats.total * 100) : 0}% of all tasks`} icon={<CheckCircle2 size={19}/>} tone="green"/>
            <StatCard label="Overdue" value={stats.overdue} note="Need your attention" icon={<AlertCircle size={19}/>} tone="orange"/>
          </div>

          <section className="progress-panel">
            <div className="progress-heading"><div><div className="panel-kicker">WORKSPACE PROGRESS</div><h2>You're making progress</h2><p>Average completion across all tasks</p></div><div className="progress-number">{stats.progress}<small>%</small></div></div>
            <div className="big-progress"><div style={{ width: `${stats.progress}%` }}/></div>
            <div className="progress-foot"><span>{stats.completed} completed out of {stats.total} tasks</span><span>{stats.total - stats.completed} left to go</span></div>
          </section>

          <div className="section-heading"><div><h2>{filter === "All" ? "Your tasks" : filter + " tasks"}</h2><p>Keep track of what needs to get done.</p></div><button className="text-button" onClick={openNew}><Plus size={16}/> Add task</button></div>
          <div className="toolbar">
            <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks or categories..."/>{query && <button onClick={() => setQuery("")}><X size={14}/></button>}</div>
            <div className="toolbar-right"><div className="filter-select"><Filter size={15}/><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Not Started</option><option>In Progress</option><option>On Hold</option><option>Completed</option><option>Upcoming</option><option>Overdue</option></select><ChevronDown size={14}/></div><select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}><option value="due">Sort: Due date</option><option value="priority">Sort: Priority</option><option value="updated">Sort: Recently updated</option></select></div>
          </div>

          <div className="task-list">
            {!ready ? <div className="empty-state">Loading your workspace...</div> :
              filteredTasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><Target size={24}/></div><strong>No tasks found</strong><p>Try changing your search or add a new task.</p><button className="primary-button" onClick={openNew}><Plus size={16}/> Create a task</button></div> :
              filteredTasks.map(task => <TaskRow key={task.id} task={task} onOpen={() => setDetailTask(task)} onEdit={() => openEdit(task)} onDelete={() => removeTask(task.id)} onStatus={status => updateTask(task.id, { status, progress: status === "Completed" ? 100 : task.progress }, `Status changed to ${status}`)}/>)
            }
          </div>
          <footer className="footer-note"><span>TaskFlow</span> · Your work, in flow. <span className="local-note">Saved automatically on this device</span></footer>
        </div>
      </section>

      {modalOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <form className="modal" onSubmit={saveTask}>
          <div className="modal-head"><div><div className="eyebrow">{editingId ? "UPDATE YOUR TASK" : "MAKE IT HAPPEN"}</div><h2>{editingId ? "Edit task" : "Create a new task"}</h2></div><button type="button" className="icon-button" onClick={() => setModalOpen(false)}><X size={18}/></button></div>
          <label>Task name <span>*</span><input autoFocus required maxLength={100} placeholder="e.g. Complete project proposal" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
          <label>Description<textarea rows={3} placeholder="Add a few details about this task..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
          <div className="form-grid">
            <label>Category<input placeholder="e.g. Work, Personal" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}/></label>
            <label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>{priorityOptions.map(p => <option key={p}>{p}</option>)}</select></label>
            <label>Start date<input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}/></label>
            <label>Due date<input type="date" min={form.startDate || undefined} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}/></label>
          </div>
          <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status, progress: e.target.value === "Completed" ? 100 : form.progress })}>{statusOptions.map(s => <option key={s}>{s}</option>)}</select></label>
          <label className="progress-label">Progress <strong>{form.status === "Completed" ? 100 : form.progress}%</strong><input type="range" min="0" max="100" step="5" value={form.status === "Completed" ? 100 : form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value), status: Number(e.target.value) === 100 ? "Completed" : Number(e.target.value) > 0 ? "In Progress" : "Not Started" })}/></label>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={16}/>{editingId ? "Save changes" : "Create task"}</button></div>
        </form>
      </div>}

      {detailTask && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setDetailTask(null); }}>
        <div className="modal detail-modal">
          <div className="modal-head"><div><div className="eyebrow">TASK DETAILS</div><h2>{detailTask.title}</h2></div><button className="icon-button" onClick={() => setDetailTask(null)}><X size={18}/></button></div>
          <div className="detail-meta"><StatusPill status={detailTask.status}/><PriorityPill priority={detailTask.priority}/><span className="category-tag">{detailTask.category || "General"}</span></div>
          <p className="detail-description">{detailTask.description || "No description added."}</p>
          <div className="detail-dates"><div><span>START DATE</span><strong>{dateLabel(detailTask.startDate)}</strong></div><div><span>DUE DATE</span><strong className={isOverdue(detailTask) ? "overdue-text" : ""}>{dateLabel(detailTask.dueDate)}</strong></div><div><span>LAST UPDATED</span><strong>{new Date(detailTask.updatedAt).toLocaleDateString("en-IN")}</strong></div></div>
          <div className="detail-progress-head"><strong>Progress</strong><strong>{detailTask.progress}%</strong></div><div className="task-progress"><div style={{ width: `${detailTask.progress}%` }}/></div>
          <div className="activity-title"><Activity size={16}/> Activity history</div>
          <div className="activity-list">{detailTask.activity.map((item, i) => <div className="activity-item" key={`${item}-${i}`}><span className="activity-dot"/><div><p>{item}</p><small>{i === 0 ? "Most recent update" : "Previous update"}</small></div></div>)}</div>
          <div className="modal-actions"><button className="secondary-button danger-button" onClick={() => removeTask(detailTask.id)}><Trash2 size={15}/> Delete</button><button className="primary-button" onClick={() => { setDetailTask(null); openEdit(detailTask); }}><Pencil size={15}/> Edit task</button></div>
        </div>
      </div>}
      {toast && <div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    </main>
  );
}

function StatCard({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: React.ReactNode; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}
function StatusPill({ status }: { status: Status }) {
  const cls = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`status-pill ${cls}`}><span/>{status}</span>;
}
function PriorityPill({ priority }: { priority: Priority }) {
  return <span className={`priority-pill ${priority.toLowerCase()}`}><span/> {priority}</span>;
}
function TaskRow({ task, onOpen, onEdit, onDelete, onStatus }: { task: Task; onOpen: () => void; onEdit: () => void; onDelete: () => void; onStatus: (s: Status) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const remaining = daysLeft(task);
  return <article className="task-row">
    <button className={`task-check ${task.status === "Completed" ? "checked" : ""}`} title="Mark completed" onClick={() => onStatus(task.status === "Completed" ? "In Progress" : "Completed")}>{task.status === "Completed" ? <Check size={15}/> : <Circle size={19}/>}</button>
    <div className="task-main" onClick={onOpen} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") onOpen(); }}>
      <div className="task-title-line"><h3 className={task.status === "Completed" ? "completed-title" : ""}>{task.title}</h3><PriorityPill priority={task.priority}/></div>
      <p>{task.description || "No description"}</p>
      <div className="task-meta"><span className="category-tag">{task.category || "General"}</span><span className="date-meta"><CalendarDays size={13}/>{task.dueDate ? dateLabel(task.dueDate) : "No due date"}</span>
        {isOverdue(task) ? <span className="deadline overdue"><AlertCircle size={12}/> Overdue</span> : remaining !== null && task.status !== "Completed" ? <span className={`deadline ${remaining <= 2 ? "soon" : ""}`}><Clock3 size={12}/>{remaining === 0 ? "Due today" : remaining === 1 ? "1 day left" : `${remaining} days left`}</span> : null}
      </div>
    </div>
    <div className="task-progress-wrap"><div className="task-progress-label"><span>Progress</span><strong>{task.progress}%</strong></div><div className="task-progress"><div style={{ width: `${task.progress}%` }}/></div></div>
    <div className="task-status-wrap"><button className="status-select" onClick={() => setStatusOpen(!statusOpen)}><StatusPill status={task.status}/><ChevronDown size={13}/></button>{statusOpen && <div className="dropdown-menu status-menu">{statusOptions.map(s => <button key={s} onClick={() => { onStatus(s); setStatusOpen(false); }}>{s}</button>)}</div>}</div>
    <div className="task-menu-wrap"><button className="icon-button small" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={18}/></button>{menuOpen && <div className="dropdown-menu"><button onClick={() => { onEdit(); setMenuOpen(false); }}><Pencil size={14}/> Edit</button><button className="menu-danger" onClick={() => { onDelete(); setMenuOpen(false); }}><Trash2 size={14}/> Delete</button></div>}</div>
  </article>;
}
