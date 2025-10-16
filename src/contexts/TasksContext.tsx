"use client";

import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react';

interface TasksContextType {
  hasTasksForToday: boolean;
  setHasTasksForToday: (hasTasks: boolean) => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [hasTasksForToday, setHasTasksForToday] = useState(false);

  const value = useMemo(() => ({
    hasTasksForToday,
    setHasTasksForToday,
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
