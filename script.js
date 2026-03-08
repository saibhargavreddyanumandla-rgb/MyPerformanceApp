// Daily Performance Tracker - Main Script

// Status values
const STATUS = {
  COMPLETED: 'completed',
  HALF_DONE: 'half-done',
  NOT_DONE: 'not-done',
};

// Application state
let currentDate = new Date();
let chartInstances = {};
let currentStreak = 0;

// Initialize app when script loads (DOM is already loaded since script is at bottom)
initializeToday();
setupEventListeners();
renderToday();
renderHistory();
updateDashboard();

// ===== INITIALIZATION =====
function initializeToday() {
  loadStreak();
  updateStreakDisplay();
  loadTheme();
}

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Date navigation
  document.getElementById('prev-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    renderToday();
  });

  document.getElementById('next-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    renderToday();
  });

  // Add task
  document.getElementById('add-task-btn').addEventListener('click', addNewTask);
  document.getElementById('task-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewTask();
  });

  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetAllTasks);

  // Theme selector
  document.getElementById('theme-select').addEventListener('change', (e) => {
    const theme = e.target.value;
    applyTheme(theme);
    localStorage.setItem('selectedTheme', theme);
  });
}

// ===== THEME MANAGEMENT =====
function loadTheme() {
  const theme = localStorage.getItem('selectedTheme') || 'soft-gradient';
  document.getElementById('theme-select').value = theme;
  applyTheme(theme);
}

function applyTheme(theme) {
  if (theme === 'soft-gradient') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', theme);
  }
}

// ===== TAB MANAGEMENT =====
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Update dashboard when switching to it
  if (tabName === 'dashboard') {
    updateDashboard();
  }
}

// ===== TODAY'S TASKS =====
function addNewTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();

  if (!text) return;

  const dateStr = getDateString(currentDate);
  if (dateStr !== getDateString(new Date())) return; // Only allow for today

  let tasks = getTasksForDate(dateStr) || [];

  const newTask = {
    id: Date.now(),
    text: text,
    status: STATUS.NOT_DONE,
  };

  tasks.push(newTask);
  saveTasksForDate(dateStr, tasks);

  // Add to master if not already there
  const master = getMasterTasks();
  if (!master.includes(text)) {
    master.push(text);
    saveMasterTasks(master);
  }

  input.value = '';
  input.focus();
  renderToday();
  updateDashboard();
  calculateStreak();
}

function renderToday() {
  const dateStr = getDateString(currentDate);
  const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
  const day = currentDate.getDate();

  // Update date display
  const today = new Date();
  const todayStr = getDateString(today);
  const isToday = dateStr === todayStr;
  const isFuture = dateStr > todayStr;
  const isPast = dateStr < todayStr;
  const canEdit = isToday;
  document.getElementById('current-date').textContent = isToday
    ? 'Today'
    : `${weekday}, ${month} ${day}`;

  // Disable input for non-today dates
  document.getElementById('task-input').disabled = !canEdit;
  document.getElementById('add-task-btn').disabled = !canEdit;
  document.getElementById('reset-btn').disabled = !canEdit;

  // Set message
  let message = '';
  if (isFuture) message = 'You cannot complete tasks for future days.';
  else if (isPast) message = 'This is a past day, tasks are view-only.';
  document.getElementById('date-message').textContent = message;

  // Load tasks
  let tasks = getTasksForDate(dateStr) || [];

  // If no tasks for today or future, load from master
  if (!tasks && currentDate >= new Date()) {
    const master = getMasterTasks();
    if (master.length > 0) {
      tasks = master.map(text => ({
        id: Date.now() + Math.random(),
        text: text,
        status: STATUS.NOT_DONE,
      }));
      if (isToday) {
        saveTasksForDate(dateStr, tasks); // Save for today
      }
      // For future, don't save, just display
    }
  }

  // Render tasks
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    taskList.innerHTML = '<p class="empty-message">No tasks yet. Add one to get started!</p>';
  } else {
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';

      const left = document.createElement('div');
      left.className = 'task-left';

      const label = document.createElement('span');
      label.className = `task-label ${task.status}`;
      label.textContent = task.text;

      left.appendChild(label);

      const statusBtns = document.createElement('div');
      statusBtns.className = 'task-status-btns';

      // Completed button
      const completedBtn = document.createElement('button');
      completedBtn.className = `status-btn ${task.status === STATUS.COMPLETED ? 'completed' : ''}`;
      completedBtn.textContent = '✅ Done';
      completedBtn.addEventListener('click', () => updateTaskStatus(dateStr, task.id, STATUS.COMPLETED));

      // Half Done button
      const halfDoneBtn = document.createElement('button');
      halfDoneBtn.className = `status-btn ${task.status === STATUS.HALF_DONE ? 'half-done' : ''}`;
      halfDoneBtn.textContent = '⚠️ Half';
      halfDoneBtn.addEventListener('click', () => updateTaskStatus(dateStr, task.id, STATUS.HALF_DONE));

      // Not Done button
      const notDoneBtn = document.createElement('button');
      notDoneBtn.className = `status-btn ${task.status === STATUS.NOT_DONE ? 'not-done' : ''}`;
      notDoneBtn.textContent = '❌ Todo';
      notDoneBtn.addEventListener('click', () => updateTaskStatus(dateStr, task.id, STATUS.NOT_DONE));

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = 'Delete task';
      deleteBtn.addEventListener('click', () => deleteTask(dateStr, task.id));

      statusBtns.appendChild(completedBtn);
      statusBtns.appendChild(halfDoneBtn);
      statusBtns.appendChild(notDoneBtn);
      statusBtns.appendChild(deleteBtn);

      if (!canEdit) {
        completedBtn.disabled = true;
        halfDoneBtn.disabled = true;
        notDoneBtn.disabled = true;
        deleteBtn.disabled = true;
      }

      li.appendChild(left);
      li.appendChild(statusBtns);
      taskList.appendChild(li);
    });
  }

  updateProgress();
}

