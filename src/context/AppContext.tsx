import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppData, InventoryItem, InventoryCategory, CleaningTask } from '../types';
import { loadData, saveData } from '../utils/storage';
import { generateId } from '../utils/helpers';

interface AppContextValue {
  data: AppData;
  // Inventory
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  removeInventoryItem: (id: string) => void;
  addCategory: (cat: Omit<InventoryCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<InventoryCategory>) => void;
  removeCategory: (id: string) => void;
  // Cleaning
  addCleaningTask: (task: Omit<CleaningTask, 'id' | 'updatedAt'>) => void;
  updateCleaningTask: (id: string, updates: Partial<CleaningTask>) => void;
  removeCleaningTask: (id: string) => void;
  completeCleaningTask: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const persist = useCallback((updater: (d: AppData) => AppData) => {
    setData(updater);
  }, []);

  const value: AppContextValue = {
    data,
    addInventoryItem: (item) => {
      persist((d) => ({
        ...d,
        inventory: {
          ...d.inventory,
          items: [...d.inventory.items, { ...item, id: generateId(), updatedAt: new Date().toISOString() }],
        },
      }));
    },
    updateInventoryItem: (id, updates) => {
      persist((d) => ({
        ...d,
        inventory: {
          ...d.inventory,
          items: d.inventory.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
          ),
        },
      }));
    },
    removeInventoryItem: (id) => {
      persist((d) => ({
        ...d,
        inventory: { ...d.inventory, items: d.inventory.items.filter((i) => i.id !== id) },
      }));
    },
    addCategory: (cat) => {
      persist((d) => ({
        ...d,
        inventory: {
          ...d.inventory,
          categories: [...d.inventory.categories, { ...cat, id: generateId() }],
        },
      }));
    },
    updateCategory: (id, updates) => {
      persist((d) => ({
        ...d,
        inventory: {
          ...d.inventory,
          categories: d.inventory.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        },
      }));
    },
    removeCategory: (id) => {
      persist((d) => ({
        ...d,
        inventory: {
          ...d.inventory,
          categories: d.inventory.categories.filter((c) => c.id !== id),
          items: d.inventory.items.filter((i) => i.categoryId !== id),
        },
      }));
    },
    addCleaningTask: (task) => {
      persist((d) => ({
        ...d,
        cleaning: {
          ...d.cleaning,
          tasks: [...d.cleaning.tasks, { ...task, id: generateId(), updatedAt: new Date().toISOString() }],
        },
      }));
    },
    updateCleaningTask: (id, updates) => {
      persist((d) => ({
        ...d,
        cleaning: {
          ...d.cleaning,
          tasks: d.cleaning.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        },
      }));
    },
    removeCleaningTask: (id) => {
      persist((d) => ({
        ...d,
        cleaning: { ...d.cleaning, tasks: d.cleaning.tasks.filter((t) => t.id !== id) },
      }));
    },
    completeCleaningTask: (id) => {
      persist((d) => ({
        ...d,
        cleaning: {
          ...d.cleaning,
          tasks: d.cleaning.tasks.map((t) =>
            t.id === id ? { ...t, lastCompletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : t
          ),
        },
      }));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
