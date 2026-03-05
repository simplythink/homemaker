import { useApp } from '../../context/AppContext';
import { getNextDueDate, isOverdue } from '../../utils/helpers';
import './Dashboard.css';

export function DashboardView() {
  const { data } = useApp();

  const lowStockItems = data.inventory.items.filter(
    (i) => i.minQuantity != null && i.quantity < i.minQuantity
  );
  const overdueTasks = data.cleaning.tasks.filter(isOverdue);
  const dueSoonTasks = data.cleaning.tasks.filter((t) => {
    if (isOverdue(t)) return false;
    const next = getNextDueDate(t);
    const daysUntil = (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntil <= 2;
  });

  const formatDate = (d: Date) => d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });

  return (
    <div className="dashboard-view">
      <h2>🏠 居家管理總覽</h2>

      <div className="dashboard-grid">
        <section className="dashboard-card alert">
          <h3>⚠️ 需補貨 ({lowStockItems.length})</h3>
          {lowStockItems.length === 0 ? (
            <p className="muted">目前無需補貨項目</p>
          ) : (
            <ul>
              {lowStockItems.map((i) => (
                <li key={i.id}>
                  {i.name}：{i.quantity} {i.unit}
                  {i.minQuantity != null && (
                    <span className="min-qty">（最低 {i.minQuantity}）</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card alert">
          <h3>🧹 逾期清潔 ({overdueTasks.length})</h3>
          {overdueTasks.length === 0 ? (
            <p className="muted">無逾期清潔任務</p>
          ) : (
            <ul>
              {overdueTasks.map((t) => (
                <li key={t.id}>{t.name}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card">
          <h3>📅 即將到期清潔</h3>
          {dueSoonTasks.length === 0 ? (
            <p className="muted">未來兩天內無清潔任務</p>
          ) : (
            <ul>
              {dueSoonTasks.map((t) => (
                <li key={t.id}>
                  {t.name} — {formatDate(getNextDueDate(t))}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dashboard-card stats">
          <h3>📊 統計</h3>
          <div className="stat-row">
            <span>存貨品項</span>
            <strong>{data.inventory.items.length}</strong>
          </div>
          <div className="stat-row">
            <span>清潔任務</span>
            <strong>{data.cleaning.tasks.length}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
