export type TaskStatus = 'created' | 'in-execution' | 'completed' | 'abandoned';
export type TaskPriority = 0 | 1; // 0 = urgent, 1 = regular

export interface Task {
  id: string;
  description: string;
  startTime: string; // ISO date string
  endTime?: string; // ISO date string, optional
  priority: TaskPriority;
  status: TaskStatus;
  creationTime: string; // ISO date string
  finishTime?: string; // ISO date string
}
