const initialPageData = Object.freeze({
    profile: {
        name: "Naledi Mokoena",
        headline: "Frontend Developer and UX Research Enthusiast | Building accessible digital tools for students and small teams",
        institution: "Northstar Digital Studio",
        location: "Pretoria, Gauteng, South Africa",
        photoUrl: ""
    },
    about: {
        intro: "I am a frontend developer with a growing focus on UX research and interface design. I enjoy turning complex workflows into simple, welcoming experiences that people can use with confidence.",
        passion: "Most of my work revolves around education, community tools, and accessible web interfaces. I like combining structure, visual polish, and practical problem solving."
    },
    activity: {
        title: "Recent posts are available",
        copy: "Posts shared from this profile will appear here. Use Show all to view the full list."
    },
    posts: [
        {
            id: "post-1",
            content: "Spent the morning refining a student dashboard prototype. Small layout changes made the navigation feel much calmer and easier to scan.",
            timestamp: "2026-04-10T09:15:00+02:00"
        },
        {
            id: "post-2",
            content: "I have been enjoying the balance between design research and frontend implementation lately. Seeing user notes turn into working UI is still my favorite part of the process.",
            timestamp: "2026-04-07T16:40:00+02:00"
        },
        {
            id: "post-3",
            content: "Wrapped up a lightweight resource hub for peer mentors this week. Proud of how much clarity we got from keeping the interface simple.",
            timestamp: "2026-04-04T13:05:00+02:00"
        }
    ],
    experience: [
        {
            id: "experience-1",
            logo: "F",
            title: "Frontend Developer Intern",
            company: "Northstar Digital Studio",
            employmentType: "Contract",
            dates: "Jan 2026 - Present",
            duration: "4 mos",
            locationType: "Hybrid",
            description: "Builds responsive interfaces, translates wireframes into reusable UI, and supports usability improvements across client-facing products."
        },
        {
            id: "experience-2",
            logo: "U",
            title: "UX Research Assistant",
            company: "Campus Innovation Lab",
            employmentType: "Part-time",
            dates: "Aug 2025 - Dec 2025",
            duration: "5 mos",
            locationType: "On-site",
            description: "Ran student interviews, summarized usability findings, and helped test early prototypes for academic support tools."
        }
    ],
    education: [
        {
            id: "education-1",
            logo: "U",
            school: "University of Pretoria",
            field: "BSc Information and Knowledge Systems",
            dates: "2022 - 2025"
        },
        {
            id: "education-2",
            logo: "O",
            school: "Open Design Academy",
            field: "Short Course in Product Design",
            dates: "2025"
        }
    ],
    qualifications: {
        items: [
            {
                id: "qualification-1",
                logo: "G",
                title: "Google UX Design Certificate",
                subtitle: "Coursera · Google",
                dates: "2025",
                description: "Completed training in user research, wireframing, prototyping, and usability testing."
            },
            {
                id: "qualification-2",
                logo: "R",
                title: "Responsive Web Design Certification",
                subtitle: "freeCodeCamp",
                dates: "2024",
                description: "Covered semantic HTML, modern CSS layouts, and accessibility-focused frontend practice."
            }
        ]
    },
    skills: {
        softSkills: [
            "Facilitation",
            "Active listening",
            "Collaboration",
            "Presentation design"
        ],
        technicalSkills: [
            "HTML & CSS",
            "JavaScript",
            "Figma",
            "User research"
        ]
    },
    projects: {
        items: [
            {
                id: "project-1",
                logo: "S",
                title: "StudyFlow Dashboard",
                subtitle: "Lead designer and frontend builder",
                dates: "2026",
                description: "Designed and built a progress dashboard concept that helps students track deadlines, tasks, and weekly priorities."
            },
            {
                id: "project-2",
                logo: "M",
                title: "MentorLink Resource Hub",
                subtitle: "UX research and UI implementation",
                dates: "2025",
                description: "Created a simple internal portal for peer mentors to share guides, announcements, and support resources."
            }
        ]
    },
    achievements: {
        items: [
            {
                id: "achievement-1",
                logo: "T",
                title: "Top 5 at Pretoria Design Jam",
                subtitle: "Community innovation challenge",
                dates: "2025",
                description: "Recognized for a student-support prototype focused on first-year onboarding."
            },
            {
                id: "achievement-2",
                logo: "D",
                title: "Dean's Merit Recognition",
                subtitle: "University of Pretoria",
                dates: "2024",
                description: "Awarded for consistent academic performance and participation in collaborative tech initiatives."
            }
        ]
    }
});

