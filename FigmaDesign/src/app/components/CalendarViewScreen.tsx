import { useState } from 'react';
import { useNavigate } from 'react-router';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import { TaskStatus } from '../types/task';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

const STATUS_COLORS: Record<TaskStatus, string> = {
  'created': 'bg-slate-400',
  'in-execution': 'bg-green-500',
  'completed': 'bg-gray-400',
  'abandoned': 'bg-red-400'
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  'created': 'Created',
  'in-execution': 'In Execution',
  'completed': 'Completed',
  'abandoned': 'Abandoned'
};

export function CalendarViewScreen() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<TaskStatus>>(
    new Set(['created', 'in-execution', 'completed', 'abandoned'])
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const toggleStatus = (status: TaskStatus) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return isSameDay(taskDate, day) && selectedStatuses.has(task.status);
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Calendar View</h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={previousMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-lg font-medium text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="bg-white px-4 py-3 border-t border-slate-200">
        <div className="text-sm font-medium text-slate-700 mb-2">Filter by Status:</div>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map(status => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={status}
                checked={selectedStatuses.has(status)}
                onCheckedChange={() => toggleStatus(status)}
              />
              <Label htmlFor={status} className="cursor-pointer flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-sm">{STATUS_LABELS[status]}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of the month */}
            {daysInMonth.map(day => {
              const dayTasks = getTasksForDay(day);
              const isCurrentDay = isToday(day);
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    if (dayTasks.length > 0) {
                      navigate(`/day/${format(day, 'yyyy-MM-dd')}`);
                    }
                  }}
                  className={`
                    aspect-square border rounded-lg p-1 hover:bg-slate-50 transition-colors
                    ${isCurrentDay ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}
                  `}
                >
                  <div className="flex flex-col h-full">
                    <div className={`text-sm ${isCurrentDay ? 'font-semibold text-blue-600' : 'text-slate-700'}`}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Task dots */}
                    {dayTasks.length > 0 && (
                      <div className="flex-1 flex flex-wrap gap-0.5 mt-1 content-start">
                        {dayTasks.slice(0, 6).map(task => (
                          <div
                            key={task.id}
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[task.status]}`}
                          />
                        ))}
                        {dayTasks.length > 6 && (
                          <div className="text-[8px] text-slate-500">+{dayTasks.length - 6}</div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
