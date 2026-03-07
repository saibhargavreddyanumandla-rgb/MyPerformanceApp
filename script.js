// Daily Performance Tracker - Main Script

// Fixed list of daily tasks
const FIXED_TASKS = [
  { id: 1, text: 'Morning Exercise', emoji: '🏃' },
  { id: 2, text: 'Review Goals', emoji: '🎯' },
  { id: 3, text: 'Deep Work (2 hours)', emoji: '💻' },
  { id: 4, text: 'Read 20 minutes', emoji: '📚' },
  { id: 5, text: 'Learn Something New', emoji: '🧠' },
  { id: 6, text: 'Reflect & Journal', emoji: '📝' },
  { id: 7, text: 'Rest & Recharge', emoji: '😴' },
];

// Status values
const STATUS = {
  COMPLETED: 'completed',
  HALF_DONE: 'half-done',
  NOT_DONE: 'not-done',
};

// Application state
let currentDate = new Date();
let chartInstances = {};

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
  initializePush();
  setupEventListeners();
  renderToday();
  renderHistory();
  updateDashboard();
});

// ===== INITIALIZATION =====
function initializePush() {
  const today = getDateString(new Date());
  if (!getTasksForDate(today)) {
    saveTasksForDate(today, initializeTodaysTasks());
  }
}

function initializeTodaysTasks() {
  return FIXED_TASKS.map(task => ({
    ...task,
    status: STATUS.NOT_DONE,
  }));
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

  // Reset button
  document.getElementById('reset-btn').addEventListener('click', resetAllTasks);
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
function renderToday() {
  const dateStr = getDateString(currentDate);
  const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
  const month = currentDate.toLocaleDateString('en-US', { month: 'short' });
  const day = currentDate.getDate();

  // Update date display
  const isToday = getDateString(new Date()) === dateStr;
  document.getElementById('current-date').textContent = isToday
    ? 'Today'
    : `${weekday}, ${month} ${day}`;

  // Load or initialize tasks
  let tasks = getTasksForDate(dateStr);
  if (!tasks) {
    tasks = initializeTodaysTasks();
    saveTasksForDate(dateStr, tasks);
  }

  // Render tasks
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = '';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';

    const left = document.createElement('div');
    left.className = 'task-left';

    const label = document.createElement('span');
    label.className = `task-label ${task.status}`;
    label.textContent = `${task.emoji} ${task.text}`;

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

    statusBtns.appendChild(completedBtn);
    statusBtns.appendChild(halfDoneBtn);
    statusBtns.appendChild(notDoneBtn);

    li.appendChild(left);
    li.appendChild(statusBtns);
    taskList.appendChild(li);
  });

  updateProgress();
}

function updateTaskStatus(dateStr, taskId, newStatus) {
  let tasks = getTasksForDate(dateStr);
  tasks = tasks.map(t =>
    t.id === taskId ? { ...t, status: newStatus } : t
  );
  saveTasksForDate(dateStr, tasks);
  renderToday();
  updateDashboard();
}

function resetAllTasks() {
  const dateStr = getDateString(currentDate);
  const tasks = initializeTodaysTasks();
  saveTasksForDate(dateStr, tasks);
  renderToday();
  updateDashboard();
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
      indexAxis: 'x',
      scales: {
        y: {
          beginAtZero: true,
          max: FIXED_TASKS.length,
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
    if (!tasks) return;

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

// Update progress bar and text
function updateProgress(){
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressFill.style.width = percent + '%';
  progressText.textContent = `${percent}% completed`;
  countText.textContent = `${completed} / ${total}`;
}

// Form submit handler: add task
form.addEventListener('submit', (e) => {
  e.preventDefault();
  addTask(input.value);
  input.value = '';
  input.focus();
});

// Initialize app
function init(){
  loadTasks();
  renderTasks();
}

init();

// Expose helpers for debugging (optional)
// window.__tasks = tasks;
