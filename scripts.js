document.addEventListener("DOMContentLoaded", function() {
  fetch("articles.json")
    .then(response => response.json())
    .then(data => {
      const articlesContainer = document.getElementById("articles");
      data.articles.forEach(article => {
        const articleElem = document.createElement("div");
        articleElem.classList.add("article");

        // Jeśli banner jest podany, dodaj obrazek
        if(article.banner) {
          const img = document.createElement("img");
          img.src = article.banner;
          img.alt = article.title;
          articleElem.appendChild(img);
        }

        // Dodaj tytuł
        const title = document.createElement("h2");
        title.textContent = article.title;
        articleElem.appendChild(title);

        // Dodaj opis – konwersja prostego markdowna do pogrubienia
        const description = document.createElement("p");
        description.innerHTML = convertMarkdown(article.description);
        articleElem.appendChild(description);

        articlesContainer.appendChild(articleElem);
      });
    })
    .catch(error => {
      console.error("Błąd podczas wczytywania artykułów:", error);
    });
});

/**
 * Funkcja konwertująca zapis **pogrubiony tekst** na <strong>pogrubiony tekst</strong>
 */
function convertMarkdown(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
