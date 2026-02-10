import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { loadTasks, saveTasks } from './db';
import { useI18n } from './i18n.js';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar as CalendarIcon,
  Home,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  MoreVertical,
  Edit2,
  CheckCircle,
  Trash2,
  Upload,
  Download,
  Archive,
  Play,
  Globe,
  RefreshCw
} from 'lucide-react';

// Helper to format Date objects for datetime-local inputs
const toDatetimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const z = d.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(d.getTime() - z);
  return localDate.toISOString().slice(0, 16);
};

const App = () => {
  const { t, locale, setLocale, dateLocale } = useI18n();

  // Locale-aware date formatting
  const formatDate = (date) => {
    return new Intl.DateTimeFormat(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const shortDate = (d) => d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });

  const monthNames = [
    t('january'), t('february'), t('march'), t('april'),
    t('may'), t('june'), t('july'), t('august'),
    t('september'), t('october'), t('november'), t('december')
  ];

  const dayNames = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

  // --- State ---
  const [tasks, setTasks] = useState([]);
  const [dbReady, setDbReady] = useState(false);

  const EXAMPLE_TAG = '__example__';

  // Refresh: reload tasks from DB and navigate to home
  const refreshTasks = useCallback(() => {
    loadTasks().then(stored => {
      if (stored.length > 0) {
        setTasks(stored);
      }
      setCurrentScreen('home');
    });
  }, []);

  // Load tasks from IndexedDB on mount; seed examples on first use
  useEffect(() => {
    loadTasks().then(stored => {
      if (stored.length > 0) {
        setTasks(stored);
      } else {
        const sample = [
          { id: crypto.randomUUID(), description: "Design Figma Mockups for Task App", start: new Date(Date.now() - 86400000), end: new Date(Date.now() + 86400000), priority: 0, status: 'in execution', createdAt: new Date(), tag: EXAMPLE_TAG },
          { id: crypto.randomUUID(), description: "Code Review - Backend Module", start: new Date(Date.now() - 3600000 * 5), end: null, priority: 1, status: 'start delayed', createdAt: new Date(), tag: EXAMPLE_TAG },
          { id: crypto.randomUUID(), description: "Database Migration", start: new Date(Date.now() - 3600000 * 2), end: null, priority: 0, status: 'start delayed', createdAt: new Date(), tag: EXAMPLE_TAG },
          { id: crypto.randomUUID(), description: "Client Meeting regarding Feedback", start: new Date(Date.now() + 86400000), end: null, priority: 0, status: 'created', createdAt: new Date(), tag: EXAMPLE_TAG },
        ];
        setTasks(sample);
        saveTasks(sample);
      }
      setDbReady(true);
      setCurrentScreen('home');
    });
  }, []);

  // Persist tasks to IndexedDB whenever they change (skip initial empty state)
  useEffect(() => {
    if (dbReady) saveTasks(tasks);
  }, [tasks, dbReady]);

  const [currentScreen, setCurrentScreen] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTaskMenu, setActiveTaskMenu] = useState(null); // { id, x, y } or null
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [calendarFilters, setCalendarFilters] = useState(new Set(['created', 'in execution', 'completed', 'abandoned']));
  const [showBackupSub, setShowBackupSub] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // --- Post-it style helper ---
  const postItColors = (status) => {
    if (status === 'in execution') return 'bg-green-50 border-l-green-500';
    if (status === 'created') return 'bg-indigo-50 border-l-indigo-400';
    if (status === 'start delayed') return 'bg-rose-50 border-l-rose-400';
    if (status === 'completed') return 'bg-gray-100 border-l-gray-400';
    if (status === 'abandoned') return 'bg-red-50 border-l-red-400';
    return 'bg-yellow-50 border-l-yellow-400';
  };

  const postItRotation = (id) => {
    const code = typeof id === 'string' ? (id.charCodeAt(0) || 0) : id;
    return code % 2 === 0 ? -1 : 1;
  };

  // --- Actions ---

  const updateTaskStatus = (id, newStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updates = { status: newStatus };
      if (newStatus === 'in execution' && t.status !== 'in execution') {
        updates.start = new Date();
      }
      return { ...t, ...updates };
    }));
    setActiveTaskMenu(null);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      setTasks([...tasks, { ...taskData, id: crypto.randomUUID(), createdAt: new Date() }]);
    }
    setEditingTask(null);
    setCurrentScreen('home');
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setCurrentScreen('edit');
    setActiveTaskMenu(null);
  };

  // --- Sorting & Weighted Logic ---
  const getTasksByStatus = (statusGroup) => {
    const now = new Date();

    let filtered = tasks.filter(task => {
      // Exclude finished tasks from Home screen
      if (task.status === 'completed' || task.status === 'abandoned') return false;

      if (statusGroup === 'in execution') return task.status === 'in execution';
      if (statusGroup === 'start delayed') {
        return new Date(task.start) < now && task.status !== 'in execution';
      }
      if (statusGroup === 'start in one day') {
        const d = new Date(task.start);
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return d >= now && d <= in24h && task.status !== 'in execution';
      }
      if (statusGroup === 'start after a day') {
        const d = new Date(task.start);
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        return d > in24h && task.status !== 'in execution';
      }
      return false;
    });

    if (statusGroup === 'in execution') {
      return filtered.map(task => {
        let weight = 0;
        const pWeight = task.priority === 0 ? 500 : 100;
        if (task.end) {
          const daysToFinish = Math.max(0, Math.ceil((new Date(task.end) - now) / 86400000));
          weight = pWeight * (daysToFinish + 1);
        } else {
          const daysPassed = Math.ceil((now - new Date(task.start)) / 86400000);
          weight = 50 + daysPassed;
        }
        return { ...task, calculatedWeight: weight };
      }).sort((a, b) => a.calculatedWeight - b.calculatedWeight);
    }

    return filtered.sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  // --- UI Components ---

  const openTaskMenu = (e, taskId) => {
    e.stopPropagation();
    if (activeTaskMenu?.id === taskId) { setActiveTaskMenu(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTaskMenu({ id: taskId, x: rect.right, y: rect.bottom + 4 });
  };

  const TaskContextMenu = () => {
    const menuRef = useRef(null);
    const task = tasks.find(t => t.id === activeTaskMenu?.id);

    useEffect(() => {
      if (!menuRef.current || !activeTaskMenu) return;
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      // Clamp so menu stays within viewport
      if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 8}px`;
      if (rect.bottom > window.innerHeight) menu.style.top = `${activeTaskMenu.y - rect.height - 36}px`;
    });

    if (!activeTaskMenu || !task) return null;

    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[200]" onClick={() => setActiveTaskMenu(null)}>
        <div
          ref={menuRef}
          className="fixed w-32 bg-white rounded-lg shadow-xl border py-1 text-xs"
          style={{ top: activeTaskMenu.y, left: activeTaskMenu.x - 128 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleEditClick(task)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
          >
            <Edit2 size={12} /> {t('edit')}
          </button>
          {task.status !== 'in execution' && task.status !== 'completed' && task.status !== 'abandoned' && (
            <button
              onClick={() => updateTaskStatus(task.id, 'in execution')}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-blue-600"
            >
              <Play size={12} /> {t('start')}
            </button>
          )}
          <button
            onClick={() => updateTaskStatus(task.id, 'completed')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-green-600"
          >
            <CheckCircle size={12} /> {t('finish')}
          </button>
          <button
            onClick={() => updateTaskStatus(task.id, 'abandoned')}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-red-600"
          >
            <Trash2 size={12} /> {t('abandon')}
          </button>
          <button
            onClick={() => { setTasks(prev => prev.filter(t => t.id !== task.id)); setActiveTaskMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-700 border-t"
          >
            <X size={12} /> {t('delete')}
          </button>
        </div>
      </div>,
      document.body
    );
  };

  const Header = () => (
    <div className="bg-white border-b sticky top-0 z-10 p-4">
      <div className="flex items-center h-12 relative">
        <div className="flex-1 h-12 relative flex items-center">
          {/* Arrow shaft */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-indigo-100 rounded-l-md flex items-center px-4"
               style={{ width: 'calc(100% - 20px)', height: '60%' }}>
            <span className="text-indigo-800 font-black italic tracking-widest text-sm uppercase">
              {t('motto')}
            </span>
          </div>
          {/* Arrow head */}
          <div className="absolute right-0 top-0 h-full"
               style={{ width: '40px', clipPath: 'polygon(0% 0%, 0% 100%, 100% 50%)', backgroundColor: '#e0e7ff' }} />
        </div>
      </div>
    </div>
  );

  const handleExportJson = () => {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `no-stress-todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!Array.isArray(imported)) throw new Error('Invalid format');
          const restored = imported.map(t => ({
            ...t,
            id: t.id || crypto.randomUUID(),
            start: new Date(t.start),
            end: t.end ? new Date(t.end) : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
          }));
          setTasks(prev => {
            const merged = [...prev];
            for (const incoming of restored) {
              const idx = merged.findIndex(t => t.id === incoming.id);
              if (idx !== -1) merged[idx] = incoming;
              else merged.push(incoming);
            }
            return merged;
          });
          setShowMenu(false);
          setShowBackupSub(false);
        } catch {
          alert(t('invalidBackup'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const SideMenu = () => (
    <div className={`fixed inset-0 z-[100] transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => { setShowMenu(false); setShowBackupSub(false); }} />
      <div className={`absolute right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">{t('menu')}</h2>
            <X onClick={() => { setShowMenu(false); setShowBackupSub(false); }} className="cursor-pointer" />
          </div>
          <nav className="space-y-1">
            {/* Language switcher */}
            <button
              className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded-lg text-left"
              onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
            >
              <span className="flex items-center gap-3">
                <Globe size={20} className="text-blue-500" /> {t('language')}
              </span>
              <span className="text-sm text-gray-500">{locale === 'en' ? '中文' : 'English'}</span>
            </button>
            <button
              className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded-lg text-left"
              onClick={() => setShowBackupSub(!showBackupSub)}
            >
              <span className="flex items-center gap-3">
                <Archive size={20} className="text-indigo-500" /> {t('backup')}
              </span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${showBackupSub ? 'rotate-180' : ''}`} />
            </button>
            {showBackupSub && (
              <div className="ml-8 space-y-1">
                <button
                  className="flex items-center gap-3 w-full p-2.5 hover:bg-gray-50 rounded-lg text-left text-sm text-gray-700"
                  onClick={handleExportJson}
                >
                  <Download size={16} className="text-purple-500" /> {t('exportJson')}
                </button>
                <button
                  className="flex items-center gap-3 w-full p-2.5 hover:bg-gray-50 rounded-lg text-left text-sm text-gray-700"
                  onClick={handleImportJson}
                >
                  <Upload size={16} className="text-blue-500" /> {t('importJson')}
                </button>
              </div>
            )}
            {tasks.some(t => t.tag === EXAMPLE_TAG) && (
              <button
                className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg text-left text-red-500"
                onClick={() => { setTasks(prev => prev.filter(t => t.tag !== EXAMPLE_TAG)); setShowMenu(false); setShowBackupSub(false); }}
              >
                <Trash2 size={20} /> {t('removeExamples')}
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );

  const HomeScreen = () => {
    const now = new Date();
    const inExecution = getTasksByStatus('in execution');
    const delayed = getTasksByStatus('start delayed');
    const inOneDay = getTasksByStatus('start in one day');
    const afterADay = getTasksByStatus('start after a day');

    return (
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-24" onClick={() => { setActiveTaskMenu(null); setSelectedTask(null); }}>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-light text-gray-500 uppercase tracking-widest">{formatDate(new Date())}</h1>
        </div>

        <div className="px-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border p-4 relative">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {t('inExecution')}
            </h3>
            <div className="flex items-center gap-3 overflow-x-auto pb-3 thin-scrollbar" style={{ direction: 'rtl' }}>
              {inExecution.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-8 text-center w-full">{t('noActiveTasks')}</p>
              ) : (
                inExecution.map(task => {
                  const isUrgent = task.priority === 0;
                  const depth = Math.min(1, task.calculatedWeight / 2000 + 0.3);
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedTask(selectedTask === task.id ? null : task.id); }}
                      style={{ direction: 'ltr', opacity: selectedTask === task.id ? 1 : depth, transform: `rotate(${postItRotation(task.id)}deg)` }}
                      className={`flex-shrink-0 w-[140px] p-3 rounded-sm border-l-4 shadow-md relative cursor-pointer transition-all ${postItColors(task.status)} ${selectedTask === task.id ? 'ring-2 ring-indigo-400 ring-offset-1 scale-105' : ''}`}
                    >
                      <button
                        onClick={(e) => openTaskMenu(e, task.id)}
                        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700"
                      >
                        <MoreVertical size={14} />
                      </button>
                      <p className="text-xs font-semibold line-clamp-3 h-12 leading-snug pr-4 text-gray-800">{task.description}</p>
                      <div className="mt-2 flex items-end justify-between">
                        <div className="text-[9px] text-gray-400 font-mono leading-tight">
                          <div>{new Date(task.start).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</div>
                          <div>{new Date(task.start).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${isUrgent ? 'bg-rose-200/60 text-rose-600' : 'bg-white/50 text-gray-500'}`}>
                          {isUrgent ? t('urgent') : t('regular')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Section label={t('startDelayed')} tasks={delayed} color="text-rose-500" bgColor="bg-rose-50" />
          <Section label={t('startInOneDay')} tasks={inOneDay} color="text-blue-500" bgColor="bg-blue-50" />
          <Section label={t('startAfterADay')} tasks={afterADay} color="text-purple-500" bgColor="bg-purple-50" />
        </div>
      </div>
    );
  };

  const Section = ({ label, tasks, color, bgColor }) => (
    <div className={`rounded-xl border border-transparent p-4 ${bgColor} transition-all`}>
      <h3 className={`text-xs font-bold uppercase mb-3 tracking-wide ${color}`}>{label}</h3>
      <div className="flex gap-3 overflow-x-auto thin-scrollbar pb-2 min-h-[40px]" style={{ direction: 'rtl' }}>
        {tasks.length === 0 ? (
          <p className="text-gray-400 text-[10px] italic">{t('noTasks')}</p>
        ) : (
          tasks.map(tk => (
            <div
              key={tk.id}
              onClick={(e) => { e.stopPropagation(); setSelectedTask(selectedTask === tk.id ? null : tk.id); }}
              style={{ direction: 'ltr', transform: `rotate(${postItRotation(tk.id)}deg)` }}
              className={`flex-shrink-0 min-w-[140px] max-w-[180px] p-3 rounded-sm border-l-4 shadow-md relative cursor-pointer transition-all ${postItColors(tk.status)} ${selectedTask === tk.id ? 'ring-2 ring-indigo-400 ring-offset-1 scale-105' : ''}`}
            >
              <button
                onClick={(e) => openTaskMenu(e, tk.id)}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700"
              >
                <MoreVertical size={14} />
              </button>

              <p className="text-xs font-semibold line-clamp-2 leading-snug pr-4 text-gray-800">{tk.description}</p>
              <div className="flex justify-between items-end mt-2">
                <div className="text-[9px] text-gray-400 font-mono leading-tight">
                  <div>{new Date(tk.start).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</div>
                  <div>{new Date(tk.start).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${tk.priority === 0 ? 'bg-rose-200/60 text-rose-600' : 'bg-white/50 text-gray-500'}`}>
                  {tk.priority === 0 ? t('urgent') : t('regular')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const TaskFormScreen = () => {
    const [formData, setFormData] = useState({
      description: editingTask?.description || '',
      start: toDatetimeLocal(editingTask?.start || new Date()),
      end: toDatetimeLocal(editingTask?.end) || '',
      priority: editingTask?.priority ?? 1,
      status: editingTask?.status || 'created'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleSaveTask({
        ...formData,
        start: new Date(formData.start),
        end: formData.end ? new Date(formData.end) : null
      });
    };

    return (
      <div className="px-6 py-8 bg-white h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <button onClick={() => { setEditingTask(null); setCurrentScreen('home'); }}>
            <ChevronLeft size={24} className="text-gray-500" />
          </button>
          <h2 className="text-xl font-bold">{editingTask ? t('editTask') : t('newTask')}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">{t('description')}</label>
            <textarea
              required
              maxLength={500}
              placeholder={t('descPlaceholder')}
              className="w-full border border-gray-200 rounded-2xl p-4 h-28 outline-none focus:border-gray-400 resize-none text-gray-800"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Date/Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">{t('startLabel')}</label>
              <input
                required
                type="datetime-local"
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm outline-none focus:border-gray-400"
                value={formData.start}
                onChange={e => setFormData({...formData, start: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">{t('expectedEnd')}</label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm outline-none focus:border-gray-400"
                value={formData.end}
                onChange={e => setFormData({...formData, end: e.target.value})}
              />
            </div>
          </div>

          {/* Priority buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, priority: 0})}
              className={`flex-1 py-3.5 rounded-full text-sm font-medium transition-all ${
                formData.priority === 0
                  ? 'bg-rose-400 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t('urgent')}
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, priority: 1})}
              className={`flex-1 py-3.5 rounded-full text-sm font-medium transition-all ${
                formData.priority === 1
                  ? 'bg-green-400 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t('regular')}
            </button>
          </div>

          {/* Status (only when editing) */}
          {editingTask && (
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">{t('statusLabel')}</label>
              <select
                className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm outline-none focus:border-gray-400 bg-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="created">{t('created')}</option>
                <option value="in execution">{t('inExecution')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="abandoned">{t('abandoned')}</option>
              </select>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-4 rounded-full font-medium text-base"
          >
            {editingTask ? t('saveChanges') : t('createTask')}
          </button>
        </form>
      </div>
    );
  };

  const CalendarScreen = () => {
    const now = new Date();

    // Month navigation
    const goToPrevMonth = () => {
      if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
      else setCalendarMonth(calendarMonth - 1);
    };
    const goToNextMonth = () => {
      if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
      else setCalendarMonth(calendarMonth + 1);
    };

    // Toggle a filter checkbox
    const toggleFilter = (status) => {
      setCalendarFilters(prev => {
        const next = new Set(prev);
        if (next.has(status)) next.delete(status);
        else next.add(status);
        return next;
      });
    };

    // Calendar grid calculations
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    // Status color mapping
    const statusDotColor = (status) => {
      if (status === 'created' || status === 'start delayed') return 'bg-indigo-400';
      if (status === 'in execution') return 'bg-green-500';
      if (status === 'completed') return 'bg-gray-400';
      if (status === 'abandoned') return 'bg-red-400';
      return 'bg-gray-300';
    };

    const postItStyle = (status) => {
      if (status === 'created' || status === 'start delayed') return 'bg-indigo-50 border-l-indigo-400';
      if (status === 'in execution') return 'bg-green-50 border-l-green-500';
      if (status === 'completed') return 'bg-gray-100 border-l-gray-400';
      if (status === 'abandoned') return 'bg-red-50 border-l-red-400';
      return 'bg-yellow-50 border-l-yellow-400';
    };

    // Get filtered tasks that have dots on a given day
    const getTasksForDay = (day) => {
      return tasks.filter(tk => {
        const d = new Date(tk.start);
        return d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear
          && calendarFilters.has(tk.status === 'start delayed' ? 'created' : tk.status);
      });
    };

    const filterOptions = [
      { key: 'created', label: t('created'), color: 'bg-indigo-400' },
      { key: 'in execution', label: t('inExecution'), color: 'bg-green-500' },
      { key: 'completed', label: t('completed'), color: 'bg-gray-400' },
      { key: 'abandoned', label: t('abandoned'), color: 'bg-red-400' },
    ];

    const isToday = (day) =>
      day === now.getDate() && calendarMonth === now.getMonth() && calendarYear === now.getFullYear();

    return (
      <div className="h-full bg-white overflow-y-auto pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => setCurrentScreen('home')}>
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
          <h2 className="text-lg font-bold">{t('calendarView')}</h2>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 mb-3">
          <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {monthNames[calendarMonth]} {calendarYear}
          </span>
          <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Filter by Status - Checkboxes */}
        <div className="px-4 mb-4">
          <p className="text-xs text-gray-500 mb-1.5">{t('filterByStatus')}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {filterOptions.map(opt => (
              <label key={opt.key} className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={calendarFilters.has(opt.key)}
                  onChange={() => toggleFilter(opt.key)}
                  className="w-3.5 h-3.5 rounded accent-indigo-500"
                />
                <span className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                <span className="text-xs text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="px-2">
          {/* Day headers */}
          <div className="grid grid-cols-7">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells for offset */}
            {[...Array(firstDayOfMonth)].map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[72px]" />
            ))}

            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDay(day);
              const today = isToday(day);
              return (
                <div
                  key={day}
                  className={`min-h-[72px] border border-gray-100 rounded-lg m-0.5 p-1.5 flex flex-col
                    ${today ? 'bg-blue-50 border-blue-300' : ''}
                  `}
                >
                  <span className={`text-xs ${today ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                    {day}
                  </span>
                  {/* Task dots */}
                  {dayTasks.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayTasks.slice(0, 4).map(tk => (
                        <div key={tk.id} className={`w-2 h-2 rounded-full ${statusDotColor(tk.status)}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Task List - Post-it Notes */}
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {tasks
            .filter(tk => calendarFilters.has(tk.status === 'start delayed' ? 'created' : tk.status))
            .filter(tk => {
              const d = new Date(tk.start);
              return d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .map(tk => (
              <div
                key={tk.id}
                className={`relative p-3 rounded-sm border-l-4 shadow-md cursor-pointer transition-all ${postItStyle(tk.status)} ${selectedTask === tk.id ? 'ring-2 ring-indigo-400 ring-offset-1 scale-[1.02]' : ''}`}
                style={{ transform: `rotate(${postItRotation(tk.id)}deg)` }}
                onClick={() => setSelectedTask(selectedTask === tk.id ? null : tk.id)}
              >
                <button
                  onClick={(e) => openTaskMenu(e, tk.id)}
                  className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-700"
                >
                  <MoreVertical size={14} />
                </button>
                <p className={`text-xs font-semibold leading-snug pr-5 line-clamp-3 ${tk.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {tk.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] text-gray-400 font-mono">
                    {new Date(tk.start).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${tk.priority === 0 ? 'bg-rose-200/60 text-rose-600' : 'bg-white/50 text-gray-500'}`}>
                    {tk.priority === 0 ? t('urgent') : t('regular')}
                  </span>
                </div>
              </div>
            ))}
          {tasks.filter(tk =>
            calendarFilters.has(tk.status === 'start delayed' ? 'created' : tk.status) &&
            new Date(tk.start).getMonth() === calendarMonth &&
            new Date(tk.start).getFullYear() === calendarYear
          ).length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm col-span-2">{t('noTasksFound')}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white relative font-sans text-gray-900 shadow-2xl flex flex-col">
      <Header />
      <SideMenu />
      <TaskContextMenu />
      <div className="flex-1 overflow-hidden">
        {currentScreen === 'home' && <HomeScreen />}
        {(currentScreen === 'create' || currentScreen === 'edit') && <TaskFormScreen />}
        {currentScreen === 'calendar' && <CalendarScreen />}
      </div>
      {/* Bottom Navigation */}
      <div className="relative h-20 bg-white border-t flex-shrink-0">
        {/* Floating Add Button */}
        <button
          onClick={() => { setEditingTask(null); setCurrentScreen('create'); }}
          className="absolute left-1/2 -translate-x-1/2 -top-7 bg-indigo-500 text-white p-4 rounded-full shadow-lg active:scale-90 transition-transform z-10"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
        {/* Nav Items */}
        <div className="flex items-center h-full px-8">
          <div className="flex gap-8">
            <button onClick={() => setShowMenu(true)} className="flex flex-col items-center gap-1 text-gray-400">
              <Menu size={22} />
              <span className="text-[9px] font-black uppercase">{t('menu')}</span>
            </button>
            <button onClick={() => { setEditingTask(null); setCurrentScreen('home'); }} className={`flex flex-col items-center gap-1 ${currentScreen === 'home' ? 'text-black' : 'text-gray-400'}`}>
              <Home size={22} />
              <span className="text-[9px] font-black uppercase">{t('home')}</span>
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex gap-8">
            <button onClick={refreshTasks} className="flex flex-col items-center gap-1 text-gray-400">
              <RefreshCw size={22} />
              <span className="text-[9px] font-black uppercase">{t('refresh')}</span>
            </button>
            <button onClick={() => { setEditingTask(null); setCurrentScreen('calendar'); }} className={`flex flex-col items-center gap-1 ${currentScreen === 'calendar' ? 'text-black' : 'text-gray-400'}`}>
              <CalendarIcon size={22} />
              <span className="text-[9px] font-black uppercase">{t('schedule')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
