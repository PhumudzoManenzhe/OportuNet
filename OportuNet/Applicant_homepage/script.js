// Wait for the page to finish loading before querying the DOM and binding interactions.
document.addEventListener("DOMContentLoaded", () => {
    const page = document.querySelector(".page-shell");
    if (!page) {
        return;
    }

    // Cache the main interactive elements used throughout the applicant feed page.
    const searchInput = document.querySelector(".search-input");
    const composerInput = document.querySelector(".composer-input");
    const summary = document.querySelector(".results-summary");
    const feed = document.querySelector(".feed-scroll");
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const composeTriggers = document.querySelectorAll(".compose-trigger");
    const publishButton = document.querySelector(".publish-post");

    // Escape user-entered text before inserting it into HTML for a newly created post.
    const escapeHtml = (value) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    // Collect the current list of feed posts whenever search or summary logic runs.
    const getPosts = () => Array.from(feed.querySelectorAll(".feed-post"));

    // Update the feed summary so it always reflects the number of visible posts.
    const updateSummary = () => {
        const visibleCount = getPosts().filter((post) => !post.classList.contains("hidden")).length;
        summary.textContent = `Showing ${visibleCount} post${visibleCount === 1 ? "" : "s"} in your feed`;
    };

    // Filter feed posts based on the text typed into the search bar.
    const filterPosts = () => {
        const query = searchInput.value.trim().toLowerCase();

        getPosts().forEach((post) => {
            const haystack = (post.dataset.search || "").toLowerCase();
            post.classList.toggle("hidden", !haystack.includes(query));
        });

        updateSummary();
    };

    // Scroll to the post composer and place the cursor there for quick posting.
    const focusComposer = () => {
        composerInput.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => composerInput.focus(), 180);
    };

    // Highlight the Jobs tab when the shortcut button inside a job post is pressed.
    const setJobsActive = () => {
        navItems.forEach((item) => {
            item.classList.toggle("active", item.textContent.includes("Jobs"));
        });
    };

    // Generate the markup for a new community status post created by the applicant.
    const createPostMarkup = (safeText) => `
        <p class="post-topline">
            <span class="post-type-pill">Status</span>
            <span class="post-time">Just now</span>
        </p>

        <header class="post-author">
            <strong class="author-badge person-badge" aria-hidden="true">PM</strong>
            <section>
                <h3>Phumudzo</h3>
                <p>Posted a new status</p>
            </section>
        </header>

        <section class="post-body">
            <p>${safeText}</p>
        </section>

        <p class="post-tags">
            <span>#NewPost</span>
            <span>#Community</span>
        </p>

        <p class="post-stats">
            <span><i class="fa-solid fa-thumbs-up"></i> <strong class="like-count">0</strong> Likes</span>
            <span><strong class="comment-count">0</strong> Comments</span>
        </p>

        <section class="interaction-bar">
            <button class="interaction-btn like-btn" type="button"><i class="fa-regular fa-thumbs-up"></i><span>Like</span></button>
            <button class="interaction-btn comment-btn" type="button"><i class="fa-regular fa-comment"></i><span>Comment</span></button>
            <button class="interaction-btn bookmark-btn" type="button"><i class="fa-regular fa-bookmark"></i><span>Save</span></button>
        </section>

        <section class="comment-section">
            <section class="comment-input-area">
                <strong class="avatar-xs" aria-hidden="true">PM</strong>
                <input type="text" placeholder="Start the conversation..." class="comment-input">
                <button class="btn-post-comment" type="button">Post</button>
            </section>
            <section class="comment-list"></section>
        </section>
    `;

    // Create a new post card from the composer input and insert it at the top of the feed.
    const addPost = () => {
        const rawText = composerInput.value.trim();
        if (!rawText) {
            composerInput.focus();
            return;
        }

        const post = document.createElement("article");
        post.className = "feed-post post-status";
        post.dataset.type = "status";
        post.dataset.search = `phumudzo status ${rawText.toLowerCase()}`;
        post.innerHTML = createPostMarkup(escapeHtml(rawText));

        feed.prepend(post);
        composerInput.value = "";
        filterPosts();
    };

    // Toggle a like state and keep the visible like counter in sync with the button state.
    const toggleLike = (button) => {
        const post = button.closest(".feed-post");
        const icon = button.querySelector("i");
        const count = post.querySelector(".like-count");
        const liked = button.classList.toggle("is-active");
        const current = Number.parseInt(count.textContent, 10);

        icon.classList.toggle("fa-regular", !liked);
        icon.classList.toggle("fa-solid", liked);
        count.textContent = liked ? current + 1 : Math.max(0, current - 1);
    };

    // Toggle the save state for a post and update the bookmark label and icon.
    const toggleSave = (button) => {
        const icon = button.querySelector("i");
        const label = button.querySelector("span");
        const saved = button.classList.toggle("is-active");

        icon.classList.toggle("fa-regular", !saved);
        icon.classList.toggle("fa-solid", saved);
        label.textContent = saved ? "Saved" : "Save";
    };

    // Show or hide the comment area for the selected post.
    const toggleComment = (button) => {
        const section = button.closest(".feed-post").querySelector(".comment-section");
        const input = section.querySelector(".comment-input");
        const open = section.classList.toggle("open");

        button.classList.toggle("is-active", open);
        if (open) {
            input.focus();
        }
    };

    // Add a new comment bubble to the selected post and increment the comment count.
    const postComment = (button) => {
        const post = button.closest(".feed-post");
        const input = post.querySelector(".comment-input");
        const list = post.querySelector(".comment-list");
        const count = post.querySelector(".comment-count");
        const value = input.value.trim();

        if (!value) {
            input.focus();
            return;
        }

        const bubble = document.createElement("p");
        bubble.className = "comment-bubble";
        bubble.textContent = value;
        list.prepend(bubble);

        count.textContent = Number.parseInt(count.textContent, 10) + 1;
        input.value = "";
    };

    // Bind the compose shortcuts so both the card button and floating button focus the editor.
    composeTriggers.forEach((button) => {
        button.addEventListener("click", focusComposer);
    });

    publishButton.addEventListener("click", addPost);

    // Allow quick publishing with Ctrl/Cmd + Enter while the composer is focused.
    composerInput.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            addPost();
        }
    });

    searchInput.addEventListener("input", filterPosts);

    // Keep the top navigation state in sync when a bottom-nav item is clicked.
    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            navItems.forEach((navItem) => navItem.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // Use event delegation for all feed-card buttons so new posts work automatically too.
    feed.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) {
            return;
        }

        if (button.classList.contains("like-btn")) {
            toggleLike(button);
            return;
        }

        if (button.classList.contains("bookmark-btn")) {
            toggleSave(button);
            return;
        }

        if (button.classList.contains("comment-btn")) {
            toggleComment(button);
            return;
        }

        if (button.classList.contains("btn-post-comment")) {
            postComment(button);
            return;
        }

        if (button.classList.contains("jobs-shortcut")) {
            setJobsActive();
        }
    });

    // Render the initial summary and apply any active search filter on first load.
    filterPosts();
});
