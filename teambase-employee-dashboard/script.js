/* ---------------------------------------------------
   TeamBase — Employee Directory
   Vanilla JS admin dashboard: CRUD + search + filter +
   sort, persisted to localStorage.
--------------------------------------------------- */

const STORAGE_KEY = "teambase_employees";

const seedData = [
  { id: 1, name: "Priya Nair",      email: "priya.nair@company.com",     department: "Engineering", role: "Frontend Developer", status: "Active",   joined: "2023-02-14" },
  { id: 2, name: "Arjun Mehta",     email: "arjun.mehta@company.com",    department: "Engineering", role: "Backend Developer",  status: "Active",   joined: "2022-11-02" },
  { id: 3, name: "Sara Fernandes",  email: "sara.f@company.com",         department: "Design",      role: "UI/UX Designer",     status: "On Leave", joined: "2023-06-19" },
  { id: 4, name: "Rohan Verma",     email: "rohan.verma@company.com",    department: "Sales",       role: "Sales Executive",    status: "Active",   joined: "2021-09-30" },
  { id: 5, name: "Kavya Iyer",      email: "kavya.iyer@company.com",     department: "HR",          role: "HR Manager",         status: "Active",   joined: "2020-04-11" },
  { id: 6, name: "Dev Chauhan",     email: "dev.chauhan@company.com",    department: "Engineering", role: "QA Engineer",        status: "Inactive", joined: "2022-01-25" },
];

// ---------- State ----------
let employees = [];
let editingId = null;
let deletingId = null;

// ---------- DOM refs ----------
const tableBody     = document.getElementById("tableBody");
const emptyState    = document.getElementById("emptyState");
const searchInput   = document.getElementById("searchInput");
const deptFilter    = document.getElementById("deptFilter");
const statusFilter  = document.getElementById("statusFilter");
const sortSelect    = document.getElementById("sortSelect");

const statTotal  = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDept   = document.getElementById("statDept");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle   = document.getElementById("modalTitle");
const employeeForm = document.getElementById("employeeForm");
const formError    = document.getElementById("formError");
const submitBtn    = document.getElementById("submitBtn");
const deptList     = document.getElementById("deptList");

const deleteOverlay = document.getElementById("deleteOverlay");
const deleteName    = document.getElementById("deleteName");

// ---------- Persistence ----------
function loadEmployees() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    employees = raw ? JSON.parse(raw) : seedData;
  } catch (e) {
    employees = seedData;
  }
  if (!localStorage.getItem(STORAGE_KEY)) saveEmployees();
}

function saveEmployees() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
}

function nextId() {
  return employees.length ? Math.max(...employees.map(e => e.id)) + 1 : 1;
}

// ---------- Rendering ----------
function getFilteredEmployees() {
  const query = searchInput.value.trim().toLowerCase();
  const dept = deptFilter.value;
  const status = statusFilter.value;
  const sort = sortSelect.value;

  let list = employees.filter(emp => {
    const matchesQuery =
      !query ||
      emp.name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query);
    const matchesDept = dept === "all" || emp.department === dept;
    const matchesStatus = status === "all" || emp.status === status;
    return matchesQuery && matchesDept && matchesStatus;
  });

  list.sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "joined-desc") return new Date(b.joined) - new Date(a.joined);
    if (sort === "joined-asc") return new Date(a.joined) - new Date(b.joined);
    return 0;
  });

  return list;
}

