(function () {
  'use strict';

  const STORAGE_KEY = 'homemaker-app-data';

  const FREQUENCY_LABELS = {
    daily: '每日',
    weekly: '每週',
    biweekly: '每兩週',
    monthly: '每月',
    quarterly: '每季',
    custom: '自訂',
  };

  const defaultData = {
    inventory: {
      categories: [
        { id: 'cat-1', name: '食品', icon: '🍜' },
        { id: 'cat-2', name: '日用品', icon: '🧴' },
        { id: 'cat-3', name: '清潔用品', icon: '🧹' },
        { id: 'cat-4', name: '藥品', icon: '💊' },
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

  function generateId() {
    return Date.now() + '-' + Math.random().toString(36).slice(2, 9);
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultData));
      const parsed = JSON.parse(raw);
      return {
        inventory: {
          categories: parsed.inventory?.categories?.length ? parsed.inventory.categories : defaultData.inventory.categories,
          items: parsed.inventory?.items ?? defaultData.inventory.items,
        },
        cleaning: {
          tasks: parsed.cleaning?.tasks?.length ? parsed.cleaning.tasks : defaultData.cleaning.tasks,
        },
      };
    } catch {
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

  function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getFrequencyDays(freq, customDays) {
    const map = { daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 90, custom: customDays ?? 7 };
    return map[freq] ?? 7;
  }

  function getNextDueDate(task) {
    const days = getFrequencyDays(task.frequency, task.customDays);
    const base = task.lastCompletedAt ? new Date(task.lastCompletedAt) : new Date();
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    return next;
  }

  function isOverdue(task) {
    return new Date() > getNextDueDate(task);
  }

  function formatDate(d) {
    return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  }

  let data = loadData();

  function persist() {
    saveData(data);
    renderAll();
  }

  function renderAll() {
    renderDashboard();
    renderInventory();
    renderCleaning();
  }

  function renderDashboard() {
    const lowStock = data.inventory.items.filter(i => i.minQuantity != null && i.quantity < i.minQuantity);
    const overdue = data.cleaning.tasks.filter(isOverdue);
    const dueSoon = data.cleaning.tasks.filter(t => {
      if (isOverdue(t)) return false;
      const next = getNextDueDate(t);
      return (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 2;
    });

    document.getElementById('low-stock-count').textContent = lowStock.length;
    document.getElementById('overdue-count').textContent = overdue.length;

    const lowList = document.getElementById('low-stock-list');
    lowList.innerHTML = lowStock.length === 0
      ? '<li class="muted">目前無需補貨項目</li>'
      : lowStock.map(i => `<li>${i.name}：${i.quantity} ${i.unit}${i.minQuantity != null ? ` <span class="min-qty">（最低 ${i.minQuantity}）</span>` : ''}</li>`).join('');

    const overdueList = document.getElementById('overdue-list');
    overdueList.innerHTML = overdue.length === 0
      ? '<li class="muted">無逾期清潔任務</li>'
      : overdue.map(t => `<li>${t.name}</li>`).join('');

    const dueSoonList = document.getElementById('due-soon-list');
    dueSoonList.innerHTML = dueSoon.length === 0
      ? '<li class="muted">未來兩天內無清潔任務</li>'
      : dueSoon.map(t => `<li>${t.name} — ${formatDate(getNextDueDate(t))}</li>`).join('');

    document.getElementById('stat-items').textContent = data.inventory.items.length;
    document.getElementById('stat-tasks').textContent = data.cleaning.tasks.length;
  }

  function renderInventory() {
    const search = document.getElementById('inv-search').value.toLowerCase();
    const catFilter = document.getElementById('inv-category').value;
    const locFilter = document.getElementById('inv-location').value.toLowerCase();
    const lowOnly = document.getElementById('inv-low-stock').checked;

    const filtered = data.inventory.items.filter(item => {
      if (catFilter && item.categoryId !== catFilter) return false;
      if (locFilter && !(item.location || '').toLowerCase().includes(locFilter)) return false;
      if (search && !item.name.toLowerCase().includes(search)) return false;
      if (lowOnly && (item.minQuantity == null || item.quantity >= item.minQuantity)) return false;
      return true;
    });

    const list = document.getElementById('inv-list');
    list.innerHTML = '';

    filtered.forEach(item => {
      const cat = data.inventory.categories.find(c => c.id === item.categoryId);
      const isLow = item.minQuantity != null && item.quantity < item.minQuantity;
      const card = document.createElement('div');
      card.className = 'item-card' + (isLow ? ' low-stock' : '');
      card.dataset.id = item.id;
      card.innerHTML = `
        <div class="item-main">
          <span class="item-cat">${cat?.icon || ''} ${cat?.name || ''}</span>
          <span class="item-name">${escapeHtml(item.name)}</span>
          <span class="item-qty">${item.quantity} ${item.unit}${isLow ? ' <span class="low-badge">需補貨</span>' : ''}</span>
          <span class="item-location">📍 ${escapeHtml(item.location || '未設定')}</span>
        </div>
        <div class="item-actions">
          <button data-action="edit">編輯</button>
          <button class="btn-danger" data-action="delete">刪除</button>
        </div>
        <div class="item-edit" style="display:none">
          <input type="number" min="0" data-field="qty" value="${item.quantity}" />
          <input type="text" data-field="loc" value="${escapeHtml(item.location || '')}" placeholder="位置" />
          <button data-action="done">完成</button>
        </div>
      `;
      list.appendChild(card);
    });

    document.getElementById('inv-empty').style.display = filtered.length === 0 ? 'block' : 'none';

    const lowCount = data.inventory.items.filter(i => i.minQuantity != null && i.quantity < i.minQuantity).length;
    const badge = document.getElementById('inv-low-badge');
    badge.textContent = lowCount;
    badge.style.display = lowCount > 0 ? 'inline' : 'none';

    list.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.onclick = () => {
        const card = btn.closest('.item-card');
        card.querySelector('.item-edit').style.display = 'flex';
      };
    });
    list.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.closest('.item-card').dataset.id;
        data.inventory.items = data.inventory.items.filter(i => i.id !== id);
        persist();
      };
    });
    list.querySelectorAll('[data-action="done"]').forEach(btn => {
      btn.onclick = () => {
        const card = btn.closest('.item-card');
        const id = card.dataset.id;
        const item = data.inventory.items.find(i => i.id === id);
        if (item) {
          item.quantity = +card.querySelector('[data-field="qty"]').value;
          item.location = card.querySelector('[data-field="loc"]').value;
          item.updatedAt = new Date().toISOString();
        }
        card.querySelector('.item-edit').style.display = 'none';
        persist();
      };
    });
  }

  function renderCleaning() {
    const list = document.getElementById('clean-list');
    list.innerHTML = '';

    data.cleaning.tasks.forEach(task => {
      const nextDue = getNextDueDate(task);
      const overdue = isOverdue(task);
      const card = document.createElement('div');
      card.className = 'task-card' + (overdue ? ' overdue' : '');
      card.dataset.id = task.id;
      card.innerHTML = `
        <div class="task-main">
          <div class="task-title-row">
            <h3>${escapeHtml(task.name)}</h3>
            <span class="task-freq">${FREQUENCY_LABELS[task.frequency] || task.frequency}</span>
          </div>
          ${task.area ? `<span class="task-area">📍 ${escapeHtml(task.area)}</span>` : ''}
          ${task.subtasks && task.subtasks.length ? `<ul class="task-subtasks">${task.subtasks.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>` : ''}
          <div class="task-dates">
            <span>${task.lastCompletedAt ? '上次：' + formatDate(new Date(task.lastCompletedAt)) : '<span class="muted">尚未執行</span>'}</span>
            <span class="${overdue ? 'due-overdue' : 'due-next'}">下次：${formatDate(nextDue)}</span>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-complete" data-action="complete">✓ 完成</button>
          <button class="btn-danger" data-action="delete">刪除</button>
        </div>
      `;
      list.appendChild(card);
    });

    document.getElementById('clean-empty').style.display = data.cleaning.tasks.length === 0 ? 'block' : 'none';

    list.querySelectorAll('[data-action="complete"]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.closest('.task-card').dataset.id;
        const task = data.cleaning.tasks.find(t => t.id === id);
        if (task) {
          task.lastCompletedAt = new Date().toISOString();
          task.updatedAt = task.lastCompletedAt;
        }
        persist();
      };
    });
    list.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.closest('.task-card').dataset.id;
        data.cleaning.tasks = data.cleaning.tasks.filter(t => t.id !== id);
        persist();
      };
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function populateCategorySelects() {
    const opts = data.inventory.categories.map(c => `<option value="${c.id}">${c.icon || ''} ${c.name}</option>`).join('');
    document.getElementById('inv-category').innerHTML = '<option value="">全部分類</option>' + opts;
    document.getElementById('inv-cat-select').innerHTML = '<option value="">請選擇</option>' + opts;
  }

  function populateLocationDatalist() {
    const locs = [...new Set(data.inventory.items.map(i => i.location).filter(Boolean))];
    document.getElementById('location-datalist').innerHTML = locs.map(l => `<option value="${escapeHtml(l)}">`).join('');
  }

  function openModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.getElementById(id).onclick = () => closeModal(id);
  }

  function closeModal(id) {
    document.getElementById(id).style.display = 'none';
  }

  window.closeModal = closeModal;

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    };
  });

  document.getElementById('btn-add-inv').onclick = () => {
    populateLocationDatalist();
    document.getElementById('inv-name').value = '';
    document.getElementById('inv-cat-select').value = '';
    document.getElementById('inv-qty').value = '1';
    document.getElementById('inv-unit').value = '個';
    document.getElementById('inv-loc').value = '';
    document.getElementById('inv-min').value = '';
    document.getElementById('inv-expiry').value = '';
    openModal('modal-inv');
  };

  document.getElementById('btn-inv-submit').onclick = () => {
    const name = document.getElementById('inv-name').value.trim();
    const catId = document.getElementById('inv-cat-select').value;
    if (!name || !catId) return;
    data.inventory.items.push({
      id: generateId(),
      name,
      quantity: +document.getElementById('inv-qty').value || 1,
      unit: document.getElementById('inv-unit').value || '個',
      categoryId: catId,
      location: document.getElementById('inv-loc').value || '',
      minQuantity: document.getElementById('inv-min').value ? +document.getElementById('inv-min').value : undefined,
      expiryDate: document.getElementById('inv-expiry').value || undefined,
      updatedAt: new Date().toISOString(),
    });
    closeModal('modal-inv');
    persist();
  };

  let newCleanSubtasks = [];

  document.getElementById('btn-add-clean').onclick = () => {
    newCleanSubtasks = [];
    document.getElementById('clean-name').value = '';
    document.getElementById('clean-area').value = '';
    document.getElementById('clean-freq').value = 'weekly';
    document.getElementById('clean-subtask').value = '';
    document.getElementById('clean-custom-label').style.display = 'none';
    document.getElementById('clean-custom-days').style.display = 'none';
    renderCleanSubtaskList();
    openModal('modal-clean');
  };

  document.getElementById('clean-freq').onchange = () => {
    const isCustom = document.getElementById('clean-freq').value === 'custom';
    document.getElementById('clean-custom-label').style.display = isCustom ? 'block' : 'none';
    document.getElementById('clean-custom-days').style.display = isCustom ? 'block' : 'none';
  };

  function renderCleanSubtaskList() {
    const ul = document.getElementById('clean-subtask-list');
    ul.innerHTML = newCleanSubtasks.map((s, i) => `
      <li>${escapeHtml(s)} <button type="button" class="remove-sub" data-i="${i}">×</button></li>
    `).join('');
    ul.querySelectorAll('.remove-sub').forEach(btn => {
      btn.onclick = () => {
        newCleanSubtasks.splice(+btn.dataset.i, 1);
        renderCleanSubtaskList();
      };
    });
  }

  document.getElementById('btn-add-subtask').onclick = () => {
    const input = document.getElementById('clean-subtask');
    const val = input.value.trim();
    if (!val) return;
    newCleanSubtasks.push(val);
    input.value = '';
    renderCleanSubtaskList();
  };

  document.getElementById('clean-subtask').onkeydown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('btn-add-subtask').click();
    }
  };

  document.getElementById('btn-clean-submit').onclick = () => {
    const name = document.getElementById('clean-name').value.trim();
    if (!name) return;
    const freq = document.getElementById('clean-freq').value;
    const customDays = freq === 'custom' ? +document.getElementById('clean-custom-days').value : undefined;
    data.cleaning.tasks.push({
      id: generateId(),
      name,
      frequency: freq,
      customDays,
      area: document.getElementById('clean-area').value.trim() || undefined,
      subtasks: newCleanSubtasks.length ? newCleanSubtasks : undefined,
      updatedAt: new Date().toISOString(),
    });
    closeModal('modal-clean');
    persist();
  };

  document.getElementById('inv-search').oninput = renderInventory;
  document.getElementById('inv-category').onchange = renderInventory;
  document.getElementById('inv-location').oninput = renderInventory;
  document.getElementById('inv-low-stock').onchange = renderInventory;

  populateCategorySelects();
  renderAll();
})();
