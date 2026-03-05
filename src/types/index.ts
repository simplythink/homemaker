// ============ 存貨管理 ============
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  categoryId: string;
  location: string; // 存放位置
  minQuantity?: number; // 低於此數量時提醒補貨
  expiryDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  icon?: string;
  subcategories?: string[]; // 子分類名稱，用於細項管理
}

// ============ 清潔工作 ============
export type CleaningFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'custom';

export interface CleaningTask {
  id: string;
  name: string;
  frequency: CleaningFrequency;
  customDays?: number; // 當 frequency 為 custom 時使用
  lastCompletedAt?: string;
  area?: string; // 區域：廚房、浴室、客廳等
  subtasks?: string[]; // 細項清單
  notes?: string;
  updatedAt: string;
}

// ============ App 資料結構 ============
export interface AppData {
  inventory: {
    categories: InventoryCategory[];
    items: InventoryItem[];
  };
  cleaning: {
    tasks: CleaningTask[];
  };
}
