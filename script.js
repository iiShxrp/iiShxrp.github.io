function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let season;
    let className;

    if (month >= 2 && month <= 4) {
        season = "Spring " + year;
        className = "season-spring";
    } else if (month >= 5 && month <= 7) {
        season = "Summer " + year;
        className = "season-summer";
    } else if (month >= 8 && month <= 10) {
        season = "Fall " + year;
        className = "season-fall";
    } else {
        season = "Winter " + year;
        className = "season-winter";
    }

    return { season, className };
}

document.addEventListener("DOMContentLoaded", () => {
    const label = document.getElementById("seasonLabel");
    if (!label) return;

    const { season, className } = getCurrentSeason();

    label.textContent = season;
    label.classList.add(className);
});

document.addEventListener("DOMContentLoaded", () => {
    const label = document.getElementById("seasonLabel");
    if (label) {
        const { season, className } = getCurrentSeason();
        label.textContent = season;
        label.classList.add(className);
    }

    // Ustaw aktywny link nawigacyjny
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("active");
        }
    });
});
