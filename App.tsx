/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TaskRecorder } from './components/TaskRecorder';
import { Task } from './types';
import { CheckCircle2, Circle, Clock, Calendar, Bell, Trash2, History, ArrowLeft } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'active' | 'history'>('active');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('voice-tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('voice-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      let updated = false;
      
      const newTasks = tasks.map(task => {
        if (task.completed) return task;
        
        let taskUpdated = false;
        const newReminders = { ...task.reminders };

        const checkReminder = (key: keyof typeof newReminders, label: string) => {
          const reminder = newReminders[key];
          if (!reminder.notified && new Date(reminder.time).getTime() <= now) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Task Reminder: ${task.heading}`, {
                body: `Due in ${label}. ${task.body}`,
              });
            }
            newReminders[key] = { ...reminder, notified: true };
            taskUpdated = true;
            updated = true;
          }
        };

        checkReminder('oneDay', '1 day');
        checkReminder('sixHours', '6 hours');
        checkReminder('oneHour', '1 hour');

        if (taskUpdated) {
          return { ...task, reminders: newReminders };
        }
        return task;
      });

      if (updated) {
        setTasks(newTasks);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks]);

  const handleTaskCreated = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'reminders'>) => {
    const dueDate = new Date(taskData.dueDate);
    const oneDay = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sixHours = new Date(dueDate.getTime() - 6 * 60 * 60 * 1000).toISOString();
    const oneHour = new Date(dueDate.getTime() - 1 * 60 * 60 * 1000).toISOString();

    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
      reminders: {
        oneDay: { time: oneDay, notified: false },
        sixHours: { time: sixHours, notified: false },
        oneHour: { time: oneHour, notified: false },
      }
    };

    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const historyTasks = tasks.filter(t => t.completed).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const displayedTasks = view === 'active' ? activeTasks : historyTasks;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 relative">
        {view === 'active' ? (
          <button 
            onClick={() => setView('history')}
            className="absolute top-12 right-6 md:top-20 md:right-6 p-2 text-zinc-400 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-100"
            title="View History"
          >
            <History className="w-6 h-6" />
          </button>
        ) : (
          <button 
            onClick={() => setView('active')}
            className="absolute top-12 left-6 md:top-20 md:left-6 p-2 text-zinc-400 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-100"
            title="Back to Active Tasks"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        <header className="mb-16 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 mb-3">
            {view === 'active' ? 'Voice Tasks' : 'Task History'}
          </h1>
          <p className="text-zinc-500 text-sm md:text-base">
            {view === 'active' 
              ? "Speak your assignments and tests. We'll organize them and remind you."
              : "Completed tasks and past assignments."}
          </p>
        </header>

        {view === 'active' && <TaskRecorder onTaskCreated={handleTaskCreated} />}

        <div className={`space-y-4 ${view === 'active' ? 'mt-20' : 'mt-12'}`}>
          {displayedTasks.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p>{view === 'active' ? 'No active tasks. Tap the microphone to add one.' : 'No completed tasks yet.'}</p>
            </div>
          ) : (
            displayedTasks.map(task => (
              <div 
                key={task.id} 
                className={`group relative bg-white border border-zinc-200 rounded-2xl p-6 transition-all duration-200 hover:shadow-md ${
                  task.completed ? 'opacity-60 bg-zinc-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className="mt-1 text-zinc-400 hover:text-zinc-900 transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-zinc-900" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-medium tracking-tight mb-2 ${task.completed ? 'line-through text-zinc-500' : 'text-zinc-900'}`}>
                      {task.heading}
                    </h3>
                    <p className="text-zinc-600 text-sm leading-relaxed mb-4">
                      {task.body}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
                      <div className="flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due: {formatDateTime(task.dueDate)}</span>
                      </div>
                      
                      {!task.completed && (
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Bell className="w-3.5 h-3.5" />
                          <span>Reminders set</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
