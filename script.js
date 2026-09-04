const table = document.getElementById("record-table");
const dateDisplay = document.getElementById("current-date");
const saveButton = document.getElementById("save-button");
const extractButton = document.getElementById("extract-button");

let selectedDate = new Date();

/* 日付を「2026-08-31」の形式にする */
function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* 「2026-08-31」をDateオブジェクトへ変換する */
function parseDate(dateString) {
  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/* 24時間分の入力欄とメモ欄を作る */
function createRows() {
  for (let hour = 0; hour < 24; hour++) {
    const row = document.createElement("div");
    row.className = "table-row";

    row.innerHTML = `
      <label class="hour" for="activity-${hour}">
        ${hour}時
      </label>

      <textarea
        id="activity-${hour}"
        class="activity-input"
        aria-label="${hour}時の活動"
        rows="1"
      ></textarea>

      <select
        class="mood-select"
        aria-label="${hour}時の気分"
      >
        <option value="">―</option>
        <option value="3">+3</option>
        <option value="2">+2</option>
        <option value="1">+1</option>
        <option value="0">0</option>
        <option value="-1">-1</option>
        <option value="-2">-2</option>
        <option value="-3">-3</option>
      </select>
    `;

    table.appendChild(row);
  }

  const memoRow = document.createElement("div");
  memoRow.className = "memo-row";

  memoRow.innerHTML = `
    <label class="memo-label" for="daily-memo">
      メモ
    </label>

    <textarea
      id="daily-memo"
      class="daily-memo"
      rows="4"
      placeholder="自由に入力できます"
    ></textarea>
  `;

  table.appendChild(memoRow);
}

/* 選択中の日付を日付入力欄に表示する */
function showDate() {
  dateDisplay.value = getDateKey(selectedDate);
}

/* 活動記録欄の高さを入力内容に合わせる */
function resizeActivityInput(input) {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
}

/* 選択している日付の記録を読み込む */
function loadRecord() {
  showDate();

  const dateKey = getDateKey(selectedDate);

  const savedRecords = JSON.parse(
    localStorage.getItem(`activity-record:${dateKey}`) || "[]"
  );

  document.querySelectorAll(".table-row").forEach((row, hour) => {
    const activityInput = row.querySelector(".activity-input");
    const moodSelect = row.querySelector(".mood-select");

    activityInput.value = savedRecords[hour]?.activity || "";
    moodSelect.value = savedRecords[hour]?.mood || "";

    resizeActivityInput(activityInput);
  });

  const savedMemo =
    localStorage.getItem(`activity-memo:${dateKey}`) || "";

  document.getElementById("daily-memo").value = savedMemo;

  saveButton.textContent = "記録をつける";
}

/* 選択している日付の記録を保存する */
function saveRecord() {
  const dateKey = getDateKey(selectedDate);

  const rows = [
    ...document.querySelectorAll(".table-row")
  ].map(row => ({
    activity: row.querySelector(".activity-input").value,
    mood: row.querySelector(".mood-select").value
  }));

  localStorage.setItem(
    `activity-record:${dateKey}`,
    JSON.stringify(rows)
  );

  const memo = document.getElementById("daily-memo").value;

  localStorage.setItem(
    `activity-memo:${dateKey}`,
    memo
  );

  saveButton.textContent = "記録しました";

  setTimeout(() => {
    saveButton.textContent = "記録をつける";
  }, 1800);
}

/* 前日または翌日に移動する */
function moveDate(amount) {
  selectedDate.setDate(selectedDate.getDate() + amount);
  loadRecord();
}

/* HTMLとして特殊な文字を安全に表示する */
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* 日付を日本語表示にする */
function formatJapaneseDate(date) {
  return (
    `${date.getFullYear()}年` +
    `${date.getMonth() + 1}月` +
    `${date.getDate()}日`
  );
}

/* 1日分の印刷用の表を作る */
function createPrintTable(date) {
  const dateKey = getDateKey(date);

  const records = JSON.parse(
    localStorage.getItem(`activity-record:${dateKey}`) || "[]"
  );

  const memo =
    localStorage.getItem(`activity-memo:${dateKey}`) || "";

  let rows = "";

  for (let hour = 0; hour < 24; hour++) {
    const activity = records[hour]?.activity || "";
    const mood = records[hour]?.mood || "";

    rows += `
      <tr>
        <td class="hour-cell">
          ${hour}時
        </td>

        <td class="activity-cell">
          ${escapeHtml(activity)}
        </td>

        <td class="mood-cell">
          ${escapeHtml(mood)}
        </td>
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

      <div class="print-memo">
        <div class="print-memo-title">
          メモ
        </div>

        <div class="print-memo-text">
          ${escapeHtml(memo) || "　"}
        </div>
      </div>
    </section>
  `;
}

/* 指定期間の日付一覧を作る */
function createDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/* 4日ごとに印刷ページを作る */
function createPrintPages(dates) {
  let pagesHtml = "";

  for (let index = 0; index < dates.length; index += 4) {
    const fourDays = dates.slice(index, index + 4);

    const tablesHtml = fourDays
      .map(date => createPrintTable(date))
      .join("");

    pagesHtml += `
      <main class="four-days">
        ${tablesHtml}
      </main>
    `;
  }

  return pagesHtml;
}

/* 印刷する期間を入力して抽出する */
function extractPeriod() {
  const defaultEndDate = getDateKey(selectedDate);

  const defaultStart = new Date(selectedDate);
  defaultStart.setDate(defaultStart.getDate() - 3);
  const defaultStartDate = getDateKey(defaultStart);

  const startInput = prompt(
    "印刷する期間の開始日を入力してください。\n例：2026-08-01",
    defaultStartDate
  );

  if (startInput === null) {
    return;
  }

  const startDate = parseDate(startInput.trim());

  if (!startDate) {
    alert(
      "開始日を正しく入力してください。\n" +
      "例：2026-08-01"
    );
    return;
  }

  const endInput = prompt(
    "印刷する期間の終了日を入力してください。\n例：2026-08-31",
    defaultEndDate
  );

  if (endInput === null) {
    return;
  }

  const endDate = parseDate(endInput.trim());

  if (!endDate) {
    alert(
      "終了日を正しく入力してください。\n" +
      "例：2026-08-31"
    );
    return;
  }

  if (startDate > endDate) {
    alert(
      "開始日は、終了日以前の日付にしてください。"
    );
    return;
  }

  const dates = createDateRange(startDate, endDate);
  const printPagesHtml = createPrintPages(dates);

  const oldPrintFrame =
    document.getElementById("print-frame");

  if (oldPrintFrame) {
    oldPrintFrame.remove();
  }

  const printFrame = document.createElement("iframe");
  printFrame.id = "print-frame";
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "1px";
  printFrame.style.height = "1px";
  printFrame.style.border = "0";
  printFrame.style.opacity = "0";

  document.body.appendChild(printFrame);

  const printWindow = printFrame.contentWindow;

  printWindow.document.open();
  printWindow.document.write(`

    <!DOCTYPE html>
    <html lang="ja">

    <head>
      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

      <title>活動記録表</title>

      <style>
        @page {
          size: A4 landscape;
          margin: 8mm;
        }

        * {
          box-sizing: border-box;
        }

        html {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        body {
          margin: 0;
          color: #000;
          font-family: Arial, "Noto Sans JP", sans-serif;
        }

        .four-days {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4mm;
          align-items: start;
          height: 185mm;
          padding-right: 1mm;
          break-after: page;
          page-break-after: always;
        }

        .four-days:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        .day-record {
          min-width: 0;
          break-inside: avoid;
          page-break-inside: avoid;
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
          height: 5.5mm;
          max-height: 5.5mm;
          padding: 0.25mm 1mm;
          line-height: 1.15;
          overflow-wrap: anywhere;
          border: 0.3mm solid #777;
          vertical-align: middle;
        }

        th {
          height: 6mm;
          max-height: 6mm;
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
          width: 16%;
          text-align: center;
          white-space: nowrap;
        }

        .activity-cell {
          width: 66%;
          white-space: pre-wrap;
        }

        .mood-cell {
          width: 18%;
          text-align: center;
        }

        .print-memo {
          display: grid;
          grid-template-columns: 16% 84%;
          width: calc(100% - 0.5mm);
          min-height: 10mm;
          margin-top: 1mm;
          border: 0.3mm solid #777;
          background: white;
          font-size: 7px;
        }

        .print-memo-title {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1mm;
          border-right: 0.3mm solid #777;
          background: #cdd3d8;
          font-weight: 700;
          text-align: center;
        }

        .print-memo-text {
          min-width: 0;
          min-height: 10mm;
          padding: 1mm;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        @media print {
          .four-days {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .day-record {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>

    <body>
      ${printPagesHtml}

      <script>
        window.onload = function () {
          window.onafterprint = function () {
            if (window.frameElement) {
              window.frameElement.remove();
            }
          };

          window.focus();
          window.print();
        };
      <\/script>
    </body>

    </html>
  `);

  printWindow.document.close();
}

/* 日付移動 */
document
  .getElementById("prev-date")
  .addEventListener("click", () => {
    moveDate(-1);
  });

document
  .getElementById("next-date")
  .addEventListener("click", () => {
    moveDate(1);
  });

/* 記録ボタン */
saveButton.addEventListener("click", saveRecord);

/* 活動記録欄の自動拡大 */
table.addEventListener("input", event => {
  if (event.target.classList.contains("activity-input")) {
    resizeActivityInput(event.target);
  }
});

/* 日付入力欄 */
dateDisplay.addEventListener("change", () => {
  if (!dateDisplay.value) {
    return;
  }

  const newDate = parseDate(dateDisplay.value);

  if (!newDate) {
    return;
  }

  selectedDate = newDate;
  loadRecord();
});

/* 抽出ボタン */
extractButton.addEventListener("click", extractPeriod);

/* 最初の画面を作る */
createRows();
loadRecord();