function updateTaskStatus(dateStr, taskId, newStatus) {
  if (dateStr !== getDateString(new Date())) return; // Only allow for today

  let tasks = getTasksForDate(dateStr);
  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, status: newStatus } : t
  );
  saveTasksForDate(dateStr, tasks);
  renderToday();
  updateDashboard();
  calculateStreak();
}

function deleteTask(dateStr, taskId) {
  if (dateStr !== getDateString(new Date())) return; // Only allow for today

  let tasks = getTasksForDate(dateStr);
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasksForDate(dateStr, tasks);
  renderToday();
  updateDashboard();
  calculateStreak(); // Recalculate streak when task is deleted
}

function resetAllTasks() {
  const dateStr = getDateString(currentDate);

  saveTasksForDate(dateStr, []);
  renderToday();
  updateDashboard();
  calculateStreak(); // Recalculate streak when tasks are reset
}

function updateProgress() {
  const dateStr = getDateString(currentDate);
  const tasks = getTasksForDate(dateStr) || [];
  const completed = tasks.filter(t => t.status === STATUS.COMPLETED).length;
  const total = tasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById('progress-fill').style.width = percentage + '%';
  document.getElementById('progress-text').textContent = percentage + '% completed';
  document.getElementById('count-text').textContent = `${completed} / ${total}`;
}

// ===== DASHBOARD =====
function updateDashboard() {
  updateCharts();
  updateStats();
}

function updateCharts() {
  updatePieChart();
  updateBarChart();
}

function getOverallStats() {
  let stats = {
    completed: 0,
    halfDone: 0,
    notDone: 0,
  };

  const allDates = getAllStoredDates();
  allDates.forEach(dateStr => {
    const tasks = getTasksForDate(dateStr);
    if (tasks) {
      tasks.forEach(task => {
        if (task.status === STATUS.COMPLETED) stats.completed++;
        else if (task.status === STATUS.HALF_DONE) stats.halfDone++;
        else if (task.status === STATUS.NOT_DONE) stats.notDone++;
      });
    }
  });

  return stats;
}

function updatePieChart() {
  const stats = getOverallStats();
  const ctx = document.getElementById('pie-chart')?.getContext('2d');

  if (!ctx) return;

  if (chartInstances.pie) {
    chartInstances.pie.destroy();
  }

  chartInstances.pie = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Half Done', 'Not Done'],
      datasets: [
        {
          data: [stats.completed, stats.halfDone, stats.notDone],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderColor: ['#047857', '#d97706', '#dc2626'],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: {
              size: 14,
              weight: '600',
            },
          },
        },
      },
    },
  });
}

