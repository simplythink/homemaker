import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FREQUENCY_LABELS, getNextDueDate, isOverdue } from '../../utils/helpers';
import type { CleaningTask, CleaningFrequency } from '../../types';
import './Cleaning.css';

const FREQUENCY_OPTIONS: CleaningFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'custom'];

export function CleaningView() {
  const { data, addCleaningTask, removeCleaningTask, completeCleaningTask } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newTask, setNewTask] = useState<Partial<CleaningTask>>({
    frequency: 'weekly',
    subtasks: [],
  });
  const [newSubtask, setNewSubtask] = useState('');

  const tasks = data.cleaning.tasks;

  const formatDate = (d: Date) => d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setNewTask((t) => ({ ...t, subtasks: [...(t.subtasks ?? []), newSubtask.trim()] }));
    setNewSubtask('');
  };

  const handleAddTask = () => {
    if (!newTask.name) return;
    addCleaningTask({
      name: newTask.name,
      frequency: newTask.frequency ?? 'weekly',
      customDays: newTask.customDays,
      area: newTask.area,
      subtasks: newTask.subtasks,
      notes: newTask.notes,
    });
    setNewTask({ frequency: 'weekly', subtasks: [] });
    setShowAdd(false);
  };

  return (
    <div className="cleaning-view">
      <header className="cleaning-header">
        <h2>🧹 清潔工作</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ 新增清潔任務</button>
      </header>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>新增清潔任務</h3>
            <div className="form-grid">
              <label>任務名稱 *</label>
              <input
                value={newTask.name ?? ''}
                onChange={(e) => setNewTask((t) => ({ ...t, name: e.target.value }))}
                placeholder="例：廚房清潔"
              />
              <label>區域</label>
              <input
                value={newTask.area ?? ''}
                onChange={(e) => setNewTask((t) => ({ ...t, area: e.target.value }))}
                placeholder="例：廚房、浴室"
              />
              <label>頻率</label>
              <select
                value={newTask.frequency ?? 'weekly'}
                onChange={(e) => setNewTask((t) => ({ ...t, frequency: e.target.value as CleaningFrequency }))}
              >
                {FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
              {newTask.frequency === 'custom' && (
                <>
                  <label>天數</label>
                  <input
                    type="number"
                    min={1}
                    value={newTask.customDays ?? 7}
                    onChange={(e) => setNewTask((t) => ({ ...t, customDays: +e.target.value }))}
                  />
                </>
              )}
              <label>細項清單</label>
              <div className="subtask-input">
                <input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="新增細項..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
                <button type="button" onClick={handleAddSubtask}>+</button>
              </div>
            </div>
            {(newTask.subtasks?.length ?? 0) > 0 && (
              <ul className="subtask-list">
                {newTask.subtasks!.map((s, i) => (
                  <li key={i}>
                    {s}
                    <button
                      type="button"
                      className="remove-sub"
                      onClick={() => setNewTask((t) => ({
                        ...t,
                        subtasks: t.subtasks!.filter((_, j) => j !== i),
                      }))}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn-primary" onClick={handleAddTask}>新增</button>
            </div>
          </div>
        </div>
      )}

      <div className="cleaning-content">
        {tasks.length === 0 ? (
          <p className="empty-state">尚無清潔任務，點擊「新增清潔任務」開始設定</p>
        ) : (
          <div className="task-list">
            {tasks.map((task) => {
              const nextDue = getNextDueDate(task);
              const overdue = isOverdue(task);
              return (
                <div key={task.id} className={`task-card ${overdue ? 'overdue' : ''}`}>
                  <div className="task-main">
                    <div className="task-title-row">
                      <h3>{task.name}</h3>
                      <span className="task-freq">{FREQUENCY_LABELS[task.frequency]}</span>
                    </div>
                    {task.area && <span className="task-area">📍 {task.area}</span>}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <ul className="task-subtasks">
                        {task.subtasks.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    )}
                    <div className="task-dates">
                      {task.lastCompletedAt ? (
                        <span>上次：{formatDate(new Date(task.lastCompletedAt))}</span>
                      ) : (
                        <span className="muted">尚未執行</span>
                      )}
                      <span className={overdue ? 'due-overdue' : 'due-next'}>
                        下次：{formatDate(nextDue)}
                      </span>
                    </div>
                  </div>
                  <div className="task-actions">
                    <button className="btn-complete" onClick={() => completeCleaningTask(task.id)}>
                      ✓ 完成
                    </button>
                    <button className="btn-danger" onClick={() => removeCleaningTask(task.id)}>刪除</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
