import { useTasks } from '../contexts/TaskContext';
import { Task } from '../types/task';
import { useNavigate } from 'react-router';
import { format, startOfDay, addDays, differenceInDays, isPast, differenceInHours } from 'date-fns';
import { Menu, ChevronLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { useState } from 'react';

export function HomeScreen() {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const today = startOfDay(new Date());

  // Categorize tasks
  const inExecutionTasks = tasks.filter(task => {
    const taskStart = startOfDay(new Date(task.startTime));
    return task.status === 'in-execution' && isPast(taskStart);
  });

  const startDelayedTasks = tasks.filter(task => {
    const taskStart = startOfDay(new Date(task.startTime));
    return task.status === 'created' && isPast(taskStart);
  });

  const startNextDayTasks = tasks.filter(task => {
    const taskStart = startOfDay(new Date(task.startTime));
    const tomorrow = addDays(today, 1);
    return differenceInDays(taskStart, today) === 1 && task.status === 'created';
  });

  const startInTwoDaysTasks = tasks.filter(task => {
    const taskStart = startOfDay(new Date(task.startTime));
    return differenceInDays(taskStart, today) === 2 && task.status === 'created';
  });

  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      {/* Header with arrow and text */}
      <div className="px-4 py-6 bg-white">
        <div className="flex items-center gap-2 text-slate-600 mb-4">
          <svg width="40" height="20" viewBox="0 0 40 20" fill="none">
            <path d="M0 10 L35 10 M25 2 L35 10 L25 18" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span className="text-sm italic">time flys</span>
        </div>
        
        {/* Today's Date */}
        <div className="text-2xl font-semibold text-slate-900">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Menu Icon */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu for task management options
          </SheetDescription>
          <div className="flex flex-col gap-2 mt-8">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => navigate('/completed')}
            >
              Completed Tasks
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => navigate('/calendar')}
            >
              Calendar View
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => alert('Import from calendar feature')}
            >
              Import from Calendar
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => alert('Export to calendar feature')}
            >
              Export to Calendar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Task Sections Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
          {/* In Execution Section */}
          <TaskSection
            title="In Execution"
            tasks={inExecutionTasks}
            color="bg-green-500"
            updateTask={updateTask}
            onTaskClick={(task) => navigate(`/task/${task.id}`)}
          />

          {/* Start Delayed Section */}
          <TaskSection
            title="Start Delayed"
            tasks={startDelayedTasks}
            color="bg-red-500"
            updateTask={updateTask}
            onTaskClick={(task) => navigate(`/task/${task.id}`)}
          />

          {/* Start Next Day Section */}
          <TaskSection
            title="Start Next Day"
            tasks={startNextDayTasks}
            color="bg-yellow-500"
            updateTask={updateTask}
            onTaskClick={(task) => navigate(`/task/${task.id}`)}
          />

          {/* Start in Two Days Section */}
          <TaskSection
            title="Start in Two Days"
            tasks={startInTwoDaysTasks}
            color="bg-green-500"
            updateTask={updateTask}
            onTaskClick={(task) => navigate(`/task/${task.id}`)}
          />
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => navigate('/create')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
      >
        <span className="text-3xl leading-none">+</span>
      </button>
    </div>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  color: string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
}

function TaskSection({ title, tasks, color, updateTask, onTaskClick }: TaskSectionProps) {
  const [scrollPosition, setScrollPosition] = useState(0);

  const calculateTaskSize = (task: Task) => {
    const now = new Date();
    const endTime = task.endTime ? new Date(task.endTime) : null;
    
    // Base size
    let width = 120;
    let opacity = 0.6;

    // Increase size based on priority
    if (task.priority === 0) {
      width = 160; // urgent tasks are bigger
      opacity = 0.9;
    }

    // Adjust opacity based on time left
    if (endTime) {
      const hoursLeft = differenceInHours(endTime, now);
      if (hoursLeft < 24) {
        opacity = 1.0; // Very urgent
      } else if (hoursLeft < 72) {
        opacity = 0.8;
      }
    }

    // Max width should not exceed 1/5 of section
    const maxWidth = 160;
    width = Math.min(width, maxWidth);

    return { width, opacity };
  };

  const showScrollIndicator = tasks.length > 2;

  return (
    <div className="border-b border-slate-200 last:border-b-0 pb-4 last:pb-0">
      <h3 className="text-sm font-medium text-slate-700 mb-2">{title}</h3>
      <div className="relative">
        {showScrollIndicator && scrollPosition === 0 && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-1">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </div>
        )}
        <div
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 justify-end"
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {tasks.length === 0 ? (
            <div className="text-sm text-slate-400 py-4">No tasks</div>
          ) : (
            tasks.map(task => {
              const { width, opacity } = calculateTaskSize(task);
              // Determine color shade based on priority
              const taskColor = task.priority === 0 ? color : color.replace('500', '700');
              
              return (
                <button
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  style={{
                    minWidth: `${width}px`,
                    opacity
                  }}
                  className={`${taskColor} text-white rounded-lg p-3 flex flex-col justify-between h-24 hover:scale-105 transition-transform`}
                >
                  <div className="text-xs font-medium line-clamp-2 text-left">
                    {task.description}
                  </div>
                  <div className="text-xs opacity-90">
                    {task.endTime && format(new Date(task.endTime), 'MMM d, h:mm a')}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}