import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';

export function CompletedTasksScreen() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900">Completed Tasks</h1>
        <span className="ml-auto text-sm text-slate-500">
          {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4">
        {completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <CheckCircle2 className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">No completed tasks yet</p>
            <p className="text-sm">Tasks you complete will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {completedTasks.map(task => (
              <button
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="w-full bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 line-clamp-2">
                      {task.description}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <div>Started: {format(new Date(task.startTime), 'MMM d, yyyy h:mm a')}</div>
                      {task.finishTime && (
                        <div>• Finished: {format(new Date(task.finishTime), 'MMM d, yyyy h:mm a')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