function getLast7DaysData() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = getDateString(date);
    const tasks = getTasksForDate(dateStr);
    const completed = tasks
      ? tasks.filter(t => t.status === STATUS.COMPLETED).length
      : 0;
    data.push({
      date: dateStr,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed,
    });
  }
  return data;
}

function updateBarChart() {
  const last7Days = getLast7DaysData();
  const ctx = document.getElementById('bar-chart')?.getContext('2d');

  if (!ctx) return;

  if (chartInstances.bar) {
    chartInstances.bar.destroy();
  }

  chartInstances.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last7Days.map(d => d.label),
      datasets: [
        {
          label: 'Completed Tasks',
          data: last7Days.map(d => d.completed),
          backgroundColor: '#4f46e5',
          borderColor: '#3730a3',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function updateStats() {
  const stats = getOverallStats();
  document.getElementById('total-completed').textContent = stats.completed;
  document.getElementById('total-half-done').textContent = stats.halfDone;
  document.getElementById('total-not-done').textContent = stats.notDone;
}

// ===== HISTORY =====
function renderHistory() {
  const allDates = getAllStoredDates().reverse(); // Most recent first

  if (allDates.length === 0) {
    document.getElementById('history-list').innerHTML = '<p class="empty-message">No task history yet</p>';
    return;
  }

  document.getElementById('history-list').innerHTML = '';

  allDates.forEach(dateStr => {
    const tasks = getTasksForDate(dateStr);
    if (!tasks || tasks.length === 0) return;

    const historyDay = document.createElement('div');
    historyDay.className = 'history-day';

    const dateObj = new Date(dateStr + 'T00:00:00');
    const dateDisplay = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const dateTitle = document.createElement('div');
    dateTitle.className = 'history-date';
    dateTitle.textContent = dateDisplay;
    historyDay.appendChild(dateTitle);

    const tasksList = document.createElement('ul');
    tasksList.className = 'history-tasks';

    tasks.forEach(task => {
      const taskItem = document.createElement('li');
      taskItem.className = `history-task ${task.status}`;
      const statusEmoji =
        task.status === STATUS.COMPLETED
          ? '✅'
          : task.status === STATUS.HALF_DONE
          ? '⚠️'
          : '❌';
      taskItem.textContent = `${statusEmoji} ${task.text}`;
      tasksList.appendChild(taskItem);
    });

    historyDay.appendChild(tasksList);
    document.getElementById('history-list').appendChild(historyDay);
  });
}

// ===== LOCAL STORAGE HELPERS =====
function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTasksForDate(dateStr) {
  const key = `tasks_${dateStr}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

function saveTasksForDate(dateStr, tasks) {
  const key = `tasks_${dateStr}`;
  localStorage.setItem(key, JSON.stringify(tasks));
}

function getMasterTasks() {
  const data = localStorage.getItem('master_tasks');
  return data ? JSON.parse(data) : [];
}

function saveMasterTasks(tasks) {
  localStorage.setItem('master_tasks', JSON.stringify(tasks));
}

function getAllStoredDates() {
  const dates = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('tasks_')) {
      const dateStr = key.replace('tasks_', '');
      dates.push(dateStr);
    }
  }
  return dates.sort().reverse();
}

// ===== STREAK MANAGEMENT =====
function loadStreak() {
  const streak = localStorage.getItem('performance_streak');
  currentStreak = streak ? parseInt(streak) : 0;
}

function saveStreak() {
  localStorage.setItem('performance_streak', currentStreak.toString());
}

function calculateStreak() {
  const allDates = getAllStoredDates().sort(); // Sort chronologically
  let streak = 0;
  let foundBreak = false;

  // Check from most recent backwards
  for (let i = allDates.length - 1; i >= 0; i--) {
    const dateStr = allDates[i];
    const tasks = getTasksForDate(dateStr);

    if (!tasks || tasks.length === 0) continue;

    const completedTasks = tasks.filter(t => t.status === STATUS.COMPLETED).length;
    const completionRate = completedTasks / tasks.length;

    // Consider it a good day if 70% or more tasks are completed
    if (completionRate >= 0.7) {
      streak++;
    } else {
      // If we find a bad day, stop counting
      break;
    }
  }

  currentStreak = streak;
  saveStreak();
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const streakElement = document.getElementById('streak-number');
  if (streakElement) {
    streakElement.textContent = currentStreak;
  }
}
