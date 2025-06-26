const calendar = document.getElementById("calendarGrid");
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Pusty narożnik (lewy górny)
calendar.appendChild(document.createElement("div"));

const todayIndex = (new Date().getDay() + 6) % 7;

// Dodaj nagłówki dni tygodnia
days.forEach((day, index) => {
  const header = document.createElement("div");
  header.className = "day-header";
  header.textContent = day;
  if (index === todayIndex) {
    header.classList.add("today-marker");
  }
  calendar.appendChild(header);
});

// Dodaj godziny i sloty czasowe
for (let hour = 0; hour < 25; hour++) {
  const hourCell = document.createElement("div");
  hourCell.className = "hour-cell";
  hourCell.textContent = hour.toString().padStart(2, "0") + ":00";
  calendar.appendChild(hourCell);

  for (let d = 0; d < 7; d++) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    calendar.appendChild(slot);
  }
}


// ————— FORMULARZ —————
const eventForm = document.getElementById("eventForm");
const eventFormElement = document.getElementById("eventFormElement");
let selectedDayIndex = null;

// Otwórz formularz dla wybranego dnia
function openEventForm(dayIndex) {
  selectedDayIndex = dayIndex;
  eventForm.classList.remove("hidden");
  eventForm.querySelector('input[name="title"]').focus();
}

// Zamknij formularz i wyczyść
function closeEventForm() {
  eventForm.classList.add("hidden");
  eventFormElement.reset();
}

// Kliknięcie poza modal-content → zamknij
eventForm.addEventListener("click", e => {
  if (e.target === eventForm) {
    closeEventForm();
  }
});

// Zatwierdź przez Enter (submit)
eventFormElement.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(eventFormElement);
  createEvent(
    data.get("title"),
    data.get("start"),
    data.get("end"),
    selectedDayIndex
  );
  closeEventForm();
});


// ————— HOVER i CLICK na slot —————
let hoveredIdx = null;

calendar.addEventListener("mouseover", e => {
  if (!e.target.classList.contains("time-slot")) return;
  hoveredIdx = getDayColumnIndex(e.target);
  toggleHighlight(hoveredIdx, true);
});

calendar.addEventListener("mouseout", e => {
  if (hoveredIdx === null) return;
  toggleHighlight(hoveredIdx, false);
  hoveredIdx = null;
});

calendar.addEventListener("click", e => {
  if (!e.target.classList.contains("time-slot")) return;
  openEventForm(getDayColumnIndex(e.target));
});

// Oblicz indeks kolumny (0–6)
function getDayColumnIndex(el) {
  const slots = Array.from(calendar.querySelectorAll(".time-slot"));
  const idx = slots.indexOf(el);
  return idx !== -1 ? idx % 7 : null;
}

// Włącz/wyłącz klasę hover na całej kolumnie slotów
function toggleHighlight(dayIndex, on) {
  const slots = calendar.querySelectorAll(".time-slot");
  for (let i = dayIndex; i < slots.length; i += 7) {
    slots[i].classList.toggle("hovered", on);
  }
}


// ————— TWORZENIE WYDARZENIA —————
function createEvent(title, startTime, endTime, dayIndex) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const duration = endMin - startMin;
  if (duration <= 0) return;

  const rowHeight = 30; // px na godzinę
  const top = (startMin / 60) * rowHeight;
  const height = (duration / 60) * rowHeight;

  const eventEl = document.createElement("div");
  eventEl.className = "calendar-event";
  eventEl.textContent = title;
  eventEl.style.top = `${top}px`;
  eventEl.style.height = `${height}px`;
  eventEl.style.left = `calc(60px + ${(100 / 7) * dayIndex}% )`;
  eventEl.style.width = `calc(${100 / 7}% - 2px)`;

  calendar.appendChild(eventEl);
}
