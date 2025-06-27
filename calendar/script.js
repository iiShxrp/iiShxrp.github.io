const calendar = document.getElementById("calendarGrid");
const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
const events = [];

// Nagłówki dni
calendar.appendChild(Object.assign(document.createElement("div"), { className: "day-header" }));
const todayIndex = (new Date().getDay() + 6) % 7;
days.forEach((day, i) => {
  const hdr = document.createElement("div");
  hdr.className = "day-header";
  hdr.textContent = day;
  if (i === todayIndex) hdr.classList.add("today-marker");
  calendar.appendChild(hdr);
});

// Wiersze godzinowe i sloty
for (let h = 0; h < 24; h++) {
  const hourCell = document.createElement("div");
  hourCell.className = "hour-cell";
  hourCell.textContent = h.toString().padStart(2, "0") + ":00";
  calendar.appendChild(hourCell);

  for (let d = 0; d < 7; d++) {
    const slot = document.createElement("div");
    slot.className = "time-slot";
    slot.dataset.day = d;
    slot.dataset.hour = h;
    calendar.appendChild(slot);
  }
}

// Formularz
const eventForm = document.getElementById("eventForm");
const eventFormElement = document.getElementById("eventFormElement");
let selectedDay = null;

// Otwieranie / zamykanie modal
calendar.addEventListener("click", e => {
  if (e.target.classList.contains("time-slot")) {
    selectedDay = parseInt(e.target.dataset.day, 10);
    eventForm.classList.remove("hidden");
    eventForm.querySelector('input[name="title"]').focus();
  }
});
eventForm.addEventListener("click", e => {
  if (e.target === eventForm) {
    eventForm.classList.add("hidden");
    eventFormElement.reset();
  }
});

// Zapis wydarzenia
eventFormElement.addEventListener("submit", e => {
  e.preventDefault();
  const data = new FormData(eventFormElement);
  const title = data.get("title")?.trim();
  const start = data.get("start");
  const end = data.get("end");
  if (!title || !start || !end) return;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (endMin <= startMin) {
    alert("Czas zakończenia musi być późniejszy niż rozpoczęcia.");
    return;
  }

  addEventToGrid(title, startMin, endMin, selectedDay);
  eventForm.classList.add("hidden");
  eventFormElement.reset();
});

// Funkcja rysująca wydarzenie
function addEventToGrid(title, startMin, endMin, dayIdx) {
  // Zarejestruj wydarzenie jako obiekt
  const newEvent = {
    title,
    start: startMin,
    end: endMin,
    day: dayIdx,
    element: null
  };

  events.push(newEvent);

  // Znajdź wszystkie wydarzenia tego dnia, które nachodzą się z tym nowym
  const overlaps = events.filter(ev =>
    ev.day === dayIdx &&
    !(ev.end <= startMin || ev.start >= endMin)
  );

  // Dodaj też nowo dodane wydarzenie (na pewno się "nachodzi")
  const allOverlaps = events.filter(ev =>
    ev.day === dayIdx &&
    overlaps.some(o => !(o.end <= ev.start || o.start >= ev.end))
  );

  // Oblicz pozycje dla każdego z nakładających się wydarzeń
  const totalCols = allOverlaps.length;
  const gridRect = calendar.getBoundingClientRect();
  const fullColWidth = (gridRect.width - 60) / 7;
  const eventWidth = fullColWidth / totalCols;

  allOverlaps.forEach((ev, idx) => {
    if (!ev.element) {
      ev.element = document.createElement("div");
      ev.element.className = "calendar-event";
      ev.element.textContent = ev.title;
      calendar.appendChild(ev.element);
    }

    const rowHeight = 30;
    const topOffset = 39;
    const top = topOffset + (ev.start / 60) * rowHeight;
    const height = ((ev.end - ev.start) / 60) * rowHeight;
    const left = 60 + dayIdx * fullColWidth + idx * eventWidth;

    Object.assign(ev.element.style, {
      top: `${top}px`,
      height: `${height}px`,
      left: `${left}px`,
      width: `${eventWidth}px`
    });
  });
}

const highlightColumn = (dayIndex, on) => {
  const slots = calendar.querySelectorAll(`.time-slot[data-day="${dayIndex}"]`);
  slots.forEach(slot => {
    slot.classList.toggle("hovered", on);
  });
};

calendar.addEventListener("mouseover", e => {
  if (e.target.classList.contains("time-slot")) {
    const dayIndex = parseInt(e.target.dataset.day, 10);
    highlightColumn(dayIndex, true);
  }
});

calendar.addEventListener("mouseout", e => {
  if (e.target.classList.contains("time-slot")) {
    const dayIndex = parseInt(e.target.dataset.day, 10);
    highlightColumn(dayIndex, false);
  }
});
