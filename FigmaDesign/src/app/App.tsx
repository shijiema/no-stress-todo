import { RouterProvider } from 'react-router';
import { TaskProvider } from './contexts/TaskContext';
import { router } from './routes';

export default function App() {
  return (
    <TaskProvider>
      <div className="size-full">
        <RouterProvider router={router} />
      </div>
    </TaskProvider>
  );
}