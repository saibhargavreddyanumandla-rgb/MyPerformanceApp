// script.js - Logic for Performance Task App
// Uses localStorage to persist tasks across page reloads.

const STORAGE_KEY = 'performanceTasks';

// In-memory list of tasks
let tasks = [];

// DOM references
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const countText = document.getElementById('count-text');

// Load tasks from localStorage
function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Failed to parse tasks from localStorage', e);
    tasks = [];
  }
}

// Save tasks to localStorage
function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Create a DOM node for a task and attach handlers
function createTaskNode(task){
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' task-completed' : '');

  const left = document.createElement('div');
  left.className = 'task-left';

  // Checkbox (click toggles completion)
  const checkbox = document.createElement('button');
  checkbox.className = 'task-checkbox';
  checkbox.setAttribute('aria-pressed', String(task.completed));
  checkbox.title = task.completed ? 'Mark as incomplete' : 'Mark as completed';
  checkbox.innerHTML = task.completed ? '✓' : '';
  checkbox.addEventListener('click', () => toggleTask(task.id));

  const label = document.createElement('span');
  label.className = 'task-label';
  label.textContent = task.text;

  left.appendChild(checkbox);
  left.appendChild(label);

  // Delete button
  const del = document.createElement('button');
  del.className = 'delete-btn';
  del.textContent = 'Delete';
  del.addEventListener('click', () => deleteTask(task.id));

  li.appendChild(left);
  li.appendChild(del);
  return li;
}

// Render all tasks into the list
function renderTasks(){
  list.innerHTML = '';
  tasks.forEach(task => {
    const node = createTaskNode(task);
    list.appendChild(node);
  });
  updateProgress();
}

// Add a new task
function addTask(text){
  const trimmed = text.trim();
  if(!trimmed) return;
  const task = {id: Date.now(), text: trimmed, completed: false};
  tasks.unshift(task); // newest on top
  saveTasks();
  renderTasks();
}

// Toggle the completed state of a task
function toggleTask(id){
  tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t);
  saveTasks();
  renderTasks();
}

// Delete a task
function deleteTask(id){
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
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
