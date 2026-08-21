const table = document.getElementById("record-table");
const dateDisplay = document.getElementById("current-date");
const saveButton = document.getElementById("save-button");
let selectedDate = new Date();

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createRows() {
  for (let hour = 0; hour < 24; hour++) {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
    <label class="hour" for="activity-${hour}">${hour}時</label>
    <textarea id="activity-${hour}" class="activity-input" aria-label="${hour}時の活動" rows="1"></textarea>
    <select class="mood-select" aria-label="${hour}時の気分">
        <option value="">―</option>
        <option value="3">+3</option><option value="2">+2</option>
        <option value="1">+1</option><option value="0">0</option>
        <option value="-1">-1</option><option value="-2">-2</option>
        <option value="-3">-3</option>
      </select>`;
    table.appendChild(row);
  }
}

function showDate() {
  dateDisplay.value = getDateKey(selectedDate);
}

function resizeActivityInput(input) {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
}

function loadRecord() {
  showDate();
  const saved = JSON.parse(localStorage.getItem(`activity-record:${getDateKey(selectedDate)}`) || "[]");
  document.querySelectorAll(".table-row").forEach((row, hour) => {
    const activityInput = row.querySelector(".activity-input");

    activityInput.value = saved[hour]?.activity || "";
    row.querySelector(".mood-select").value = saved[hour]?.mood || "";

    resizeActivityInput(activityInput);
  });
  saveButton.textContent = "記録をつける";
}

function saveRecord() {
  const rows = [...document.querySelectorAll(".table-row")].map(row => ({
    activity: row.querySelector(".activity-input").value,
    mood: row.querySelector(".mood-select").value
  }));
  localStorage.setItem(`activity-record:${getDateKey(selectedDate)}`, JSON.stringify(rows));
  saveButton.textContent = "記録しました";
  setTimeout(() => saveButton.textContent = "記録をつける", 1800);
}

function moveDate(amount) {
  selectedDate.setDate(selectedDate.getDate() + amount);
  loadRecord();
}

document.getElementById("prev-date").addEventListener("click", () => moveDate(-1));
document.getElementById("next-date").addEventListener("click", () => moveDate(1));
saveButton.addEventListener("click", saveRecord);
table.addEventListener("input", event => {
  if (event.target.classList.contains("activity-input")) {
    resizeActivityInput(event.target);
  }
});
dateDisplay.addEventListener("change", () => {
  if (!dateDisplay.value) return;

  const [year, month, day] = dateDisplay.value.split("-").map(Number);
  selectedDate = new Date(year, month - 1, day);
  loadRecord();
});


createRows();
loadRecord();
