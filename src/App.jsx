import React, { useState, useMemo } from 'react';
import { 
  Menu, 
  ChevronLeft, 
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
  Download
} from 'lucide-react';

// Utility for formatting dates
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date);
};

// Helper to format Date objects for datetime-local inputs
const toDatetimeLocal = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const z = d.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(d.getTime() - z);
  return localDate.toISOString().slice(0, 16);
};

const App = () => {
  // --- State ---
  const [tasks, setTasks] = useState([
    {
      id: 1,
      description: "Design Figma Mockups for Task App",
      start: new Date(new Date().getTime() - 86400000), 
      end: new Date(new Date().getTime() + 86400000), 
      priority: 0, 
      status: 'in execution',
      createdAt: new Date()
    },
    {
      id: 2,
      description: "Code Review - Backend Module",
      start: new Date(new Date().getTime() - 3600000 * 5),
      end: null,
      priority: 1,
      status: 'start delayed',
      createdAt: new Date()
    },
    {
      id: 4,
      description: "Database Migration",
      start: new Date(new Date().getTime() - 3600000 * 2),
      priority: 0,
      status: 'start delayed',
      createdAt: new Date()
    },
    {
      id: 3,
      description: "Client Meeting regarding Feedback",
      start: new Date(new Date().getTime() + 86400000),
      priority: 0,
      status: 'created',
      createdAt: new Date()
    }
  ]);

  const [currentScreen, setCurrentScreen] = useState('home');
  const [showMenu, setShowMenu] = useState(false);
  const [activeTaskMenu, setActiveTaskMenu] = useState(null); 
  const [editingTask, setEditingTask] = useState(null); 
  const [calendarFilter, setCalendarFilter] = useState('all');

  // --- Actions ---
  
  const updateTaskStatus = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    setActiveTaskMenu(null);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      setTasks([...tasks, { ...taskData, id: Date.now(), createdAt: new Date() }]);
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
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const dayAfter = new Date(now); dayAfter.setDate(now.getDate() + 2);

    let filtered = tasks.filter(task => {
      // Exclude finished tasks from Home screen
      if (task.status === 'completed' || task.status === 'abandoned') return false;
      
      if (statusGroup === 'in execution') return task.status === 'in execution';
      if (statusGroup === 'start delayed') {
        return new Date(task.start) < now && task.status !== 'in execution';
      }
      if (statusGroup === 'start next day') {
        const d = new Date(task.start);
        return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth();
      }
      if (statusGroup === 'start in two days') {
        const d = new Date(task.start);
        return d.getDate() === dayAfter.getDate() && d.getMonth() === dayAfter.getMonth();
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

  const TaskContextMenu = ({ task }) => {
    if (activeTaskMenu !== task.id) return null;

    return (
      <div className="absolute top-8 right-0 w-32 bg-white rounded-lg shadow-xl border z-50 py-1 text-xs overflow-hidden">
        <button 
          onClick={(e) => { e.stopPropagation(); handleEditClick(task); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-700"
        >
          <Edit2 size={12} /> Edit
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'completed'); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-green-600"
        >
          <CheckCircle size={12} /> Finish
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'abandoned'); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-red-600"
        >
          <Trash2 size={12} /> Abandon
        </button>
      </div>
    );
  };

  const Header = () => (
    <div className="bg-white border-b sticky top-0 z-10 p-4">
      <div className="flex items-center justify-between h-12 relative">
        <div className="flex-1 mr-4 h-10 relative flex items-center">
          <div className="absolute inset-0 bg-indigo-100 rounded-l-md flex items-center px-4" 
               style={{ clipPath: 'polygon(0% 0%, 90% 0%, 100% 50%, 90% 100%, 0% 100%)' }}>
            <span className="text-indigo-800 font-black italic tracking-widest text-sm uppercase flex items-center gap-2">
              Time Flies <ArrowRight size={16} />
            </span>
          </div>
        </div>
        <button onClick={() => setShowMenu(true)} className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0">
          <Menu size={28} />
        </button>
      </div>
    </div>
  );

  const SideMenu = () => (
    <div className={`fixed inset-0 z-[100] transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
      <div className={`absolute right-0 top-0 h-full w-64 bg-white shadow-xl transform transition-transform ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold">Menu</h2>
            <X onClick={() => setShowMenu(false)} className="cursor-pointer" />
          </div>
          <nav className="space-y-4">
            <button className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg text-left" onClick={() => {setCurrentScreen('calendar'); setShowMenu(false);}}>
              <CalendarIcon size={20} className="text-indigo-500" /> Full Calendar
            </button>
            <button className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg text-left">
              <Upload size={20} className="text-blue-500" /> Import
            </button>
            <button className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-lg text-left">
              <Download size={20} className="text-purple-500" /> Export
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  const HomeScreen = () => {
    const inExecution = getTasksByStatus('in execution');
    const delayed = getTasksByStatus('start delayed');
    const nextDay = getTasksByStatus('start next day');
    const inTwoDays = getTasksByStatus('start in two days');

    return (
      <div className="flex flex-col h-full bg-gray-50 overflow-y-auto pb-24" onClick={() => setActiveTaskMenu(null)}>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-light text-gray-500 uppercase tracking-widest">{formatDate(new Date())}</h1>
        </div>

        <div className="px-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border p-4 min-h-[220px] relative">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              In Execution
            </h3>
            <div className="flex items-center gap-4 overflow-x-auto pb-6 no-scrollbar justify-end">
              {inExecution.length === 0 ? (
                <p className="text-gray-400 text-sm italic py-8 text-center w-full">No active tasks</p>
              ) : (
                inExecution.map(task => {
                  const isUrgent = task.priority === 0;
                  const depth = Math.min(1, task.calculatedWeight / 2000 + 0.3);
                  return (
                    <div
                      key={task.id}
                      style={{ opacity: depth }}
                      className={`flex-shrink-0 w-[140px] p-4 rounded-xl border-l-4 transition-all shadow-sm relative group
                        ${isUrgent ? 'bg-rose-50 border-rose-400 text-rose-600' : 'bg-green-50 border-green-400 text-green-700'}
                      `}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id); }}
                        className="absolute top-2 right-1 p-1 opacity-40 hover:opacity-100"
                      >
                        <MoreVertical size={14} />
                      </button>
                      <TaskContextMenu task={task} />
                      <p className="text-xs font-bold line-clamp-3 h-12 leading-tight pr-2">{task.description}</p>
                      <div className="mt-4 flex items-center gap-1 text-[10px] opacity-70 font-bold uppercase">
                        <Clock size={10} />
                        <span>{isUrgent ? 'Priority High' : 'In Progress'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Section label="Start Delayed" tasks={delayed} color="text-rose-500" bgColor="bg-rose-50" onMenuToggle={setActiveTaskMenu} activeMenu={activeTaskMenu} onUpdate={updateTaskStatus} onEdit={handleEditClick} />
          <Section label="Start Next Day" tasks={nextDay} color="text-blue-500" bgColor="bg-blue-50" onMenuToggle={setActiveTaskMenu} activeMenu={activeTaskMenu} onUpdate={updateTaskStatus} onEdit={handleEditClick} />
          <Section label="Start In Two Days" tasks={inTwoDays} color="text-purple-500" bgColor="bg-purple-50" onMenuToggle={setActiveTaskMenu} activeMenu={activeTaskMenu} onUpdate={updateTaskStatus} onEdit={handleEditClick} />
        </div>
      </div>
    );
  };

  const Section = ({ label, tasks, color, bgColor, onMenuToggle, activeMenu, onUpdate, onEdit }) => (
    <div className={`rounded-xl border border-transparent p-4 ${bgColor} transition-all`}>
      <h3 className={`text-xs font-bold uppercase mb-3 tracking-wide ${color}`}>{label}</h3>
      <div className="flex flex-row-reverse gap-2 overflow-x-auto no-scrollbar min-h-[40px] justify-start">
        {tasks.length === 0 ? (
          <p className="text-gray-400 text-[10px] italic">No tasks</p>
        ) : (
          tasks.map(t => (
            <div key={t.id} className="bg-white/90 p-3 rounded-lg border text-xs shadow-sm flex flex-col min-w-[150px] max-w-[200px] relative">
              <button 
                onClick={(e) => { e.stopPropagation(); onMenuToggle(activeMenu === t.id ? null : t.id); }}
                className="absolute top-2 right-1 p-1 opacity-40 hover:opacity-100"
              >
                <MoreVertical size={14} />
              </button>
              
              {activeMenu === t.id && (
                <div className="absolute top-8 right-0 w-28 bg-white rounded-lg shadow-xl border z-50 py-1 text-[10px] overflow-hidden">
                  <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50"><Edit2 size={10} /> Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); onUpdate(t.id, 'completed'); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-green-600"><CheckCircle size={10} /> Finish</button>
                  <button onClick={(e) => { e.stopPropagation(); onUpdate(t.id, 'abandoned'); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-red-600"><Trash2 size={10} /> Abandon</button>
                </div>
              )}

              <span className="font-medium line-clamp-1 pr-4 text-gray-800">{t.description}</span>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-[8px] px-2 py-0.5 rounded font-bold ${t.priority === 0 ? 'bg-rose-100 text-rose-500' : 'bg-gray-100 text-gray-500'}`}>
                  {t.priority === 0 ? 'URGENT' : 'REGULAR'}
                </span>
                <span className="text-[9px] text-gray-400 font-mono">
                  {new Date(t.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          <h2 className="text-xl font-bold">{editingTask ? 'Edit Task' : 'New Task'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Description</label>
            <textarea
              required
              maxLength={500}
              placeholder="Enter task description..."
              className="w-full border border-gray-200 rounded-2xl p-4 h-28 outline-none focus:border-gray-400 resize-none text-gray-800"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Date/Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Start</label>
              <input
                required
                type="datetime-local"
                className="w-full border border-gray-200 rounded-2xl p-3 text-sm outline-none focus:border-gray-400"
                value={formData.start}
                onChange={e => setFormData({...formData, start: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Expected End</label>
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
              Urgent
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, priority: 1})}
              className={`flex-1 py-3.5 rounded-full text-sm font-medium transition-all ${
                formData.priority === 1
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Regular
            </button>
          </div>

          {/* Status (only when editing) */}
          {editingTask && (
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-2">Status</label>
              <select
                className="w-full border border-gray-200 rounded-2xl p-3.5 text-sm outline-none focus:border-gray-400 bg-white"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="created">Created</option>
                <option value="in execution">In Execution</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-4 rounded-full font-medium text-base"
          >
            {editingTask ? 'Save Changes' : 'Create Task'}
          </button>
        </form>
      </div>
    );
  };

  const CalendarScreen = () => {
    const now = new Date();
    const filteredTasks = tasks.filter(t => calendarFilter === 'all' || t.status === calendarFilter);
    
    return (
      <div className="h-full bg-white p-6 overflow-y-auto pb-24" onClick={() => setActiveTaskMenu(null)}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Schedule</h2>
          <select className="text-xs border rounded p-1" value={calendarFilter} onChange={e => setCalendarFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="in execution">In Execution</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>

        {/* Grid Calendar - Figma Style */}
        <div className="grid grid-cols-7 gap-2 mb-8">
          {['S','M','T','W','T','F','S'].map((day, i) => (
            <div key={i} className="text-[10px] text-center font-bold text-gray-400">{day}</div>
          ))}
          {[...Array(31)].map((_, i) => {
            const day = i + 1;
            const isToday = day === now.getDate();
            const hasTask = tasks.some(t => new Date(t.start).getDate() === day);
            return (
              <div key={i} className={`aspect-square border rounded-lg flex flex-col items-center justify-center text-[11px] relative
                ${isToday ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-700 shadow-sm' : 'border-gray-100 text-gray-600'}
              `}>
                {day}
                {hasTask && <div className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />}
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredTasks.map(t => (
            <div key={t.id} className="p-4 border rounded-xl flex items-center gap-4 group relative">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 
                ${t.status === 'in execution' ? 'bg-green-500 animate-pulse' : 
                  t.status === 'completed' ? 'bg-blue-400' : 'bg-gray-300'}`} />
              
              <div className="flex-1">
                <p className={`text-sm font-semibold ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {t.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(t.start).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(t.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setActiveTaskMenu(activeTaskMenu === t.id ? null : t.id); }}
                className="p-2 text-gray-400 hover:text-black"
              >
                <MoreVertical size={16} />
              </button>
              <TaskContextMenu task={t} />
            </div>
          ))}
          {filteredTasks.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No tasks found in this view</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-white relative font-sans text-gray-900 shadow-2xl flex flex-col">
      <Header />
      <SideMenu />
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
        <div className="flex justify-between items-center h-full px-12">
          <button onClick={() => { setEditingTask(null); setCurrentScreen('home'); }} className={`flex flex-col items-center gap-1 ${currentScreen === 'home' ? 'text-black' : 'text-gray-400'}`}>
            <Home size={22} />
            <span className="text-[9px] font-black uppercase">Home</span>
          </button>
          <button onClick={() => { setEditingTask(null); setCurrentScreen('calendar'); }} className={`flex flex-col items-center gap-1 ${currentScreen === 'calendar' ? 'text-black' : 'text-gray-400'}`}>
            <CalendarIcon size={22} />
            <span className="text-[9px] font-black uppercase">Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;