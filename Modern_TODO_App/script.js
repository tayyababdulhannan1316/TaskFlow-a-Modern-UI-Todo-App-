// TaskFlow - Modern Todo App with LocalStorage

// DOM Elements
const elements = {
  currentTime: document.getElementById("currentTime"),
  statTotal: document.getElementById("statTotal"),
  statPending: document.getElementById("statPending"),
  statInProgress: document.getElementById("statInProgress"),
  statCompleted: document.getElementById("statCompleted"),
  searchInput: document.getElementById("searchInput"),
  filterStatus: document.getElementById("filterStatus"),
  filterPriority: document.getElementById("filterPriority"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  emptyAddBtn: document.getElementById("emptyAddBtn"),
  errorMessage: document.getElementById("errorMessage"),
  errorText: document.getElementById("errorText"),
  errorClose: document.getElementById("errorClose"),
  loadingState: document.getElementById("loadingState"),
  emptyState: document.getElementById("emptyState"),
  emptyTitle: document.getElementById("emptyTitle"),
  emptyMessage: document.getElementById("emptyMessage"),
  tasksList: document.getElementById("tasksList"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalTitle: document.getElementById("modalTitle"),
  modalClose: document.getElementById("modalClose"),
  taskForm: document.getElementById("taskForm"),
  cancelBtn: document.getElementById("cancelBtn"),
  submitBtn: document.getElementById("submitBtn"),
  taskTitle: document.getElementById("taskTitle"),
  taskLocation: document.getElementById("taskLocation"),
  taskDescription: document.getElementById("taskDescription"),
  taskStatus: document.getElementById("taskStatus"),
  taskPriority: document.getElementById("taskPriority"),
  taskDueDate: document.getElementById("taskDueDate"),
};

// State
let todos = [];
let editingTodoId = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateTime();
  setInterval(updateTime, 1000);
  setupEventListeners();
  loadTodos();
});