function cloneData(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

const profileGateway = {
    async fetchPageData() {
        // TODO: Connect to global database when shared profile data is available.
        return cloneData(initialPageData);
    }
};

const state = {
    activityExpanded: false,
    feedbackTimer: null,
    pageData: null
};

const elements = {
    aboutIntro: document.getElementById("about-intro"),
    aboutPassion: document.getElementById("about-passion"),
    achievementsList: document.getElementById("achievements-list"),
    achievementsSection: document.getElementById("achievements-section"),
    activityCount: document.getElementById("activity-count"),
    activityEmptyCopy: document.getElementById("activity-empty-copy"),
    activityEmptyTitle: document.getElementById("activity-empty-title"),
    activityFooter: document.getElementById("activity-footer"),
    activityPostsList: document.getElementById("activity-posts-list"),
    activityPostTemplate: document.getElementById("activity-post-template"),
    activityShowAllButton: document.getElementById("activity-show-all-button"),
    avatarFallback: document.getElementById("avatar-fallback"),
    educationList: document.getElementById("education-list"),
    educationSection: document.getElementById("education-section"),
    educationTemplate: document.getElementById("education-item-template"),
    experienceList: document.getElementById("experience-list"),
    experienceSection: document.getElementById("experience-section"),
    feedback: document.getElementById("page-feedback"),
    profileBackButton: document.getElementById("profile-back-button"),
    profileHeadline: document.getElementById("profile-headline"),
    profileInstitution: document.getElementById("profile-institution"),
    profileLocation: document.getElementById("profile-location"),
    profileName: document.getElementById("profile-name"),
    profilePhoto: document.getElementById("profile-photo"),
    profileSearchForm: document.getElementById("profile-search-form"),
    projectsList: document.getElementById("projects-list"),
    projectsSection: document.getElementById("projects-section"),
    qualificationsList: document.getElementById("qualifications-list"),
    qualificationsSection: document.getElementById("qualifications-section"),
    resumeTemplate: document.getElementById("resume-item-template"),
    skillsList: document.getElementById("skills-list"),
    skillsSection: document.getElementById("skills-section"),
    skillGroupTemplate: document.getElementById("skill-group-template")
};

document.addEventListener("DOMContentLoaded", initializePage);

async function initializePage() {
    bindEvents();

    try {
        state.pageData = await profileGateway.fetchPageData();
        renderPage();
    } catch (error) {
        console.error("Unable to load the profile page.", error);
        setFeedback("The profile could not be loaded.");
    }
}

function bindEvents() {
    if (elements.profileBackButton) {
        elements.profileBackButton.addEventListener("click", handleBackNavigation);
    }

    if (elements.activityShowAllButton) {
        elements.activityShowAllButton.addEventListener("click", handleToggleActivityPosts);
    }

    if (elements.profileSearchForm) {
        elements.profileSearchForm.addEventListener("submit", handleSearchSubmit);
    }
}

function handleBackNavigation() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = "../Applicant_homepage/index.html";
}

function handleSearchSubmit(event) {
    event.preventDefault();
    setFeedback("Search will be connected to the wider application shell.");
}

function renderPage() {
    if (!state.pageData) {
        return;
    }

    renderProfile();
    renderAbout();
    renderEducation();
    renderExperience();
    renderSupplementalSection("qualifications", elements.qualificationsSection, elements.qualificationsList);
    renderSkills();
    renderSupplementalSection("projects", elements.projectsSection, elements.projectsList);
    renderSupplementalSection("achievements", elements.achievementsSection, elements.achievementsList);
    renderActivity();
}

function renderProfile() {
    const { profile } = state.pageData;

    elements.profileName.textContent = profile.name;
    elements.profileHeadline.textContent = profile.headline;
    elements.profileInstitution.textContent = profile.institution;
    elements.profileLocation.textContent = profile.location;

    if (profile.photoUrl) {
        elements.profilePhoto.src = profile.photoUrl;
        elements.profilePhoto.hidden = false;
        elements.avatarFallback.hidden = true;
        return;
    }

    elements.profilePhoto.hidden = true;
    elements.profilePhoto.removeAttribute("src");
    elements.avatarFallback.hidden = false;
    elements.avatarFallback.textContent = getInitials(profile.name);
}

function renderAbout() {
    elements.aboutIntro.textContent = state.pageData.about.intro;
    elements.aboutPassion.textContent = state.pageData.about.passion;
}

function renderEducation() {
    renderEducationItems(state.pageData.education, elements.educationList);
    elements.educationSection.hidden = state.pageData.education.length === 0;
}

function renderExperience() {
    renderExperienceItems(state.pageData.experience, elements.experienceList);
    elements.experienceSection.hidden = state.pageData.experience.length === 0;
}

function renderSupplementalSection(sectionKey, sectionElement, listElement) {
    const sectionData = state.pageData[sectionKey];
    const items = Array.isArray(sectionData?.items) ? sectionData.items : [];

    renderSharedItems(items, listElement);
    sectionElement.hidden = items.length === 0;
}

function renderSkills() {
    const skillGroups = [];
    const { softSkills, technicalSkills } = state.pageData.skills;

    if (softSkills.length > 0) {
        skillGroups.push({
            id: "skills-soft",
            logo: "S",
            title: "Soft skills",
            items: softSkills
        });
    }

    if (technicalSkills.length > 0) {
        skillGroups.push({
            id: "skills-technical",
            logo: "T",
            title: "Technical skills",
            items: technicalSkills
        });
    }

    elements.skillsList.replaceChildren();
    elements.skillsSection.hidden = skillGroups.length === 0;

    skillGroups.forEach((group) => {
        const fragment = elements.skillGroupTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const skillList = fragment.querySelector(".grouped-skill-list");

        listItem.dataset.entryId = group.id;
        logo.textContent = group.logo;
        title.textContent = group.title;

        group.items.forEach((item) => {
            const skillItem = document.createElement("li");
            skillItem.textContent = item;
            skillList.append(skillItem);
        });

        elements.skillsList.append(fragment);
    });
}

