import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task } from '../types/task';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    // Clear existing localStorage and start fresh with sample tasks
    localStorage.removeItem('tasks');
    
    // Initialize with sample tasks
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return [
      {
        id: 'sample-1',
        description: 'Complete project presentation',
        startTime: yesterday.toISOString(),
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        priority: 0, // urgent - bigger, green
        status: 'in-execution' as const,
        createdAt: yesterday.toISOString()
      },
      {
        id: 'sample-2',
        description: 'Review team code',
        startTime: yesterday.toISOString(),
        endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
        priority: 1, // regular - smaller, darker green
        status: 'in-execution' as const,
        createdAt: yesterday.toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within TaskProvider');
  }
  return context;
}