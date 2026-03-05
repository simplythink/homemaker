import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { InventoryItem } from '../../types';
import './Inventory.css';

const COMMON_UNITS = ['個', '包', '瓶', '罐', '盒', '袋', '片', '條', '克', '毫升'];

export function InventoryView() {
  const { data, addInventoryItem, updateInventoryItem, removeInventoryItem } = useApp();
  const [filter, setFilter] = useState({ category: '', location: '', search: '', lowStock: false });
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ quantity: 1, unit: '個' });

  const categories = data.inventory.categories;
  const items = data.inventory.items;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter.category && item.categoryId !== filter.category) return false;
      if (filter.location && !item.location.toLowerCase().includes(filter.location.toLowerCase())) return false;
      if (filter.search && !item.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
      if (filter.lowStock && item.minQuantity != null && item.quantity >= item.minQuantity) return false;
      return true;
    });
  }, [items, categories, filter]);

  const locations = useMemo(() => [...new Set(items.map((i) => i.location).filter(Boolean))], [items]);

  const handleAdd = () => {
    if (!newItem.name || !newItem.categoryId || newItem.quantity == null) return;
    addInventoryItem({
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit ?? '個',
      categoryId: newItem.categoryId,
      location: newItem.location ?? '',
      minQuantity: newItem.minQuantity,
      expiryDate: newItem.expiryDate,
      notes: newItem.notes,
    });
    setNewItem({ quantity: 1, unit: '個' });
    setShowAdd(false);
  };

  const lowStockCount = items.filter((i) => i.minQuantity != null && i.quantity < i.minQuantity).length;

  return (
    <div className="inventory-view">
      <header className="inventory-header">
        <h2>📦 存貨管理</h2>
        <div className="inventory-filters">
          <input
            type="text"
            placeholder="搜尋品項..."
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            className="filter-input"
          />
          <select
            value={filter.category}
            onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
            className="filter-select"
          >
            <option value="">全部分類</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="存放位置"
            value={filter.location}
            onChange={(e) => setFilter((f) => ({ ...f, location: e.target.value }))}
            className="filter-input short"
          />
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filter.lowStock}
              onChange={(e) => setFilter((f) => ({ ...f, lowStock: e.target.checked }))}
            />
            僅顯示需補貨 {lowStockCount > 0 && <span className="badge">{lowStockCount}</span>}
          </label>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ 新增品項</button>
      </header>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新增存貨</h3>
            <div className="form-grid">
              <label>品名 *</label>
              <input
                value={newItem.name ?? ''}
                onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
                placeholder="例：衛生紙"
              />
              <label>分類 *</label>
              <select
                value={newItem.categoryId ?? ''}
                onChange={(e) => setNewItem((n) => ({ ...n, categoryId: e.target.value }))}
              >
                <option value="">請選擇</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <label>數量</label>
              <input
                type="number"
                min={0}
                value={newItem.quantity ?? 1}
                onChange={(e) => setNewItem((n) => ({ ...n, quantity: +e.target.value }))}
              />
              <label>單位</label>
              <select
                value={newItem.unit ?? '個'}
                onChange={(e) => setNewItem((n) => ({ ...n, unit: e.target.value }))}
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <label>存放位置</label>
              <input
                value={newItem.location ?? ''}
                onChange={(e) => setNewItem((n) => ({ ...n, location: e.target.value }))}
                placeholder="例：廚房櫃子、浴室"
                list="location-list"
              />
              <datalist id="location-list">
                {locations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
              <label>最低庫存提醒</label>
              <input
                type="number"
                min={0}
                placeholder="選填"
                value={newItem.minQuantity ?? ''}
                onChange={(e) => setNewItem((n) => ({ ...n, minQuantity: e.target.value ? +e.target.value : undefined }))}
              />
              <label>到期日</label>
              <input
                type="date"
                value={newItem.expiryDate ?? ''}
                onChange={(e) => setNewItem((n) => ({ ...n, expiryDate: e.target.value || undefined }))}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn-primary" onClick={handleAdd}>新增</button>
            </div>
          </div>
        </div>
      )}

      <div className="inventory-content">
        {filteredItems.length === 0 ? (
          <p className="empty-state">尚無存貨紀錄，點擊「新增品項」開始記錄</p>
        ) : (
          <div className="item-grid">
            {filteredItems.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const isLow = item.minQuantity != null && item.quantity < item.minQuantity;
              return (
                <div key={item.id} className={`item-card ${isLow ? 'low-stock' : ''}`}>
                  <div className="item-main">
                    <span className="item-cat">{cat?.icon} {cat?.name}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">
                      {item.quantity} {item.unit}
                      {isLow && <span className="low-badge">需補貨</span>}
                    </span>
                    <span className="item-location">📍 {item.location || '未設定'}</span>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => setEditing(editing === item.id ? null : item.id)}>編輯</button>
                    <button className="btn-danger" onClick={() => removeInventoryItem(item.id)}>刪除</button>
                  </div>
                  {editing === item.id && (
                    <div className="item-edit">
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateInventoryItem(item.id, { quantity: +e.target.value })}
                      />
                      <input
                        value={item.location}
                        onChange={(e) => updateInventoryItem(item.id, { location: e.target.value })}
                        placeholder="位置"
                      />
                      <button onClick={() => setEditing(null)}>完成</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
