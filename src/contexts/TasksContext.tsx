
"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { useCRMData } from './CRMDataContext';

interface TasksContextType {
  hasTasksForToday: boolean;
  setHasTasksForToday: (hasTasks: boolean) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [hasTasksForToday, setHasTasksForToday] = useState(false);
  const { tasks } = useCRMData(); // Using tasks from CRMDataContext now

  // This effect is now just for calculating if there are tasks for today
  // The actual fetching happens in CRMDataContext
  React.useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hasToday = tasks.some(t => {
        if (t.status !== 'Pendiente') return false;
        try {
            const taskDate = new Date(t.dueDate);
            taskDate.setHours(0,0,0,0);
            return taskDate.getTime() === today.getTime();
        } catch {
            return false;
        }
    });
    setHasTasksForToday(hasToday);
  }, [tasks]);


  const value = useMemo(() => ({
    hasTasksForToday,
    setHasTasksForToday, // This might not be needed if logic is self-contained
  }), [hasTasksForToday]);

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasksContext must be used within a TasksProvider');
  }
  return context;
}