function statusPillClass(status) {
  if (status === "Active") return "pill-active";
  if (status === "On Leave") return "pill-leave";
  return "pill-inactive";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function render() {
  const list = getFilteredEmployees();

  tableBody.innerHTML = "";
  emptyState.hidden = list.length !== 0;

  list.forEach(emp => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="cell-id">#${String(emp.id).padStart(3, "0")}</td>
      <td class="cell-name">${escapeHtml(emp.name)}</td>
      <td class="cell-email">${escapeHtml(emp.email)}</td>
      <td>${escapeHtml(emp.department)}</td>
      <td>${escapeHtml(emp.role)}</td>
      <td><span class="pill ${statusPillClass(emp.status)}">${emp.status}</span></td>
      <td class="cell-joined">${formatDate(emp.joined)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" data-id="${emp.id}" aria-label="Edit ${escapeHtml(emp.name)}">
            <svg viewBox="0 0 20 20" fill="none"><path d="M13.5 3.5l3 3L7 16l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
          </button>
          <button class="icon-btn" data-action="delete" data-id="${emp.id}" aria-label="Delete ${escapeHtml(emp.name)}">
            <svg viewBox="0 0 20 20" fill="none"><path d="M4 6h12M8 6V4.5h4V6M6 6l.6 10.5A1.5 1.5 0 008.1 18h3.8a1.5 1.5 0 001.5-1.5L14 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  updateStats();
  updateDeptOptions();
}

function updateStats() {
  statTotal.textContent = employees.length;
  statActive.textContent = employees.filter(e => e.status === "Active").length;
  statDept.textContent = new Set(employees.map(e => e.department)).size;
}

function updateDeptOptions() {
  const depts = [...new Set(employees.map(e => e.department))].sort();

  const currentFilter = deptFilter.value;
  deptFilter.innerHTML = `<option value="all">All departments</option>` +
    depts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");
  deptFilter.value = depts.includes(currentFilter) ? currentFilter : "all";

  deptList.innerHTML = depts.map(d => `<option value="${escapeHtml(d)}">`).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Modal: Add / Edit ----------
function openModal(emp = null) {
  deleteOverlay.hidden = true;
  editingId = emp ? emp.id : null;
  modalTitle.textContent = emp ? "Edit Employee" : "Add Employee";
  submitBtn.textContent = emp ? "Save Changes" : "Add Employee";
  formError.hidden = true;

  document.getElementById("empId").value = emp ? emp.id : "";
  document.getElementById("empName").value = emp ? emp.name : "";
  document.getElementById("empEmail").value = emp ? emp.email : "";
  document.getElementById("empDept").value = emp ? emp.department : "";
  document.getElementById("empRole").value = emp ? emp.role : "";
  document.getElementById("empStatus").value = emp ? emp.status : "Active";
  document.getElementById("empJoined").value = emp ? emp.joined : new Date().toISOString().slice(0, 10);

  modalOverlay.hidden = false;
  document.getElementById("empName").focus();
}

function closeModal() {
  modalOverlay.hidden = true;
  employeeForm.reset();
  editingId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("empName").value.trim();
  const email = document.getElementById("empEmail").value.trim();
  const department = document.getElementById("empDept").value.trim();
  const role = document.getElementById("empRole").value.trim();
  const status = document.getElementById("empStatus").value;
  const joined = document.getElementById("empJoined").value;

  const duplicate = employees.find(
    emp => emp.email.toLowerCase() === email.toLowerCase() && emp.id !== editingId
  );
  if (duplicate) {
    formError.textContent = "An employee with this email already exists.";
    formError.hidden = false;
    return;
  }

  if (editingId) {
    const emp = employees.find(e => e.id === editingId);
    Object.assign(emp, { name, email, department, role, status, joined });
  } else {
    employees.push({ id: nextId(), name, email, department, role, status, joined });
  }

  saveEmployees();
  render();
  closeModal();
}

// ---------- Delete flow ----------
function openDeleteConfirm(id) {
  const emp = employees.find(e => e.id === id);
  if (!emp) return;
  modalOverlay.hidden = true;
  deletingId = id;
  deleteName.textContent = emp.name;
  deleteOverlay.hidden = false;
}

function closeDeleteConfirm() {
  deleteOverlay.hidden = true;
  deletingId = null;
}

function confirmDelete() {
  employees = employees.filter(e => e.id !== deletingId);
  saveEmployees();
  render();
  closeDeleteConfirm();
}

// ---------- Event wiring ----------
document.getElementById("openAddBtn").addEventListener("click", () => openModal());
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });

employeeForm.addEventListener("submit", handleFormSubmit);

document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteConfirm);
document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
deleteOverlay.addEventListener("click", e => { if (e.target === deleteOverlay) closeDeleteConfirm(); });

tableBody.addEventListener("click", e => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.action === "edit") {
    openModal(employees.find(emp => emp.id === id));
  } else if (btn.dataset.action === "delete") {
    openDeleteConfirm(id);
  }
});

searchInput.addEventListener("input", render);
deptFilter.addEventListener("change", render);
statusFilter.addEventListener("change", render);
sortSelect.addEventListener("change", render);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (!modalOverlay.hidden) closeModal();
    if (!deleteOverlay.hidden) closeDeleteConfirm();
  }
});

// ---------- Init ----------
loadEmployees();
render();
