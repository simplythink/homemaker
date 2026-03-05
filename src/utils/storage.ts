import type { AppData } from '../types';

const STORAGE_KEY = 'homemaker-app-data';

const defaultData: AppData = {
  inventory: {
    categories: [
      { id: 'cat-1', name: '食品', icon: '🍜', subcategories: ['冷藏', '冷凍', '乾貨', '調味料'] },
      { id: 'cat-2', name: '日用品', icon: '🧴', subcategories: ['浴室', '廚房', '清潔'] },
      { id: 'cat-3', name: '清潔用品', icon: '🧹', subcategories: [] },
      { id: 'cat-4', name: '藥品', icon: '💊', subcategories: [] },
    ],
    items: [],
  },
  cleaning: {
    tasks: [
      { id: 'clean-1', name: '地板清潔', frequency: 'weekly', area: '全室', subtasks: ['吸塵', '拖地'], updatedAt: new Date().toISOString() },
      { id: 'clean-2', name: '廚房清潔', frequency: 'weekly', area: '廚房', subtasks: ['流理台', '爐具', '抽油煙機'], updatedAt: new Date().toISOString() },
      { id: 'clean-3', name: '浴室清潔', frequency: 'weekly', area: '浴室', subtasks: ['馬桶', '洗手台', '淋浴間'], updatedAt: new Date().toISOString() },
      { id: 'clean-4', name: '窗戶清潔', frequency: 'monthly', area: '全室', updatedAt: new Date().toISOString() },
    ],
  },
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as AppData;
    return mergeWithDefaults(parsed);
  } catch {
    return defaultData;
  }
}

function mergeWithDefaults(parsed: Partial<AppData>): AppData {
  return {
    inventory: {
      categories: parsed.inventory?.categories?.length ? parsed.inventory.categories : defaultData.inventory.categories,
      items: parsed.inventory?.items ?? defaultData.inventory.items,
    },
    cleaning: {
      tasks: parsed.cleaning?.tasks?.length ? parsed.cleaning.tasks : defaultData.cleaning.tasks,
    },
  };
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
