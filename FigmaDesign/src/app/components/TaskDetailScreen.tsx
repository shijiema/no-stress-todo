import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { format } from 'date-fns';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';
import { TaskPriority, TaskStatus } from '../types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function TaskDetailScreen() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId: string }>();
  const { tasks, updateTask, deleteTask } = useTasks();
  
  const task = tasks.find(t => t.id === taskId);

  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(1);
  const [status, setStatus] = useState<TaskStatus>('created');

  useEffect(() => {
    if (task) {
      setDescription(task.description);
      
      const startDateTime = new Date(task.startTime);
      setStartDate(format(startDateTime, 'yyyy-MM-dd'));
      setStartTime(format(startDateTime, 'HH:mm'));
      
      if (task.endTime) {
        const endDateTime = new Date(task.endTime);
        setEndDate(format(endDateTime, 'yyyy-MM-dd'));
        setEndTime(format(endDateTime, 'HH:mm'));
      }
      
      setPriority(task.priority);
      setStatus(task.status);
    }
  }, [task]);

  if (!task) {
    return (
      <div className="h-full w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Task not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!description.trim() || !startDate || !startTime) {
      alert('Please fill in required fields');
      return;
    }

    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = endDate && endTime ? `${endDate}T${endTime}:00` : undefined;

    const updates = {
      description: description.slice(0, 500),
      startTime: new Date(startDateTime).toISOString(),
      endTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
      priority,
      status,
      finishTime: status === 'completed' && !task.finishTime ? new Date().toISOString() : task.finishTime
    };

    updateTask(task.id, updates);
    navigate('/');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      navigate('/');
    }
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-semibold text-slate-900">Edit Task</h1>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 max-w-2xl mx-auto">
          {/* Creation Time (Read-only) */}
          <div className="space-y-2">
            <Label>Created</Label>
            <div className="text-sm text-slate-600">
              {format(new Date(task.creationTime), 'PPpp')}
            </div>
          </div>

          {/* Finish Time (Read-only) */}
          {task.finishTime && (
            <div className="space-y-2">
              <Label>Finished</Label>
              <div className="text-sm text-slate-600">
                {format(new Date(task.finishTime), 'PPpp')}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-slate-500 text-right">
              {description.length}/500 characters
            </div>
          </div>

          {/* Start Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* End Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time (Optional)</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority.toString()} onValueChange={(val) => setPriority(parseInt(val) as TaskPriority)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Urgent (0)</SelectItem>
                <SelectItem value="1">Regular (1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="in-execution">In Execution</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
