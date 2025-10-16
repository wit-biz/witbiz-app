"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, description?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function GlobalNotificationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const showNotification = useCallback((type: NotificationType, title: string, description?: string) => {
    toast({
      title: title,
      description: description,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  }, [toast]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useGlobalNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useGlobalNotification must be used within a GlobalNotificationProvider');
  }
  return context;
}

    