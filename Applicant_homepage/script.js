document.addEventListener("DOMContentLoaded", () => {
    const page = document.querySelector(".page-shell");
    if (!page) {
        return;
    }

    const searchInput = document.querySelector(".search-input");
    const composerInput = document.querySelector(".composer-input");
    const summary = document.querySelector(".results-summary");
    const feed = document.querySelector(".feed-scroll");
    const navItems = Array.from(document.querySelectorAll(".nav-item"));
    const composeTriggers = document.querySelectorAll(".compose-trigger");
    const publishButton = document.querySelector(".publish-post");

    const escapeHtml = (value) =>
        value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const getPosts = () => Array.from(feed.querySelectorAll(".feed-post"));

    const updateSummary = () => {
        const visibleCount = getPosts().filter((post) => !post.classList.contains("hidden")).length;
        summary.textContent = `Showing ${visibleCount} post${visibleCount === 1 ? "" : "s"} in your feed`;
    };

    const filterPosts = () => {
        const query = searchInput.value.trim().toLowerCase();

        getPosts().forEach((post) => {
            const haystack = (post.dataset.search || "").toLowerCase();
            post.classList.toggle("hidden", !haystack.includes(query));
        });

        updateSummary();
    };

    const focusComposer = () => {
        composerInput.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => composerInput.focus(), 180);
    };

    const setJobsActive = () => {
        navItems.forEach((item) => {
            item.classList.toggle("active", item.textContent.includes("Jobs"));
        });
    };

    const createPostMarkup = (safeText) => `
        <div class="post-topline">
            <span class="post-type-pill">Status</span>
            <span class="post-time">Just now</span>
        </div>

        <div class="post-author">
            <div class="author-badge person-badge">PM</div>
            <div>
                <h3>Phumudzo</h3>
                <p>Posted a new status</p>
            </div>
        </div>

        <div class="post-body">
            <p>${safeText}</p>
        </div>

        <div class="post-tags">
            <span>#NewPost</span>
            <span>#Community</span>
        </div>

        <div class="post-stats">
            <span><i class="fa-solid fa-thumbs-up"></i> <strong class="like-count">0</strong> Likes</span>
            <span><strong class="comment-count">0</strong> Comments</span>
        </div>

        <div class="interaction-bar">
            <button class="interaction-btn like-btn" type="button"><i class="fa-regular fa-thumbs-up"></i><span>Like</span></button>
            <button class="interaction-btn comment-btn" type="button"><i class="fa-regular fa-comment"></i><span>Comment</span></button>
            <button class="interaction-btn bookmark-btn" type="button"><i class="fa-regular fa-bookmark"></i><span>Save</span></button>
        </div>

        <div class="comment-section">
            <div class="comment-input-area">
                <div class="avatar-xs">PM</div>
                <input type="text" placeholder="Start the conversation..." class="comment-input">
                <button class="btn-post-comment" type="button">Post</button>
            </div>
            <div class="comment-list"></div>
        </div>
    `;

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

    const toggleSave = (button) => {
        const icon = button.querySelector("i");
        const label = button.querySelector("span");
        const saved = button.classList.toggle("is-active");

        icon.classList.toggle("fa-regular", !saved);
        icon.classList.toggle("fa-solid", saved);
        label.textContent = saved ? "Saved" : "Save";
    };

    const toggleComment = (button) => {
        const section = button.closest(".feed-post").querySelector(".comment-section");
        const input = section.querySelector(".comment-input");
        const open = section.classList.toggle("open");

        button.classList.toggle("is-active", open);
        if (open) {
            input.focus();
        }
    };

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

        const bubble = document.createElement("div");
        bubble.className = "comment-bubble";
        bubble.textContent = value;
        list.prepend(bubble);

        count.textContent = Number.parseInt(count.textContent, 10) + 1;
        input.value = "";
    };

    composeTriggers.forEach((button) => {
        button.addEventListener("click", focusComposer);
    });

    publishButton.addEventListener("click", addPost);

    composerInput.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            addPost();
        }
    });

    searchInput.addEventListener("input", filterPosts);

    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            navItems.forEach((navItem) => navItem.classList.remove("active"));
            item.classList.add("active");
        });
    });

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

    filterPosts();
});
