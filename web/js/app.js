(function (global) {
  'use strict';

  var STORAGE_KEY = 'homemaker_v2_data';

  var FREQUENCY_LABELS = {
    daily: '每日',
    weekly: '每週',
    biweekly: '每兩週',
    monthly: '每月',
    quarterly: '每季',
    custom: '自訂',
  };

  var CATEGORY_ICONS = {
    'cat-1': 'fa-utensils',
    'cat-2': 'fa-pump-soap',
    'cat-3': 'fa-broom',
    'cat-4': 'fa-pills',
  };

  var defaultData = {
    inventory: {
      categories: [
        { id: 'cat-1', name: '食品', icon: 'fa-utensils' },
        { id: 'cat-2', name: '日用品', icon: 'fa-pump-soap' },
        { id: 'cat-3', name: '清潔用品', icon: 'fa-broom' },
        { id: 'cat-4', name: '藥品', icon: 'fa-pills' },
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

  var App = {
    state: {
      currentTab: 'dashboard',
      data: null,
      newCleanSubtasks: [],
      dialogCallback: null,
    },

    /* ========== Init ========== */

    init: function () {
      this.state.data = this.loadData();
      this.populateCategorySelects();
      this.bindEvents();
      this.renderAll();
    },

    /* ========== Data ========== */

    loadData: function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          var legacy = localStorage.getItem('homemaker-app-data');
          if (legacy) {
            var parsed = JSON.parse(legacy);
            var migrated = {
              inventory: {
                categories: (parsed.inventory && parsed.inventory.categories && parsed.inventory.categories.length)
                  ? parsed.inventory.categories.map(function (c) {
                    return { id: c.id, name: c.name, icon: CATEGORY_ICONS[c.id] || 'fa-box' };
                  })
                  : defaultData.inventory.categories,
                items: (parsed.inventory && parsed.inventory.items) || [],
              },
              cleaning: {
                tasks: (parsed.cleaning && parsed.cleaning.tasks && parsed.cleaning.tasks.length)
                  ? parsed.cleaning.tasks
                  : defaultData.cleaning.tasks,
              },
            };
            this.saveData(migrated);
            return migrated;
          }
          return JSON.parse(JSON.stringify(defaultData));
        }
        var data = JSON.parse(raw);
        return {
          inventory: {
            categories: (data.inventory && data.inventory.categories && data.inventory.categories.length)
              ? data.inventory.categories
              : defaultData.inventory.categories,
            items: (data.inventory && data.inventory.items) || [],
          },
          cleaning: {
            tasks: (data.cleaning && data.cleaning.tasks && data.cleaning.tasks.length)
              ? data.cleaning.tasks
              : defaultData.cleaning.tasks,
          },
        };
      } catch (e) {
        return JSON.parse(JSON.stringify(defaultData));
      }
    },

    saveData: function (d) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d || this.state.data));
    },

    persist: function () {
      this.saveData();
      this.renderAll();
    },

    /* ========== Utilities ========== */

    generateId: function () {
      return Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    },

    escapeHtml: function (s) {
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    },

    getFrequencyDays: function (freq, customDays) {
      var map = { daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 90 };
      return map[freq] || customDays || 7;
    },

    getNextDueDate: function (task) {
      var days = this.getFrequencyDays(task.frequency, task.customDays);
      var base = task.lastCompletedAt ? new Date(task.lastCompletedAt) : new Date();
      var next = new Date(base);
      next.setDate(next.getDate() + days);
      return next;
    },

    isOverdue: function (task) {
      return new Date() > this.getNextDueDate(task);
    },

    formatDate: function (d) {
      return d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    },

    /* ========== Navigation ========== */

    switchTab: function (tab) {
      this.state.currentTab = tab;
      var container = document.getElementById('app');
      container.setAttribute('data-current-tab', tab);

      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
      var target = document.getElementById('page-' + tab);
      if (target) target.classList.add('active');

      document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
      var navBtn = document.querySelector('.nav-item[data-tab="' + tab + '"]');
      if (navBtn) navBtn.classList.add('active');

      var titles = { dashboard: '居家管理', inventory: '存貨管理', cleaning: '清潔工作' };
      document.getElementById('header-title').textContent = titles[tab] || '居家管理';
    },

    /* ========== Rendering ========== */

    renderAll: function () {
      this.renderDashboard();
      this.renderInventory();
      this.renderCleaning();
    },

    renderDashboard: function () {
      var data = this.state.data;
      var self = this;

      var lowStock = data.inventory.items.filter(function (i) {
        return i.minQuantity != null && i.quantity < i.minQuantity;
      });
      var overdue = data.cleaning.tasks.filter(function (t) { return self.isOverdue(t); });
      var dueSoon = data.cleaning.tasks.filter(function (t) {
        if (self.isOverdue(t)) return false;
        var next = self.getNextDueDate(t);
        return (next.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 2;
      });

      document.getElementById('low-stock-count').textContent = lowStock.length;
      document.getElementById('overdue-count').textContent = overdue.length;
      document.getElementById('low-stock-label').textContent = lowStock.length + ' 項需補貨';
      document.getElementById('overdue-label').textContent = overdue.length + ' 項逾期';

      var lowList = document.getElementById('low-stock-list');
      if (lowStock.length === 0) {
        lowList.innerHTML = '<li class="muted-item">目前無需補貨項目</li>';
      } else {
        lowList.innerHTML = lowStock.map(function (i) {
          return '<li><i class="fas fa-circle"></i>' + self.escapeHtml(i.name) + '：' + i.quantity + ' ' + i.unit +
            (i.minQuantity != null ? ' <span class="min-qty-hint">（最低 ' + i.minQuantity + '）</span>' : '') + '</li>';
        }).join('');
      }

      var overdueList = document.getElementById('overdue-list');
      if (overdue.length === 0) {
        overdueList.innerHTML = '<li class="muted-item">無逾期清潔任務</li>';
      } else {
        overdueList.innerHTML = overdue.map(function (t) {
          return '<li><i class="fas fa-circle"></i>' + self.escapeHtml(t.name) + '</li>';
        }).join('');
      }

      var dueSoonList = document.getElementById('due-soon-list');
      if (dueSoon.length === 0) {
        dueSoonList.innerHTML = '<li class="muted-item">未來兩天內無清潔任務</li>';
      } else {
        dueSoonList.innerHTML = dueSoon.map(function (t) {
          return '<li><i class="fas fa-circle"></i>' + self.escapeHtml(t.name) + ' — ' + self.formatDate(self.getNextDueDate(t)) + '</li>';
        }).join('');
      }

      document.getElementById('stat-items').textContent = data.inventory.items.length;
      document.getElementById('stat-tasks').textContent = data.cleaning.tasks.length;
    },

    renderInventory: function () {
      var data = this.state.data;
      var self = this;

      var search = document.getElementById('inv-search').value.toLowerCase();
      var catFilter = document.getElementById('inv-category').value;
      var lowOnly = document.getElementById('inv-low-stock').checked;

      var filtered = data.inventory.items.filter(function (item) {
        if (catFilter && item.categoryId !== catFilter) return false;
        if (search && !item.name.toLowerCase().includes(search) && !(item.location || '').toLowerCase().includes(search)) return false;
        if (lowOnly && (item.minQuantity == null || item.quantity >= item.minQuantity)) return false;
        return true;
      });

      var list = document.getElementById('inv-list');
      list.innerHTML = '';

      filtered.forEach(function (item) {
        var cat = data.inventory.categories.find(function (c) { return c.id === item.categoryId; });
        var isLow = item.minQuantity != null && item.quantity < item.minQuantity;
        var card = document.createElement('div');
        card.className = 'item-card' + (isLow ? ' low-stock' : '');
        card.dataset.id = item.id;

        var expiryHtml = '';
        if (item.expiryDate) {
          var expDate = new Date(item.expiryDate);
          var daysUntil = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
          var expiryClass = daysUntil < 0 ? 'expired' : daysUntil <= 7 ? 'expiring-soon' : '';
          var expiryText = daysUntil < 0 ? '已過期' : daysUntil === 0 ? '今天到期' : daysUntil + ' 天後到期';
          expiryHtml = '<span class="item-expiry ' + expiryClass + '"><i class="fas fa-calendar-alt"></i> ' + expiryText + '</span>';
        }

        card.innerHTML =
          '<div class="item-card-header">' +
            '<div class="item-info">' +
              '<span class="item-cat"><i class="fas ' + (cat ? cat.icon : 'fa-box') + '"></i> ' + (cat ? self.escapeHtml(cat.name) : '') + '</span>' +
              '<div class="item-name">' + self.escapeHtml(item.name) + '</div>' +
            '</div>' +
            '<div class="item-card-actions">' +
              '<button class="item-action-btn edit-btn" data-action="edit" title="編輯"><i class="fas fa-pen"></i></button>' +
              '<button class="item-action-btn delete-btn" data-action="delete" title="刪除"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="item-details">' +
            '<span class="item-qty-display">' + item.quantity + ' ' + item.unit + '</span>' +
            (isLow ? '<span class="low-badge">需補貨</span>' : '') +
            (item.location ? '<span class="item-location"><i class="fas fa-map-marker-alt"></i> ' + self.escapeHtml(item.location) + '</span>' : '') +
            expiryHtml +
          '</div>' +
          '<div class="item-edit-row" style="display:none">' +
            '<input type="number" min="0" data-field="qty" value="' + item.quantity + '" placeholder="數量" />' +
            '<input type="text" data-field="loc" value="' + self.escapeHtml(item.location || '') + '" placeholder="位置" />' +
            '<button class="btn-done" data-action="done"><i class="fas fa-check"></i> 完成</button>' +
          '</div>';

        list.appendChild(card);
      });

      document.getElementById('inv-empty').style.display = filtered.length === 0 ? 'block' : 'none';

      var lowCount = data.inventory.items.filter(function (i) { return i.minQuantity != null && i.quantity < i.minQuantity; }).length;
      var badge = document.getElementById('inv-low-badge');
      badge.textContent = lowCount;
      badge.style.display = lowCount > 0 ? 'inline' : 'none';

      var pill = document.getElementById('inv-low-pill');
      if (lowOnly) { pill.classList.add('checked'); } else { pill.classList.remove('checked'); }

      var clearBtn = document.getElementById('inv-search-clear');
      if (search) { clearBtn.classList.add('visible'); } else { clearBtn.classList.remove('visible'); }

      self.bindInventoryActions();
    },

    bindInventoryActions: function () {
      var self = this;
      var list = document.getElementById('inv-list');

      list.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
        btn.onclick = function () {
          var card = btn.closest('.item-card');
          var editRow = card.querySelector('.item-edit-row');
          editRow.style.display = editRow.style.display === 'none' ? 'flex' : 'none';
        };
      });

      list.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.closest('.item-card').dataset.id;
          var item = self.state.data.inventory.items.find(function (i) { return i.id === id; });
          self.showDialog({
            icon: 'fa-trash-alt',
            iconType: 'danger',
            title: '確認刪除？',
            message: '確定要刪除「' + (item ? item.name : '') + '」嗎？此操作無法復原。',
            confirmText: '刪除',
            confirmType: 'danger',
            onConfirm: function () {
              self.state.data.inventory.items = self.state.data.inventory.items.filter(function (i) { return i.id !== id; });
              self.persist();
              self.showToast('已刪除', '品項已從庫存移除');
            }
          });
        };
      });

      list.querySelectorAll('[data-action="done"]').forEach(function (btn) {
        btn.onclick = function () {
          var card = btn.closest('.item-card');
          var id = card.dataset.id;
          var item = self.state.data.inventory.items.find(function (i) { return i.id === id; });
          if (item) {
            item.quantity = +card.querySelector('[data-field="qty"]').value;
            item.location = card.querySelector('[data-field="loc"]').value;
            item.updatedAt = new Date().toISOString();
          }
          self.persist();
          self.showToast('已更新', '品項資訊已儲存');
        };
      });
    },

    renderCleaning: function () {
      var data = this.state.data;
      var self = this;
      var list = document.getElementById('clean-list');
      list.innerHTML = '';

      data.cleaning.tasks.forEach(function (task) {
        var nextDue = self.getNextDueDate(task);
        var overdue = self.isOverdue(task);
        var card = document.createElement('div');
        card.className = 'task-card' + (overdue ? ' overdue' : '');
        card.dataset.id = task.id;

        var subtasksHtml = '';
        if (task.subtasks && task.subtasks.length) {
          subtasksHtml = '<ul class="task-subtasks">' +
            task.subtasks.map(function (s) {
              return '<li class="task-subtask-chip">' + self.escapeHtml(s) + '</li>';
            }).join('') + '</ul>';
        }

        card.innerHTML =
          '<div class="task-card-header">' +
            '<div class="task-info">' +
              '<h3 class="task-name">' + self.escapeHtml(task.name) +
                '<span class="task-freq-badge">' + (FREQUENCY_LABELS[task.frequency] || task.frequency) + '</span>' +
              '</h3>' +
              (task.area ? '<div class="task-area"><i class="fas fa-map-marker-alt"></i> ' + self.escapeHtml(task.area) + '</div>' : '') +
            '</div>' +
            '<div class="task-card-actions">' +
              '<button class="task-complete-btn" data-action="complete" title="完成"><i class="fas fa-check"></i></button>' +
              '<button class="task-delete-btn" data-action="delete" title="刪除"><i class="fas fa-trash-alt"></i></button>' +
            '</div>' +
          '</div>' +
          subtasksHtml +
          '<div class="task-dates">' +
            '<span class="task-date-item">' +
              '<i class="fas fa-history"></i> ' +
              (task.lastCompletedAt ? self.formatDate(new Date(task.lastCompletedAt)) : '尚未執行') +
            '</span>' +
            '<span class="task-date-item ' + (overdue ? 'overdue-text' : '') + '">' +
              '<i class="fas fa-arrow-right"></i> ' + self.formatDate(nextDue) +
            '</span>' +
          '</div>';

        list.appendChild(card);
      });

      document.getElementById('clean-empty').style.display = data.cleaning.tasks.length === 0 ? 'block' : 'none';

      self.bindCleaningActions();
    },

    bindCleaningActions: function () {
      var self = this;
      var list = document.getElementById('clean-list');

      list.querySelectorAll('[data-action="complete"]').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.closest('.task-card').dataset.id;
          var task = self.state.data.cleaning.tasks.find(function (t) { return t.id === id; });
          if (task) {
            task.lastCompletedAt = new Date().toISOString();
            task.updatedAt = task.lastCompletedAt;
          }
          self.persist();
          self.showToast('已完成', '「' + (task ? task.name : '') + '」已標記完成');
        };
      });

      list.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
        btn.onclick = function () {
          var id = btn.closest('.task-card').dataset.id;
          var task = self.state.data.cleaning.tasks.find(function (t) { return t.id === id; });
          self.showDialog({
            icon: 'fa-trash-alt',
            iconType: 'danger',
            title: '確認刪除？',
            message: '確定要刪除「' + (task ? task.name : '') + '」嗎？此操作無法復原。',
            confirmText: '刪除',
            confirmType: 'danger',
            onConfirm: function () {
              self.state.data.cleaning.tasks = self.state.data.cleaning.tasks.filter(function (t) { return t.id !== id; });
              self.persist();
              self.showToast('已刪除', '清潔任務已移除');
            }
          });
        };
      });
    },

    /* ========== Category Selects ========== */

    populateCategorySelects: function () {
      var data = this.state.data;
      var opts = data.inventory.categories.map(function (c) {
        return '<option value="' + c.id + '"><i class="fas ' + c.icon + '"></i> ' + c.name + '</option>';
      }).join('');
      document.getElementById('inv-category').innerHTML = '<option value="">全部分類</option>' + opts;
      document.getElementById('inv-cat-select').innerHTML = '<option value="">請選擇</option>' + opts;
    },

    populateLocationDatalist: function () {
      var locs = [];
      var seen = {};
      this.state.data.inventory.items.forEach(function (i) {
        if (i.location && !seen[i.location]) {
          seen[i.location] = true;
          locs.push(i.location);
        }
      });
      document.getElementById('location-datalist').innerHTML = locs.map(function (l) {
        return '<option value="' + App.escapeHtml(l) + '">';
      }).join('');
    },

    /* ========== Modals ========== */

    openModal: function (id) {
      var overlay = document.getElementById(id);
      overlay.style.display = 'flex';
      document.body.classList.add('body-locked');
      requestAnimationFrame(function () {
        overlay.classList.add('visible');
      });
      overlay.onclick = function () { App.closeModal(id); };
    },

    closeModal: function (id) {
      var overlay = document.getElementById(id);
      overlay.classList.remove('visible');
      document.body.classList.remove('body-locked');
      setTimeout(function () {
        overlay.style.display = 'none';
      }, 300);
    },

    /* ========== Dialog ========== */

    showDialog: function (opts) {
      var self = this;
      var overlay = document.getElementById('confirm-dialog');
      var iconEl = document.getElementById('dialog-icon');
      iconEl.className = 'dialog-icon ' + (opts.iconType || 'danger');
      iconEl.innerHTML = '<i class="fas ' + (opts.icon || 'fa-trash-alt') + '"></i>';
      document.getElementById('dialog-title').textContent = opts.title || '確認';
      document.getElementById('dialog-message').textContent = opts.message || '';

      var confirmBtn = document.getElementById('dialog-confirm');
      confirmBtn.textContent = opts.confirmText || '確認';
      confirmBtn.className = 'dialog-confirm ' + (opts.confirmType || 'danger');

      self.state.dialogCallback = opts.onConfirm || null;

      overlay.style.display = 'flex';
      requestAnimationFrame(function () {
        overlay.classList.add('visible');
      });
    },

    closeDialog: function () {
      var overlay = document.getElementById('confirm-dialog');
      overlay.classList.remove('visible');
      setTimeout(function () {
        overlay.style.display = 'none';
      }, 250);
      this.state.dialogCallback = null;
    },

    /* ========== Toast ========== */

    showToast: function (title, desc) {
      var pop = document.getElementById('success-pop');
      document.getElementById('toast-title').textContent = title || '完成';
      document.getElementById('toast-desc').textContent = desc || '';
      pop.classList.add('visible');
      setTimeout(function () {
        pop.classList.remove('visible');
      }, 1200);
    },

    /* ========== Subtask List (Clean modal) ========== */

    renderCleanSubtaskList: function () {
      var self = this;
      var ul = document.getElementById('clean-subtask-list');
      ul.innerHTML = this.state.newCleanSubtasks.map(function (s, i) {
        return '<li class="subtask-tag">' + self.escapeHtml(s) +
          ' <button type="button" class="subtask-remove" data-i="' + i + '"><i class="fas fa-times"></i></button></li>';
      }).join('');

      ul.querySelectorAll('.subtask-remove').forEach(function (btn) {
        btn.onclick = function () {
          self.state.newCleanSubtasks.splice(+btn.dataset.i, 1);
          self.renderCleanSubtaskList();
        };
      });
    },

    /* ========== Event Binding ========== */

    bindEvents: function () {
      var self = this;

      /* Navigation */
      document.querySelectorAll('.nav-item[data-tab]').forEach(function (btn) {
        btn.onclick = function () { self.switchTab(btn.dataset.tab); };
      });

      /* Search */
      document.getElementById('inv-search').oninput = function () { self.renderInventory(); };
      document.getElementById('inv-category').onchange = function () { self.renderInventory(); };

      document.getElementById('inv-search-clear').onclick = function () {
        document.getElementById('inv-search').value = '';
        self.renderInventory();
      };

      /* Low stock filter (pill toggle) */
      document.getElementById('inv-low-pill').onclick = function (e) {
        if (e.target.closest('.pill-badge')) return;
        var cb = document.getElementById('inv-low-stock');
        cb.checked = !cb.checked;
        self.renderInventory();
      };

      /* Add Inventory */
      document.getElementById('btn-add-inv').onclick = function () {
        self.populateLocationDatalist();
        document.getElementById('inv-name').value = '';
        document.getElementById('inv-cat-select').value = '';
        document.getElementById('inv-qty').value = '1';
        document.getElementById('inv-unit').value = '個';
        document.getElementById('inv-loc').value = '';
        document.getElementById('inv-min').value = '';
        document.getElementById('inv-expiry').value = '';
        self.openModal('modal-inv');
      };

      document.getElementById('btn-inv-cancel').onclick = function () { self.closeModal('modal-inv'); };

      document.getElementById('btn-inv-submit').onclick = function () {
        var name = document.getElementById('inv-name').value.trim();
        var catId = document.getElementById('inv-cat-select').value;
        if (!name || !catId) return;

        self.state.data.inventory.items.push({
          id: self.generateId(),
          name: name,
          quantity: +document.getElementById('inv-qty').value || 1,
          unit: document.getElementById('inv-unit').value || '個',
          categoryId: catId,
          location: document.getElementById('inv-loc').value || '',
          minQuantity: document.getElementById('inv-min').value ? +document.getElementById('inv-min').value : undefined,
          expiryDate: document.getElementById('inv-expiry').value || undefined,
          updatedAt: new Date().toISOString(),
        });

        self.closeModal('modal-inv');
        self.persist();
        self.showToast('新增成功', '「' + name + '」已加入庫存');
      };

      /* Add Cleaning */
      document.getElementById('btn-add-clean').onclick = function () {
        self.state.newCleanSubtasks = [];
        document.getElementById('clean-name').value = '';
        document.getElementById('clean-area').value = '';
        document.getElementById('clean-freq').value = 'weekly';
        document.getElementById('clean-subtask').value = '';
        document.getElementById('clean-custom-wrap').style.display = 'none';
        self.renderCleanSubtaskList();
        self.openModal('modal-clean');
      };

      document.getElementById('btn-clean-cancel').onclick = function () { self.closeModal('modal-clean'); };

      document.getElementById('clean-freq').onchange = function () {
        var isCustom = document.getElementById('clean-freq').value === 'custom';
        document.getElementById('clean-custom-wrap').style.display = isCustom ? 'block' : 'none';
      };

      document.getElementById('btn-add-subtask').onclick = function () {
        var input = document.getElementById('clean-subtask');
        var val = input.value.trim();
        if (!val) return;
        self.state.newCleanSubtasks.push(val);
        input.value = '';
        self.renderCleanSubtaskList();
      };

      document.getElementById('clean-subtask').onkeydown = function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('btn-add-subtask').click();
        }
      };

      document.getElementById('btn-clean-submit').onclick = function () {
        var name = document.getElementById('clean-name').value.trim();
        if (!name) return;
        var freq = document.getElementById('clean-freq').value;
        var customDays = freq === 'custom' ? +document.getElementById('clean-custom-days').value : undefined;

        self.state.data.cleaning.tasks.push({
          id: self.generateId(),
          name: name,
          frequency: freq,
          customDays: customDays,
          area: document.getElementById('clean-area').value.trim() || undefined,
          subtasks: self.state.newCleanSubtasks.length ? self.state.newCleanSubtasks.slice() : undefined,
          updatedAt: new Date().toISOString(),
        });

        self.closeModal('modal-clean');
        self.persist();
        self.showToast('新增成功', '「' + name + '」已加入清潔任務');
      };

      /* Dialog buttons */
      document.getElementById('dialog-cancel').onclick = function () { self.closeDialog(); };
      document.getElementById('dialog-confirm').onclick = function () {
        if (self.state.dialogCallback) self.state.dialogCallback();
        self.closeDialog();
      };
      document.getElementById('confirm-dialog').onclick = function () { self.closeDialog(); };
    },
  };

  global.App = App;

  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });

})(window);