function renderActivity() {
    const posts = Array.isArray(state.pageData.posts) ? state.pageData.posts : [];

    elements.activityCount.textContent = formatPostCount(posts.length);

    if (posts.length === 0) {
        elements.activityEmptyTitle.textContent = "No posts yet";
        elements.activityEmptyCopy.textContent = "This profile has not shared any public posts yet.";
        elements.activityFooter.hidden = true;
        elements.activityPostsList.hidden = true;
        elements.activityPostsList.replaceChildren();
        state.activityExpanded = false;
        return;
    }

    elements.activityEmptyTitle.textContent = state.pageData.activity.title;
    elements.activityEmptyCopy.textContent = state.pageData.activity.copy;
    elements.activityFooter.hidden = false;
    elements.activityShowAllButton.textContent = state.activityExpanded ? "Show less ↑" : "Show all →";

    if (!state.activityExpanded) {
        elements.activityPostsList.hidden = true;
        elements.activityPostsList.replaceChildren();
        return;
    }

    renderPosts(posts);
    elements.activityPostsList.hidden = false;
}

function renderEducationItems(items, targetList) {
    targetList.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.educationTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const field = fragment.querySelector(".education-field-line");
        const dates = fragment.querySelector(".education-date-line");

        listItem.dataset.entryId = item.id;
        logo.textContent = item.logo || createLogoFromText(item.school);
        title.textContent = item.school;
        setOptionalText(field, item.field);
        setOptionalText(dates, item.dates);

        targetList.append(fragment);
    });
}

function renderExperienceItems(items, targetList) {
    targetList.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.resumeTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const companyLine = fragment.querySelector(".resume-company-line");
        const dateLine = fragment.querySelector(".resume-date-line");
        const locationLine = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        listItem.dataset.entryId = item.id;
        logo.textContent = item.logo || createLogoFromText(item.title);
        title.textContent = item.title;
        setOptionalText(companyLine, [item.company, item.employmentType].filter(Boolean).join(" · "));
        setOptionalText(dateLine, [item.dates, item.duration].filter(Boolean).join(" · "));
        setOptionalText(locationLine, item.locationType);
        setOptionalText(description, item.description);

        targetList.append(fragment);
    });
}

function renderSharedItems(items, targetList) {
    targetList.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.resumeTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const companyLine = fragment.querySelector(".resume-company-line");
        const dateLine = fragment.querySelector(".resume-date-line");
        const locationLine = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        listItem.dataset.entryId = item.id;
        logo.textContent = item.logo || createLogoFromText(item.title);
        title.textContent = item.title;
        setOptionalText(companyLine, item.subtitle);
        setOptionalText(dateLine, item.dates);
        setOptionalText(locationLine, "");
        setOptionalText(description, item.description);

        targetList.append(fragment);
    });
}

function renderPosts(posts) {
    elements.activityPostsList.replaceChildren();

    posts.forEach((post) => {
        const fragment = elements.activityPostTemplate.content.cloneNode(true);
        const listItem = fragment.querySelector("li");
        const author = fragment.querySelector(".activity-post-author");
        const timestamp = fragment.querySelector(".activity-post-time");
        const content = fragment.querySelector(".activity-post-content");

        listItem.dataset.postId = post.id;
        author.textContent = state.pageData.profile.name;
        timestamp.textContent = formatPostTimestamp(post.timestamp);
        timestamp.dateTime = post.timestamp;
        content.textContent = post.content;

        elements.activityPostsList.append(fragment);
    });
}

function handleToggleActivityPosts() {
    if (!state.pageData || state.pageData.posts.length === 0) {
        setFeedback("There are no posts available yet.");
        return;
    }

    state.activityExpanded = !state.activityExpanded;
    renderActivity();

    if (state.activityExpanded) {
        elements.activityPostsList.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function setOptionalText(element, value) {
    const hasValue = Boolean(value);
    element.textContent = hasValue ? value : "";
    element.hidden = !hasValue;
}

function formatPostCount(count) {
    return `${count} ${count === 1 ? "post" : "posts"} available`;
}

function formatPostTimestamp(timestamp) {
    const parsedDate = new Date(timestamp);

    if (Number.isNaN(parsedDate.getTime())) {
        return timestamp;
    }

    return new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(parsedDate);
}

function createLogoFromText(value) {
    const match = value.trim().match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "?";
}

function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function setFeedback(message) {
    window.clearTimeout(state.feedbackTimer);
    elements.feedback.textContent = message;
    elements.feedback.hidden = !message;

    if (!message) {
        return;
    }

    state.feedbackTimer = window.setTimeout(() => {
        elements.feedback.hidden = true;
        elements.feedback.textContent = "";
    }, 3200);
}