// Update time display
function updateTime() {
  const now = new Date();
  elements.currentTime.innerHTML = `
    <div class="date">${now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })}</div>
    <div class="time">${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}</div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  elements.addTaskBtn.addEventListener("click", () => openModal());
  elements.emptyAddBtn.addEventListener("click", () => openModal());
  elements.modalClose.addEventListener("click", closeModal);
  elements.cancelBtn.addEventListener("click", closeModal);
  elements.modalOverlay.addEventListener("click", (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });
  elements.taskForm.addEventListener("submit", handleSubmit);
  elements.searchInput.addEventListener("input", renderTodos);
  elements.filterStatus.addEventListener("change", renderTodos);
  elements.filterPriority.addEventListener("change", renderTodos);
  elements.errorClose.addEventListener("click", hideError);
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load todos from localStorage
function loadTodos() {
  showLoading(true);
  try {
    const stored = localStorage.getItem("taskflow_todos");
    todos = stored ? JSON.parse(stored) : [];
    renderTodos();
  } catch (err) {
    showError("Failed to load tasks");
    todos = [];
  } finally {
    showLoading(false);
  }
}

// Save todos to localStorage
function saveTodos() {
  try {
    localStorage.setItem("taskflow_todos", JSON.stringify(todos));
  } catch (err) {
    showError("Failed to save tasks");
  }
}

// Render todos
function renderTodos() {
  const searchQuery = elements.searchInput.value.toLowerCase();
  const filterStatus = elements.filterStatus.value;
  const filterPriority = elements.filterPriority.value;

  // Filter todos
  const filtered = todos.filter((todo) => {
    const matchesSearch =
      todo.title.toLowerCase().includes(searchQuery) ||
      (todo.description || "").toLowerCase().includes(searchQuery) ||
      (todo.location || "").toLowerCase().includes(searchQuery);
    const matchesStatus =
      filterStatus === "all" || todo.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || todo.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Update stats
  updateStats();

  // Show empty state or tasks
  if (filtered.length === 0) {
    elements.tasksList.innerHTML = "";
    elements.emptyState.classList.add("show");
    elements.emptyTitle.textContent =
      todos.length === 0 ? "No tasks yet" : "No matching tasks";
    elements.emptyMessage.textContent =
      todos.length === 0
        ? "Create your first task to get started"
        : "Try adjusting your filters or search query";
    elements.emptyAddBtn.style.display =
      todos.length === 0 ? "inline-flex" : "none";
  } else {
    elements.emptyState.classList.remove("show");
    elements.tasksList.innerHTML = filtered
      .map((todo, index) => createTodoCard(todo, index))
      .join("");

    // Add event listeners to task cards
    elements.tasksList.querySelectorAll(".task-checkbox").forEach((btn) => {
      btn.addEventListener("click", () => toggleStatus(btn.dataset.id));
    });
    elements.tasksList.querySelectorAll(".btn-icon.edit").forEach((btn) => {
      btn.addEventListener("click", () => openModal(btn.dataset.id));
    });
    elements.tasksList.querySelectorAll(".btn-icon.delete").forEach((btn) => {
      btn.addEventListener("click", () => deleteTodo(btn.dataset.id));
    });
  }
}

window.onload = () => {
  let year = new Date().getFullYear();
  document.getElementById("year").innerHTML = year;
};

// Create todo card HTML
function createTodoCard(todo, index) {
  const statusClass =
    todo.status === "in-progress" ? "in-progress" : todo.status;
  const isCompleted = todo.status === "completed";

  return `
    <div class="task-card ${isCompleted ? "completed" : ""} animate-slide-up" style="animation-delay: ${index * 50}ms">
      <div class="task-header">
        <button class="task-checkbox ${isCompleted ? "checked" : ""}" data-id="${todo.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <div class="task-content">
          <div class="task-top">
            <h3 class="task-title">${escapeHtml(todo.title)}</h3>
            <span class="status-badge ${statusClass}">
              ${todo.status === "in-progress" ? "In Progress" : capitalize(todo.status)}
            </span>
          </div>
          ${todo.description ? `<p class="task-description">${escapeHtml(todo.description)}</p>` : ""}
          <div class="task-meta">
            <div class="meta-item">
              <span class="priority-dot ${todo.priority}"></span>
              <span>${capitalize(todo.priority)} priority</span>
            </div>
            ${
              todo.location
                ? `
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${escapeHtml(todo.location)}</span>
              </div>
            `
                : ""
            }
            ${
              todo.due_date
                ? `
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>${formatDate(todo.due_date)}</span>
              </div>
            `
                : ""
            }
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Created ${formatDate(todo.created_at)}</span>
            </div>
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon edit" data-id="${todo.id}" title="Edit task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon delete" data-id="${todo.id}" title="Delete task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Update statistics
function updateStats() {
  elements.statTotal.textContent = todos.length;
  elements.statPending.textContent = todos.filter(
    (t) => t.status === "pending",
  ).length;
  elements.statInProgress.textContent = todos.filter(
    (t) => t.status === "in-progress",
  ).length;
  elements.statCompleted.textContent = todos.filter(
    (t) => t.status === "completed",
  ).length;
}

// Open modal
function openModal(todoId = null) {
  editingTodoId = todoId;

  if (todoId) {
    const todo = todos.find((t) => t.id === todoId);
    if (todo) {
      elements.modalTitle.textContent = "Edit Task";
      elements.taskTitle.value = todo.title;
      elements.taskLocation.value = todo.location || "";
      elements.taskDescription.value = todo.description || "";
      elements.taskStatus.value = todo.status;
      elements.taskPriority.value = todo.priority;
      elements.taskDueDate.value = todo.due_date || "";
      elements.submitBtn.querySelector(".btn-text").textContent = "Update Task";
    }
  } else {
    elements.modalTitle.textContent = "New Task";
    elements.taskForm.reset();
    elements.taskPriority.value = "medium";
    elements.submitBtn.querySelector(".btn-text").textContent = "Create Task";
  }

  elements.modalOverlay.classList.add("show");
  elements.taskTitle.focus();
}

// Close modal
function closeModal() {
  elements.modalOverlay.classList.remove("show");
  editingTodoId = null;
}

// Handle form submit
function handleSubmit(e) {
  e.preventDefault();

  const title = elements.taskTitle.value.trim();
  const location = elements.taskLocation.value.trim() || null;
  const description = elements.taskDescription.value.trim() || null;
  const status = elements.taskStatus.value;
  const priority = elements.taskPriority.value;
  const dueDate = elements.taskDueDate.value || null;

  if (!title) {
    showError("Please enter a task title");
    return;
  }

  setButtonLoading(true);

  try {
    if (editingTodoId) {
      // Update existing todo
      todos = todos.map((t) => {
        if (t.id === editingTodoId) {
          return {
            ...t,
            title,
            location,
            description,
            status,
            priority,
            due_date: dueDate,
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
    } else {
      // Create new todo
      const newTodo = {
        id: generateId(),
        title,
        location,
        description,
        status,
        priority,
        due_date: dueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      todos.unshift(newTodo);
    }

    saveTodos();
    renderTodos();
    closeModal();
  } catch (err) {
    showError(err.message || "Failed to save task");
  } finally {
    setButtonLoading(false);
  }
}

// Toggle todo status
function toggleStatus(todoId) {
  const todo = todos.find((t) => t.id === todoId);
  if (!todo) return;

  const newStatus = todo.status === "completed" ? "pending" : "completed";

  todos = todos.map((t) => {
    if (t.id === todoId) {
      return { ...t, status: newStatus, updated_at: new Date().toISOString() };
    }
    return t;
  });

  saveTodos();
  renderTodos();
}

// Delete todo
function deleteTodo(todoId) {
  todos = todos.filter((t) => t.id !== todoId);
  saveTodos();
  renderTodos();
}

// Helper functions
function showLoading(show) {
  elements.loadingState.style.display = show ? "flex" : "none";
}

function showError(message) {
  elements.errorText.textContent = message;
  elements.errorMessage.classList.add("show");
}

function hideError() {
  elements.errorMessage.classList.remove("show");
}

function setButtonLoading(loading) {
  const btnText = elements.submitBtn.querySelector(".btn-text");
  const btnLoading = elements.submitBtn.querySelector(".btn-loading");
  elements.submitBtn.disabled = loading;
  btnText.style.display = loading ? "none" : "inline";
  btnLoading.style.display = loading ? "inline-flex" : "none";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// document.getElementById("addTaskButton").style.display = "inline-block";
// document.getElementById("updateTaskButton").style.display = "none";

// // Toastify Custom Function
// function showNotification(msg = "notification message", type) {
//   let bgcolor;
//   switch (type) {
//     case "success":
//       bgcolor = "linear-gradient(to right, #1d976c, #93f9b9)";
//       break;
//     case "error":
//       bgcolor = "linear-gradient(to right, #93291e, #ed213a)";
//       break;
//     default:
//       bgcolor = "#000";
//       break;
//   }
//   Toastify({
//     text: msg,
//     duration: 3000,
//     close: true,
//     gravity: "bottom",
//     position: "left",
//     stopOnFocus: true,
//     style: { background: bgcolor },
//   }).showToast();
// }

// function User(title, location, description) {
//   this.title = title;
//   this.location = location;
//   this.description = description;
// }
// function showToast(type, message) {
//   Swal.fire({
//     icon: type, // success, error, warning, info, question
//     title: message,
//     toast: true,
//     position: "top-end",
//     showConfirmButton: false,
//     timer: 2000,
//   });
// }

// function Clear_Result() {
//   document.getElementById("output").innerHTML = "";
// }

// function ShowOutput(html) {
//   document.getElementById("output").innerHTML = html;
// }

// function getFieldValue(fieldID) {
//   return document.getElementById(fieldID).value;
// }

// function getRandomID() {
//   return (
//     Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
//   );
// }

// const askNameFromUser = () => {
//   let userName = prompt("Please enter your Name");

//   document.getElementById("userName").innerHTML =
//     "Hi! " + "<b>" + userName + "</b>";
// };

// const emptyFieldValues = () => {
//   document.getElementById("taskTitle").value = "";
//   document.getElementById("taskLocation").value = "";
//   document.getElementById("taskDescription").value = "";
// };

// const setFieldValues = (fieldID, value) => {
//   return (document.getElementById(fieldID).value = value);
// };

// window.onload = () => {
//   setInterval(() => {
//     document.getElementById("currentTime").innerHTML = dayjs().format(
//       "dddd, MMMM DD YYYY, hh:mm:ss A",
//     );
//   }, 500);
//   let year = new Date().getFullYear();
//   document.getElementById("year").innerHTML = year;
//   // askNameFromUser();
// };

// function handleSubmit() {
//   event.preventDefault();
//   let title = getFieldValue("taskTitle"),
//     location = getFieldValue("taskLocation"),
//     description = getFieldValue("taskDescription");

//   if (!title || !location || !description) {
//     return showNotification("Please fill all fields.", "error");
//   }

//   title = title.trim();
//   location = location.trim();
//   description = description.trim();

//   if (title.length < 3) {
//     return showNotification(
//       "Title must be at least 3 characters long.",
//       "error",
//     );
//   }

//   if (location.length < 3) {
//     return showNotification(
//       "Location must be at least 3 characters long.",
//       "error",
//     );
//   }

//   if (description.length < 10) {
//     return showNotification(
//       "Description must be at least 10 characters long.",
//       "error",
//     );
//   }

//   // let todo = new User(title, location, description);
//   let todo = { title, location, description };

//   todo.id = getRandomID();
//   todo.dateCreated = new Date().getTime();
//   todo.status = "Pending";

//   const todos = JSON.parse(localStorage.getItem("todos")) || [];
//   console.log("Before Adding todo");
//   console.log(todos);
//   todos.push(todo);
//   localStorage.setItem("todos", JSON.stringify(todos));
//   console.log("After Adding todo");
//   console.log(todos);

//   showNotification("Task added successfully!", "success");

//   showToDos();
//   emptyFieldValues();
// }

// function showToDos() {
//   // Clear_Result();

//   const todos = JSON.parse(localStorage.getItem("todos")) || [];

//   if (!todos.length) {
//     ShowOutput(
//       "<h5>HURRAY! No tasks is avialable. Press a task button to add your task</h5>",
//     );
//     return;
//   }

//   // let tableStartingCode ='<div class="table-responsive"><table class="tabel">';
//   // let tableEndingCode='</table></div>';

//   // let tableHead='<thead><tr><th scope="col">#</th><th scope="col">Title</th><th scope="col">Location</th><th scope="col"> Description </th><th scope="col">Action</th></tr></thead>'

//   let tableBody = "";

//   for (let i = 0; i < todos.length; i++) {
//     let todo = todos[i];
//     tableBody += `<tr>
//     <th scope="row" >${i + 1}</th>
//     <td >${todo.title}</td>
//     <td>${todo.location}</td>
//     <td>${todo.description}</td>
//     <td>
//     <button class="btn btn-sm btn-info mb-2 me-0 me-md-1 mb-md-0 " data-value="${
//       todo.id
//     }" onclick="editTodo(event)"><i data-value="${
//       todo.id
//     }" class="fa-solid fa-pen" ></i>
//     </button>
//     <button class="btn btn-sm btn-danger " data-value="${todo.id}"
//     onclick="deleteTodo(event)"><i data-value="${todo.id}"
//     class="fa-solid fa-trash" style="color: #fff;"></i>
//     </button>
//     </td>
//     </tr>`;
//   }

//   let table = `<table class="table"">
//     <thead>
//         <tr>
//         <th scope="col">#</th>
//         <th scope="col">Title</th>
//         <th scope="col">Location</th>
//         <th scope="col">Description</th>
//         <th scope="col">Action</th>
//         </tr>
//         <tbody> ${tableBody} </tbody>
//     </thead>
//     </table>`;

//   ShowOutput(table);
// }

// const editTodo = (event) => {
//   let todoID = event.target.getAttribute("data-value");
//   // console.log('todoID :>> ', todoID);
//   //   console.log(event.target.getAttribute("data-value"));

//   const todos = JSON.parse(localStorage.getItem("todos"));

//   let todo = todos.find((todo) => {
//     return todo.id === todoID;
//   });

//   const { title, location, description } = todo;

//   setFieldValues("taskTitle", title);
//   setFieldValues("taskLocation", location);
//   setFieldValues("taskDescription", description);

//   localStorage.setItem("todosForEdit", JSON.stringify(todo));

//   document.getElementById("addTaskButton").style.display = "none";
//   document.getElementById("showTaskButton").style.display = "none";
//   document.getElementById("updateTaskButton").style.display = "inline-block";
// };

// const handleEdit = () => {
//   const todosForEdit = JSON.parse(localStorage.getItem("todosForEdit"));

//   let updatedTitle = getFieldValue("taskTitle");
//   let updatedLocation = getFieldValue("taskLocation");
//   let updatedDescription = getFieldValue("taskDescription");

//   const updatedTodo = {
//     ...todosForEdit,
//     title: updatedTitle,
//     location: updatedLocation,
//     description: updatedDescription,
//   };
//   updatedTodo.dateModified = new Date().getTime();

//   const todos = JSON.parse(localStorage.getItem("todos"));

//   let todoAfterUpdate = todos.map((todo) => {
//     if (todo.id === todosForEdit.id) {
//       return updatedTodo;
//     }
//     return todo;
//   });

//   localStorage.setItem("todos", JSON.stringify(todoAfterUpdate));

//   showToast("info", "Task updated successfully!");

//   showToDos();
//   emptyFieldValues();

//   document.getElementById("addTaskButton").style.display = "inline-block";
//   document.getElementById("updateTaskButton").style.display = "none";
// };

// const deleteTodo = (event) => {
//   let todoID = event.target.getAttribute("data-value");

//   const todos = JSON.parse(localStorage.getItem("todos"));

//   let todoAfterDelete = todos.filter((todo) => {
//     return todo.id !== todoID;
//   });

//   // console.log(todo)
//   // return;

//   localStorage.setItem("todos", JSON.stringify(todoAfterDelete));

//   showToast("success", "Task deleted! successfully.");
//   showToDos();
// };
