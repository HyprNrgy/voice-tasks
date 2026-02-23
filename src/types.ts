export interface Task {
  id: string;
  heading: string;
  body: string;
  dueDate: string;
  reminders: {
    oneDay: { time: string; notified: boolean };
    sixHours: { time: string; notified: boolean };
    oneHour: { time: string; notified: boolean };
  };
  createdAt: string;
  completed: boolean;
}
