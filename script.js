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
const extractButton = document.getElementById("extract-button");

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatJapaneseDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function createPrintTable(date) {
  const dateKey = getDateKey(date);

  const records = JSON.parse(
    localStorage.getItem(`activity-record:${dateKey}`) || "[]"
  );

  let rows = "";

  for (let hour = 0; hour < 24; hour++) {
    const activity = records[hour]?.activity || "";
    const mood = records[hour]?.mood || "";

    rows += `
      <tr>
        <td class="hour-cell">${hour}時</td>
        <td class="activity-cell">${escapeHtml(activity)}</td>
        <td class="mood-cell">${escapeHtml(mood)}</td>
      </tr>
    `;
  }

  return `
    <section class="day-record">
      <h2>${formatJapaneseDate(date)}</h2>

      <table>
        <thead>
          <tr>
            <th class="hour-cell">時刻</th>
            <th class="activity-cell">活動記録</th>
            <th class="mood-cell">気分</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function extractFourDays() {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("印刷画面を開けませんでした。ポップアップを許可してください。");
    return;
  }

  let fourDaysHtml = "";

  /*
   選択中の日付からさかのぼって4日分を作成
   例：24日を選択している場合は21日～24日
  */
  for (let amount = 3; amount >= 0; amount--) {
    const targetDate = new Date(selectedDate);
    targetDate.setDate(targetDate.getDate() - amount);
    fourDaysHtml += createPrintTable(targetDate);
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>活動記録表</title>

      <style>
        @page {
          size: A4 landscape;
          margin: 8mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          color: #000;
          font-family: Arial, "Noto Sans JP", sans-serif;
        }

        .print-title {
          margin: 0 0 5mm;
          color: #156385;
          font-size: 22px;
          text-align: center;
        }

        .four-days {
          display: grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 4mm;
          align-items: start;
          padding-right: 1mm;
        }

        .day-record {
          min-width: 0;
        }

        .day-record h2 {
          margin: 0 0 2mm;
          font-size: 12px;
          text-align: center;
        }

        table {
          width: calc(100% - 0.5mm);
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 7px;
        }

        th,
        td {
          height: 6.5mm;
          padding: 0.5mm 1mm;
          overflow-wrap: anywhere;
          border: 0.3mm solid #777;
          vertical-align: middle;
        }

        th {
          height: 7mm;
          background: #156385;
          color: white;
          font-size: 8px;
          text-align: center;
        }

        tbody tr:nth-child(even) {
          background: #e6e9ec;
        }

        tbody tr:nth-child(odd) {
          background: #f4f6f7;
        }

        .hour-cell {
          width: 12%;
          text-align: center;
          white-space: nowrap;
        }

        .activity-cell {
          width: 70%;
          white-space: pre-wrap;
        }

        .mood-cell {
          width: 18%;
          text-align: center;
        }

        @media print {
          .four-days {
            break-inside: avoid;
          }

          .day-record {
            break-inside: avoid;
          }
        }
      </style>
    </head>

    <body>
      <h1 class="print-title">活動記録表</h1>

      <main class="four-days">
        ${fourDaysHtml}
      </main>

      <script>
        window.onload = function () {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

extractButton.addEventListener("click", extractFourDays);