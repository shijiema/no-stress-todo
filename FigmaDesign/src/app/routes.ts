import { createBrowserRouter } from "react-router";
import { HomeScreen } from "./components/HomeScreen";
import { CreateTaskScreen } from "./components/CreateTaskScreen";
import { CalendarViewScreen } from "./components/CalendarViewScreen";
import { TaskDetailScreen } from "./components/TaskDetailScreen";
import { CompletedTasksScreen } from "./components/CompletedTasksScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeScreen,
  },
  {
    path: "/create",
    Component: CreateTaskScreen,
  },
  {
    path: "/calendar",
    Component: CalendarViewScreen,
  },
  {
    path: "/task/:taskId",
    Component: TaskDetailScreen,
  },
  {
    path: "/completed",
    Component: CompletedTasksScreen,
  },
]);
