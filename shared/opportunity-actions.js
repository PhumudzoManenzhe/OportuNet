document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(
        ".internship-card, .Learnerships-card, .Apprenticeships-card"
    );

    cards.forEach((card) => {
        const title = card.querySelector("h4")?.textContent?.trim() || "Opportunity";
        const company = card.querySelector(".card-header p")?.textContent?.trim() || "Unknown company";
        const details = Array.from(card.querySelectorAll(".card-details p"))
            .map((detail) => detail.textContent.trim())
            .join("\n");
        const description = card.querySelector(".card-description p")?.textContent?.trim() || "";

        const detailsButton = card.querySelector('[data-role="details"]');
        const applyButton = card.querySelector('[data-role="apply"]');

        if (detailsButton) {
            detailsButton.addEventListener("click", () => {
                alert(`${title}\n${company}\n\n${details}\n\n${description}`);
            });
        }

        if (applyButton) {
            applyButton.addEventListener("click", () => {
                alert(`Application started for ${title} at ${company}.`);
            });
        }
    });
});
