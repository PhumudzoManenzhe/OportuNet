const initialPageData = Object.freeze({
    profile: {
        name: "Naledi Mokoena",
        headline: "Frontend Developer and UX Research Enthusiast | Building accessible digital tools for students and small teams",
        institution: "Northstar Digital Studio",
        campus: "Pretoria Hub",
        location: "Pretoria, Gauteng, South Africa",
        addSectionButton: "Add section",
        photoUrl: ""
    },
    analytics: {
        privacy: "Private to you",
        items: [
            {
                id: "views",
                icon: "<span class=\"metric-icon-badge metric-icon-badge-views\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M2.75 12S6.4 6.75 12 6.75 21.25 12 21.25 12 17.6 17.25 12 17.25 2.75 12 2.75 12Z\"></path><circle cx=\"12\" cy=\"12\" r=\"2.7\"></circle></svg></span>",
                title: "218 profile views",
                description: "People found your profile through design, frontend, and student-tech searches.",
                period: ""
            },
            {
                id: "impressions",
                icon: "<span class=\"metric-icon-badge metric-icon-badge-impressions\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4.5 18.5H19.5\"></path><path d=\"M7 18.5V12.75\"></path><path d=\"M11.33 18.5V9.25\"></path><path d=\"M15.67 18.5V6.25\"></path><path d=\"M20 18.5V11\"></path></svg></span>",
                title: "34 post impressions",
                description: "Your recent updates are getting steady engagement.",
                period: "Past 7 days"
            }
        ]
    },
    about: {
        intro: "I am a frontend developer with a growing focus on UX research and interface design. I enjoy turning complex workflows into simple, welcoming experiences that people can use with confidence.",
        passion: "Most of my work revolves around education, community tools, and accessible web interfaces. I like combining structure, visual polish, and practical problem solving."
    },
    qualifications: {
        intro: "Highlight certifications and focused learning that strengthen your design and frontend practice.",
        buttonLabel: "Add qualifications",
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
    activity: {
        createPostLabel: "Create a post",
        emptyTitle: "Recent posts are available",
        emptyCopy: "Posts shared from this profile will appear here. Use Show all to view the full list."
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
    skills: {
        intro: "Mock skills for this demo profile.",
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
        intro: "Showcase projects that reflect both strong interface thinking and practical implementation.",
        buttonLabel: "Add projects",
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
        intro: "Highlight awards and milestones that show initiative, consistency, and visible impact.",
        buttonLabel: "Add achievements",
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
    },

    async savePageData(pageData) {
        // Placeholder for backend API that persists profile updates for all users.
        return cloneData(pageData);
    },

    async uploadProfilePhoto(file) {
        // Placeholder for backend API and shared media storage.
        // For this demo, a data URL keeps the preview available after refresh.
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.addEventListener("load", () => {
                resolve(typeof reader.result === "string" ? reader.result : "");
            });

            reader.addEventListener("error", () => {
                reject(reader.error || new Error("Unable to read the selected photo."));
            });

            reader.readAsDataURL(file);
        });
    }
};

const state = {
    activeEditorSection: "",
    pageData: null,
    activityExpanded: false,
    educationDismissed: false,
    achievementsDismissed: false,
    experienceDismissed: false,
    isAddSectionOpen: false,
    projectsDismissed: false,
    qualificationsDismissed: false,
    skillsDismissed: false,
    feedbackTimer: null,
    temporaryPhotoUrl: "",
    isEditorOpen: false
};

const elements = {
    aboutIntro: document.getElementById("about-intro"),
    aboutPassion: document.getElementById("about-passion"),
    addSectionButton: document.getElementById("add-section-button"),
    addSectionForm: document.getElementById("add-section-form"),
    addSectionPanel: document.getElementById("add-section-panel"),
    addSectionSelect: document.getElementById("add-section-select"),
    analyticsList: document.getElementById("analytics-list"),
    analyticsPrivacy: document.getElementById("analytics-privacy"),
    analyticsTemplate: document.getElementById("analytics-item-template"),
    activityPostsList: document.getElementById("activity-posts-list"),
    activityPostTemplate: document.getElementById("activity-post-template"),
    activityShowAllButton: document.getElementById("activity-show-all-button"),
    achievementsAddButton: document.getElementById("achievements-add-button"),
    achievementsActiveHeader: document.getElementById("achievements-active-header"),
    achievementsIntro: document.getElementById("achievements-intro"),
    achievementsList: document.getElementById("achievements-list"),
    achievementsPlaceholder: document.getElementById("achievements-placeholder"),
    avatarFallback: document.getElementById("avatar-fallback"),
    avatarMenu: document.getElementById("avatar-menu"),
    avatarMenuButton: document.getElementById("avatar-menu-button"),
    bannerCameraButton: document.getElementById("banner-camera-button"),
    cancelAddSectionButton: document.getElementById("cancel-add-section-button"),
    cancelEditorButton: document.getElementById("cancel-editor-button"),
    changePhotoOption: document.getElementById("change-photo-option"),
    closeAddSectionButton: document.getElementById("close-add-section-button"),
    closeEditorButton: document.getElementById("close-editor-button"),
    createPostButton: document.getElementById("create-post-button"),
    dismissAchievementsButton: document.getElementById("dismiss-achievements-button"),
    dismissProjectsButton: document.getElementById("dismiss-projects-button"),
    dismissQualificationsButton: document.getElementById("dismiss-qualifications-button"),
    dismissSkillsButton: document.getElementById("dismiss-skills-button"),
    editorHeading: document.getElementById("editor-heading"),
    editorForm: document.getElementById("editor-form"),
    editorPanel: document.getElementById("editor-panel"),
    educationAddButton: document.getElementById("education-add-button"),
    educationActiveHeader: document.getElementById("education-active-header"),
    dismissEducationButton: document.getElementById("dismiss-education-button"),
    educationIntro: document.getElementById("education-intro"),
    educationList: document.getElementById("education-list"),
    educationPlaceholder: document.getElementById("education-placeholder"),
    educationSection: document.getElementById("education-section"),
    educationTemplate: document.getElementById("education-item-template"),
    dismissExperienceButton: document.getElementById("dismiss-experience-button"),
    experienceAddButton: document.getElementById("experience-add-button"),
    experienceActiveHeader: document.getElementById("experience-active-header"),
    experienceIntro: document.getElementById("experience-intro"),
    experienceList: document.getElementById("experience-list"),
    experiencePlaceholder: document.getElementById("experience-placeholder"),
    experienceSection: document.getElementById("experience-section"),
    experienceTemplate: document.getElementById("resume-item-template"),
    followersButton: document.getElementById("followers-button"),
    feedback: document.getElementById("page-feedback"),
    photoInput: document.getElementById("photo-input"),
    profileHeadline: document.getElementById("profile-headline"),
    profileInstitution: document.getElementById("profile-institution"),
    profileLocation: document.getElementById("profile-location"),
    profileName: document.getElementById("profile-name"),
    profilePhoto: document.getElementById("profile-photo"),
    projectsAddButton: document.getElementById("projects-add-button"),
    projectsActiveHeader: document.getElementById("projects-active-header"),
    projectsIntro: document.getElementById("projects-intro"),
    projectsList: document.getElementById("projects-list"),
    projectsPlaceholder: document.getElementById("projects-placeholder"),
    projectsSection: document.getElementById("projects-section"),
    qualificationsAddButton: document.getElementById("qualifications-add-button"),
    qualificationsActiveHeader: document.getElementById("qualifications-active-header"),
    qualificationsIntro: document.getElementById("qualifications-intro"),
    qualificationsList: document.getElementById("qualifications-list"),
    qualificationsPlaceholder: document.getElementById("qualifications-placeholder"),
    qualificationsSection: document.getElementById("qualifications-section"),
    skillsActiveHeader: document.getElementById("skills-active-header"),
    skillsAddButton: document.getElementById("skills-add-button"),
    skillsList: document.getElementById("skills-list"),
    skillsPlaceholder: document.getElementById("skills-placeholder"),
    skillsPlaceholderIntro: document.getElementById("skills-placeholder-intro"),
    skillsSection: document.getElementById("skills-section"),
    skillGroupTemplate: document.getElementById("skill-group-template"),
    supplementalAddGroup: document.getElementById("supplemental-add-group"),
    supplementalLegend: document.getElementById("supplemental-legend"),
    viewProfileOption: document.getElementById("view-profile-option"),
    activityEmptyTitle: document.getElementById("activity-empty-title"),
    activityEmptyCopy: document.getElementById("activity-empty-copy"),
    achievementsSection: document.getElementById("achievements-section"),
    educationAddGroup: document.getElementById("education-add-group"),
    experienceAddGroup: document.getElementById("experience-add-group"),
    skillsAddGroup: document.getElementById("skills-add-group"),
    sharedDatesLabel: document.getElementById("shared-dates-label"),
    sharedDescriptionLabel: document.getElementById("shared-description-label"),
    sharedSubtitleLabel: document.getElementById("shared-subtitle-label"),
    sharedTitleLabel: document.getElementById("shared-title-label"),
    formFields: {
        profileName: document.getElementById("profile-name-input"),
        headline: document.getElementById("headline-input"),
        institution: document.getElementById("institution-input"),
        location: document.getElementById("location-input"),
        analyticsPrivacy: document.getElementById("analytics-privacy-input"),
        profileViews: document.getElementById("profile-views-input"),
        profileViewsCopy: document.getElementById("profile-views-copy-input"),
        postImpressions: document.getElementById("post-impressions-input"),
        postImpressionsCopy: document.getElementById("post-impressions-copy-input"),
        postImpressionsPeriod: document.getElementById("post-impressions-period-input"),
        aboutIntro: document.getElementById("about-intro-input"),
        aboutPassion: document.getElementById("about-passion-input"),
        createPostLabel: document.getElementById("create-post-label-input"),
        activityTitle: document.getElementById("activity-title-input"),
        activityCopy: document.getElementById("activity-copy-input"),
        experienceTitle: document.getElementById("experience-title-input"),
        experienceCompany: document.getElementById("experience-company-input"),
        experienceType: document.getElementById("experience-type-input"),
        experienceDates: document.getElementById("experience-dates-input"),
        experienceDuration: document.getElementById("experience-duration-input"),
        experienceLocationType: document.getElementById("experience-location-type-input"),
        experienceDescription: document.getElementById("experience-description-input"),
        educationSchool: document.getElementById("education-school-input"),
        educationField: document.getElementById("education-field-input"),
        educationDates: document.getElementById("education-dates-input"),
        softSkills: document.getElementById("soft-skills-input"),
        technicalSkills: document.getElementById("technical-skills-input"),
        qualificationsIntro: document.getElementById("qualifications-intro-input"),
        qualificationsButton: document.getElementById("qualifications-button-input"),
        projectsIntro: document.getElementById("projects-intro-input"),
        projectsButton: document.getElementById("projects-button-input"),
        achievementsIntro: document.getElementById("achievements-intro-input"),
        achievementsButton: document.getElementById("achievements-button-input")
    },
    addSectionFields: {
        educationSchool: document.getElementById("add-education-school-input"),
        educationField: document.getElementById("add-education-field-input"),
        educationDates: document.getElementById("add-education-dates-input"),
        experienceTitle: document.getElementById("add-experience-title-input"),
        experienceCompany: document.getElementById("add-experience-company-input"),
        experienceType: document.getElementById("add-experience-type-input"),
        experienceDates: document.getElementById("add-experience-dates-input"),
        experienceDuration: document.getElementById("add-experience-duration-input"),
        experienceLocationType: document.getElementById("add-experience-location-type-input"),
        experienceDescription: document.getElementById("add-experience-description-input"),
        sharedTitle: document.getElementById("add-shared-title-input"),
        sharedSubtitle: document.getElementById("add-shared-subtitle-input"),
        sharedDates: document.getElementById("add-shared-dates-input"),
        sharedDescription: document.getElementById("add-shared-description-input"),
        softSkills: document.getElementById("add-soft-skills-input"),
        technicalSkills: document.getElementById("add-technical-skills-input")
    }
};

const supplementalSectionCopy = {
    qualifications: {
        legend: "Qualification details",
        title: "Qualification title",
        subtitle: "Issuer or institution",
        dates: "Date or period",
        description: "Qualification details"
    },
    projects: {
        legend: "Project details",
        title: "Project name",
        subtitle: "Role, tools or link",
        dates: "Date or period",
        description: "Project summary"
    },
    achievements: {
        legend: "Achievement details",
        title: "Achievement title",
        subtitle: "Awarding body or context",
        dates: "Date or period",
        description: "Achievement summary"
    }
};

const primarySectionPlaceholderCopy = {
    education: {
        intro: "Add your school, study field, and dates so people can quickly understand your academic background.",
        buttonLabel: "Add education"
    },
    experience: {
        intro: "Add your roles, workplace details, and responsibilities to show your practical experience.",
        buttonLabel: "Add experience"
    }
};

const sectionDeleteConfig = {
    education: {
        label: "Education",
        delete(pageData) {
            pageData.education = [];
        }
    },
    experience: {
        label: "Experience",
        delete(pageData) {
            pageData.experience = [];
        }
    },
    qualifications: {
        label: "Qualifications",
        delete(pageData) {
            pageData.qualifications.items = [];
        }
    },
    skills: {
        label: "Skills",
        delete(pageData) {
            pageData.skills.softSkills = [];
            pageData.skills.technicalSkills = [];
        }
    },
    projects: {
        label: "Projects",
        delete(pageData) {
            pageData.projects.items = [];
        }
    },
    achievements: {
        label: "Achievements",
        delete(pageData) {
            pageData.achievements.items = [];
        }
    }
};

const editorSectionLabels = {
    profile: "Profile",
    analytics: "Analytics",
    about: "About",
    activity: "Activity",
    experience: "Experience",
    education: "Education",
    skills: "Skills",
    qualifications: "Qualifications",
    projects: "Projects",
    achievements: "Achievements"
};

const editorTargetSectionMap = {
    "profile-name-input": "profile",
    "headline-input": "profile",
    "institution-input": "profile",
    "location-input": "profile",
    "analytics-privacy-input": "analytics",
    "profile-views-input": "analytics",
    "profile-views-copy-input": "analytics",
    "post-impressions-input": "analytics",
    "post-impressions-copy-input": "analytics",
    "post-impressions-period-input": "analytics",
    "about-intro-input": "about",
    "about-passion-input": "about",
    "create-post-label-input": "activity",
    "activity-title-input": "activity",
    "activity-copy-input": "activity",
    "experience-title-input": "experience",
    "experience-company-input": "experience",
    "experience-type-input": "experience",
    "experience-dates-input": "experience",
    "experience-duration-input": "experience",
    "experience-location-type-input": "experience",
    "experience-description-input": "experience",
    "education-school-input": "education",
    "education-field-input": "education",
    "education-dates-input": "education",
    "soft-skills-input": "skills",
    "technical-skills-input": "skills",
    "qualifications-intro-input": "qualifications",
    "qualifications-button-input": "qualifications",
    "projects-intro-input": "projects",
    "projects-button-input": "projects",
    "achievements-intro-input": "achievements",
    "achievements-button-input": "achievements"
};

const historyStateKey = "profilePageSession";
const localStorageKey = "editableProfilePageSession";
const mockProfileVersion = "2026-04-11-randomized-profile";

document.addEventListener("DOMContentLoaded", initializePage);
window.addEventListener("beforeunload", releaseTemporaryPhotoUrl);

async function initializePage() {
    bindEvents();

    try {
        const restoredSession = readPersistedSession();
        state.pageData = restoredSession?.pageData || await profileGateway.fetchPageData();
        state.activityExpanded = restoredSession?.activityExpanded || false;
        state.educationDismissed = restoredSession?.educationDismissed || false;
        state.achievementsDismissed = restoredSession?.achievementsDismissed || false;
        state.experienceDismissed = restoredSession?.experienceDismissed || false;
        state.projectsDismissed = restoredSession?.projectsDismissed || false;
        state.qualificationsDismissed = restoredSession?.qualificationsDismissed || false;
        state.skillsDismissed = restoredSession?.skillsDismissed || false;
        renderPage();
        syncEditorForm();
    } catch (error) {
        console.error("Unable to load the profile page.", error);
        setFeedback("The profile page could not be loaded.");
    }
}

function bindEvents() {
    elements.addSectionButton.addEventListener("click", () => {
        openAddSectionPanel();
    });
    elements.addSectionForm.addEventListener("submit", handleAddSection);
    elements.addSectionSelect.addEventListener("change", handleAddSectionChoiceChange);
    elements.avatarMenuButton.addEventListener("click", toggleAvatarMenu);
    elements.viewProfileOption.addEventListener("click", handleViewProfile);
    elements.changePhotoOption.addEventListener("click", triggerPhotoPicker);
    elements.bannerCameraButton.addEventListener("click", triggerPhotoPicker);
    elements.photoInput.addEventListener("change", handlePhotoSelection);
    elements.closeAddSectionButton.addEventListener("click", closeAddSectionPanel);
    elements.cancelAddSectionButton.addEventListener("click", closeAddSectionPanel);
    elements.dismissEducationButton.addEventListener("click", handleDismissEducation);
    elements.dismissAchievementsButton.addEventListener("click", handleDismissAchievements);
    elements.dismissExperienceButton.addEventListener("click", handleDismissExperience);
    elements.dismissProjectsButton.addEventListener("click", handleDismissProjects);
    elements.dismissQualificationsButton.addEventListener("click", handleDismissQualifications);
    elements.dismissSkillsButton.addEventListener("click", handleDismissSkills);
    elements.editorForm.addEventListener("submit", handleSave);
    elements.closeEditorButton.addEventListener("click", closeEditor);
    elements.cancelEditorButton.addEventListener("click", closeEditor);
    elements.activityShowAllButton.addEventListener("click", handleToggleActivityPosts);

    document.querySelectorAll("[data-open-editor]").forEach((button) => {
        button.addEventListener("click", () => {
            closeSectionActionMenus();
            openEditor(button.dataset.openEditor);
        });
    });

    document.querySelectorAll("[data-open-add-section]").forEach((button) => {
        button.addEventListener("click", () => {
            closeSectionActionMenus();
            openAddSectionPanel(button.dataset.openAddSection);
        });
    });

    document.querySelectorAll("[data-delete-section]").forEach((button) => {
        button.addEventListener("click", () => {
            handleDeleteSection(button.dataset.deleteSection);
        });
    });

    document.querySelectorAll("[data-feedback]").forEach((button) => {
        button.addEventListener("click", () => {
            setFeedback(button.dataset.feedback);
        });
    });

    document.addEventListener("click", (event) => {
        if (!elements.avatarMenu.hidden) {
            const clickedMenu = elements.avatarMenu.contains(event.target);
            const clickedButton = elements.avatarMenuButton.contains(event.target);

            if (!clickedMenu && !clickedButton) {
                closeAvatarMenu();
            }
        }

        const clickedSectionMenu = event.target.closest(".section-action-menu");
        closeSectionActionMenus(clickedSectionMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !elements.avatarMenu.hidden) {
            closeAvatarMenu();
            return;
        }

        if (event.key === "Escape" && closeSectionActionMenus()) {
            return;
        }

        if (event.key === "Escape" && state.isEditorOpen) {
            closeEditor();
            return;
        }

        if (event.key === "Escape" && state.isAddSectionOpen) {
            closeAddSectionPanel();
        }
    });

    elements.addSectionPanel.addEventListener("click", (event) => {
        if (event.target === elements.addSectionPanel) {
            closeAddSectionPanel();
        }
    });

    elements.editorPanel.addEventListener("click", (event) => {
        if (event.target === elements.editorPanel) {
            closeEditor();
        }
    });
}

function renderPage() {
    renderProfile();
    renderAnalytics();
    renderAbout();
    renderEducation();
    renderExperience();
    renderQualifications();
    renderSkills();
    renderProjects();
    renderAchievements();
    renderActivity();
    persistSessionState();
}

function renderProfile() {
    const { profile } = state.pageData;

    elements.profileName.textContent = profile.name;
    elements.profileHeadline.textContent = profile.headline;
    elements.profileInstitution.textContent = profile.institution;
    elements.profileLocation.textContent = profile.location;
    elements.addSectionButton.textContent = profile.addSectionButton;

    renderAvatar(profile);
}

function renderAvatar(profile) {
    elements.profilePhoto.alt = `${profile.name} profile picture`;

    if (profile.photoUrl) {
        elements.profilePhoto.src = profile.photoUrl;
        elements.profilePhoto.hidden = false;
        elements.avatarFallback.hidden = true;
        return;
    }

    elements.profilePhoto.removeAttribute("src");
    elements.profilePhoto.hidden = true;
    elements.avatarFallback.hidden = false;
    elements.avatarFallback.textContent = getInitials(profile.name);
}

function renderAnalytics() {
    elements.analyticsPrivacy.textContent = state.pageData.analytics.privacy;
    elements.analyticsList.replaceChildren();

    state.pageData.analytics.items.forEach((item) => {
        const fragment = elements.analyticsTemplate.content.cloneNode(true);
        const icon = fragment.querySelector(".metric-icon");
        const title = fragment.querySelector(".metric-title");
        const description = fragment.querySelector(".metric-description");
        const period = fragment.querySelector(".metric-period");

        icon.innerHTML = item.icon;
        title.textContent = item.title;
        description.textContent = item.description;
        period.textContent = item.period;
        period.hidden = !item.period;

        elements.analyticsList.append(fragment);
    });
}

function renderAbout() {
    elements.aboutIntro.textContent = state.pageData.about.intro;
    elements.aboutPassion.textContent = state.pageData.about.passion;
    elements.aboutIntro.hidden = !state.pageData.about.intro;
    elements.aboutPassion.hidden = !state.pageData.about.passion;
}

function renderQualifications() {
    renderSupplementalSection({
        sectionElement: elements.qualificationsSection,
        placeholderElement: elements.qualificationsPlaceholder,
        activeHeaderElement: elements.qualificationsActiveHeader,
        listElement: elements.qualificationsList,
        dismissed: state.qualificationsDismissed,
        introElement: elements.qualificationsIntro,
        addButtonElement: elements.qualificationsAddButton,
        data: state.pageData.qualifications
    });
}

function renderActivity() {
    const { activity, posts, profile } = state.pageData;
    const hasPosts = posts.length > 0;

    elements.followersButton.textContent = formatPostCount(posts.length);
    elements.createPostButton.textContent = activity.createPostLabel;
    elements.activityEmptyTitle.textContent = activity.emptyTitle;
    elements.activityEmptyCopy.textContent = activity.emptyCopy;
    elements.activityShowAllButton.hidden = !hasPosts;
    elements.activityShowAllButton.textContent = state.activityExpanded ? "Hide posts" : "Show all ->";

    renderActivityPosts(profile.name, posts);
}

function renderActivityPosts(authorName, posts) {
    elements.activityPostsList.replaceChildren();

    if (!state.activityExpanded || posts.length === 0) {
        elements.activityPostsList.hidden = true;
        return;
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
    });

    posts.forEach((post) => {
        const fragment = elements.activityPostTemplate.content.cloneNode(true);
        const author = fragment.querySelector(".activity-post-author");
        const deleteButton = fragment.querySelector(".activity-post-delete");
        const time = fragment.querySelector(".activity-post-time");
        const content = fragment.querySelector(".activity-post-content");

        author.textContent = authorName;
        time.dateTime = post.timestamp;
        time.textContent = formatter.format(new Date(post.timestamp));
        content.textContent = post.content;
        deleteButton.addEventListener("click", () => {
            handleDeletePost(post.id);
        });

        elements.activityPostsList.append(fragment);
    });

    elements.activityPostsList.hidden = false;
}

function renderExperience() {
    renderPrimarySection({
        sectionElement: elements.experienceSection,
        placeholderElement: elements.experiencePlaceholder,
        activeHeaderElement: elements.experienceActiveHeader,
        listElement: elements.experienceList,
        dismissed: state.experienceDismissed,
        introElement: elements.experienceIntro,
        addButtonElement: elements.experienceAddButton,
        introText: primarySectionPlaceholderCopy.experience.intro,
        buttonLabel: primarySectionPlaceholderCopy.experience.buttonLabel,
        items: state.pageData.experience,
        renderList: renderExperienceList
    });
}

function renderEducation() {
    renderPrimarySection({
        sectionElement: elements.educationSection,
        placeholderElement: elements.educationPlaceholder,
        activeHeaderElement: elements.educationActiveHeader,
        listElement: elements.educationList,
        dismissed: state.educationDismissed,
        introElement: elements.educationIntro,
        addButtonElement: elements.educationAddButton,
        introText: primarySectionPlaceholderCopy.education.intro,
        buttonLabel: primarySectionPlaceholderCopy.education.buttonLabel,
        items: state.pageData.education,
        renderList: renderEducationList
    });
}

function renderSkills() {
    const { skills } = state.pageData;
    const skillItems = [
        {
            id: "soft-skills-group",
            heading: "Soft skills",
            items: skills.softSkills
        },
        {
            id: "technical-skills-group",
            heading: "Technical skills",
            items: skills.technicalSkills
        }
    ].filter((group) => group.items.length > 0);
    const hasSkills = skillItems.length > 0;

    elements.skillsSection.hidden = !hasSkills && state.skillsDismissed;
    elements.skillsSection.classList.toggle("screen-section-muted", !hasSkills);
    elements.skillsPlaceholder.hidden = hasSkills;
    elements.skillsActiveHeader.hidden = !hasSkills;
    elements.skillsPlaceholderIntro.textContent = skills.intro;
    elements.skillsList.hidden = !hasSkills;

    renderSkillGroups(elements.skillsList, skillItems);
}

function renderProjects() {
    renderSupplementalSection({
        sectionElement: elements.projectsSection,
        placeholderElement: elements.projectsPlaceholder,
        activeHeaderElement: elements.projectsActiveHeader,
        listElement: elements.projectsList,
        dismissed: state.projectsDismissed,
        introElement: elements.projectsIntro,
        addButtonElement: elements.projectsAddButton,
        data: state.pageData.projects
    });
}

function renderAchievements() {
    renderSupplementalSection({
        sectionElement: elements.achievementsSection,
        placeholderElement: elements.achievementsPlaceholder,
        activeHeaderElement: elements.achievementsActiveHeader,
        listElement: elements.achievementsList,
        dismissed: state.achievementsDismissed,
        introElement: elements.achievementsIntro,
        addButtonElement: elements.achievementsAddButton,
        data: state.pageData.achievements
    });
}

function renderSupplementalSection({ sectionElement, placeholderElement, activeHeaderElement, listElement, dismissed, introElement, addButtonElement, data }) {
    const hasItems = data.items.length > 0;

    sectionElement.hidden = !hasItems && dismissed;
    sectionElement.classList.toggle("screen-section-muted", !hasItems);
    placeholderElement.hidden = hasItems;
    activeHeaderElement.hidden = !hasItems;
    listElement.hidden = !hasItems;
    introElement.textContent = data.intro;
    addButtonElement.textContent = data.buttonLabel;

    if (!hasItems) {
        listElement.replaceChildren();
        return;
    }

    renderSharedSectionList(listElement, data.items);
}

function renderPrimarySection({ sectionElement, placeholderElement, activeHeaderElement, listElement, dismissed, introElement, addButtonElement, introText, buttonLabel, items, renderList }) {
    const hasItems = items.length > 0;

    sectionElement.hidden = !hasItems && dismissed;
    sectionElement.classList.toggle("screen-section-muted", !hasItems);
    placeholderElement.hidden = hasItems;
    activeHeaderElement.hidden = !hasItems;
    listElement.hidden = !hasItems;
    introElement.textContent = introText;
    addButtonElement.textContent = buttonLabel;

    if (!hasItems) {
        listElement.replaceChildren();
        return;
    }

    renderList(items, listElement);
}

function renderEducationList(items, listElement) {
    listElement.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.educationTemplate.content.cloneNode(true);
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const field = fragment.querySelector(".education-field-line");
        const dates = fragment.querySelector(".education-date-line");

        logo.textContent = createLogoFromText(item.school);
        title.textContent = item.school;
        field.textContent = item.field;
        dates.textContent = item.dates;

        listElement.append(fragment);
    });
}

function renderExperienceList(items, listElement) {
    listElement.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.experienceTemplate.content.cloneNode(true);
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const companyLine = fragment.querySelector(".resume-company-line");
        const dateLine = fragment.querySelector(".resume-date-line");
        const locationLine = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        logo.textContent = createLogoFromText(item.title);
        title.textContent = item.title;
        companyLine.textContent = `${item.company} - ${item.employmentType}`;
        dateLine.textContent = `${item.dates} - ${item.duration}`;
        locationLine.textContent = item.locationType;
        description.textContent = item.description;

        listElement.append(fragment);
    });
}

function renderSharedSectionList(listElement, items) {
    listElement.replaceChildren();

    items.forEach((item) => {
        const fragment = elements.experienceTemplate.content.cloneNode(true);
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const companyLine = fragment.querySelector(".resume-company-line");
        const dateLine = fragment.querySelector(".resume-date-line");
        const locationLine = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        logo.textContent = createLogoFromText(item.title);
        title.textContent = item.title;
        companyLine.textContent = item.subtitle;
        companyLine.hidden = !item.subtitle;
        dateLine.textContent = item.dates;
        dateLine.hidden = !item.dates;
        locationLine.hidden = true;
        description.textContent = item.description;
        description.hidden = !item.description;

        listElement.append(fragment);
    });
}

function renderSkillGroups(listElement, groups) {
    listElement.replaceChildren();

    groups.forEach((group) => {
        const fragment = elements.skillGroupTemplate.content.cloneNode(true);
        const logo = fragment.querySelector(".resume-logo-text");
        const title = fragment.querySelector(".resume-title");
        const groupedList = fragment.querySelector(".grouped-skill-list");

        logo.textContent = createLogoFromText(group.heading);
        title.textContent = group.heading;

        group.items.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.textContent = item;
            groupedList.append(listItem);
        });

        listElement.append(fragment);
    });
}

function syncEditorForm() {
    const { profile, analytics, about, qualifications, activity, experience, education, skills, projects, achievements } = state.pageData;
    const primaryExperience = experience[0] || {
        logo: "",
        title: "",
        company: "",
        employmentType: "",
        dates: "",
        duration: "",
        locationType: "",
        description: ""
    };
    const primaryEducation = education[0] || {
        logo: "",
        school: "",
        field: "",
        dates: ""
    };

    elements.formFields.profileName.value = profile.name;
    elements.formFields.headline.value = profile.headline;
    elements.formFields.institution.value = profile.institution;
    elements.formFields.location.value = profile.location;
    elements.formFields.analyticsPrivacy.value = analytics.privacy;
    elements.formFields.profileViews.value = analytics.items[0].title;
    elements.formFields.profileViewsCopy.value = analytics.items[0].description;
    elements.formFields.postImpressions.value = analytics.items[1].title;
    elements.formFields.postImpressionsCopy.value = analytics.items[1].description;
    elements.formFields.postImpressionsPeriod.value = analytics.items[1].period;
    elements.formFields.aboutIntro.value = about.intro;
    elements.formFields.aboutPassion.value = about.passion;
    elements.formFields.qualificationsIntro.value = qualifications.intro;
    elements.formFields.qualificationsButton.value = qualifications.buttonLabel;
    elements.formFields.createPostLabel.value = activity.createPostLabel;
    elements.formFields.activityTitle.value = activity.emptyTitle;
    elements.formFields.activityCopy.value = activity.emptyCopy;
    elements.formFields.experienceTitle.value = primaryExperience.title;
    elements.formFields.experienceCompany.value = primaryExperience.company;
    elements.formFields.experienceType.value = primaryExperience.employmentType;
    elements.formFields.experienceDates.value = primaryExperience.dates;
    elements.formFields.experienceDuration.value = primaryExperience.duration;
    elements.formFields.experienceLocationType.value = primaryExperience.locationType;
    elements.formFields.experienceDescription.value = primaryExperience.description;
    elements.formFields.educationSchool.value = primaryEducation.school;
    elements.formFields.educationField.value = primaryEducation.field;
    elements.formFields.educationDates.value = primaryEducation.dates;
    elements.formFields.softSkills.value = skills.softSkills.join(", ");
    elements.formFields.technicalSkills.value = skills.technicalSkills.join(", ");
    elements.formFields.projectsIntro.value = projects.intro;
    elements.formFields.projectsButton.value = projects.buttonLabel;
    elements.formFields.achievementsIntro.value = achievements.intro;
    elements.formFields.achievementsButton.value = achievements.buttonLabel;
}

function openEditor(targetId) {
    if (!state.pageData) {
        return;
    }

    if (state.isAddSectionOpen) {
        closeAddSectionPanel();
    }

    syncEditorForm();
    state.activeEditorSection = getEditorSectionForTarget(targetId);
    state.isEditorOpen = true;
    updateEditorSections(state.activeEditorSection);
    updateEditorHeading(state.activeEditorSection);
    elements.editorPanel.hidden = false;
    updatePanelLockState();
    closeAvatarMenu();

    window.setTimeout(() => {
        const targetField = document.getElementById(targetId) || elements.formFields.profileName;
        targetField.focus();
        targetField.scrollIntoView({
            block: "center"
        });
    }, 0);
}

function closeEditor() {
    state.isEditorOpen = false;
    state.activeEditorSection = "";
    elements.editorPanel.hidden = true;
    updateEditorSections("");
    updateEditorHeading("");
    updatePanelLockState();
}

function openAddSectionPanel(sectionType = "") {
    if (!state.pageData) {
        return;
    }

    if (state.isEditorOpen) {
        closeEditor();
    }

    resetAddSectionForm(sectionType);
    state.isAddSectionOpen = true;
    elements.addSectionPanel.hidden = false;
    updatePanelLockState();
    closeAvatarMenu();

    window.setTimeout(() => {
        const focusTarget = getFirstAddSectionField(sectionType) || elements.addSectionSelect;
        focusTarget.focus();
        focusTarget.scrollIntoView({
            block: "center"
        });
    }, 0);
}

function closeAddSectionPanel() {
    state.isAddSectionOpen = false;
    elements.addSectionPanel.hidden = true;
    elements.addSectionForm.reset();
    updateAddSectionFields("");
    updatePanelLockState();
}

function resetAddSectionForm(sectionType) {
    elements.addSectionForm.reset();
    elements.addSectionSelect.value = sectionType;
    updateAddSectionFields(sectionType);
}

function updatePanelLockState() {
    document.body.classList.toggle("editor-open", state.isEditorOpen || state.isAddSectionOpen);
}

function getEditorSectionForTarget(targetId) {
    return editorTargetSectionMap[targetId] || "";
}

function updateEditorSections(activeSection) {
    document.querySelectorAll("[data-editor-section]").forEach((group) => {
        const isVisible = !activeSection || group.dataset.editorSection === activeSection;
        group.hidden = !isVisible;

        group.querySelectorAll("input, textarea, select").forEach((field) => {
            field.disabled = !isVisible;
        });
    });
}

function updateEditorHeading(activeSection) {
    elements.editorHeading.textContent = activeSection
        ? `Edit ${editorSectionLabels[activeSection]}`
        : "Edit profile content";
}

function handleAddSectionChoiceChange() {
    updateAddSectionFields(elements.addSectionSelect.value);
}

function updateAddSectionFields(sectionType) {
    const isSupplemental = Object.prototype.hasOwnProperty.call(supplementalSectionCopy, sectionType);

    elements.educationAddGroup.hidden = sectionType !== "education";
    elements.experienceAddGroup.hidden = sectionType !== "experience";
    elements.skillsAddGroup.hidden = sectionType !== "skills";
    elements.supplementalAddGroup.hidden = !isSupplemental;

    if (!isSupplemental) {
        return;
    }

    const copy = supplementalSectionCopy[sectionType];
    elements.supplementalLegend.textContent = copy.legend;
    elements.sharedTitleLabel.textContent = copy.title;
    elements.sharedSubtitleLabel.textContent = copy.subtitle;
    elements.sharedDatesLabel.textContent = copy.dates;
    elements.sharedDescriptionLabel.textContent = copy.description;
}

function getFirstAddSectionField(sectionType) {
    switch (sectionType) {
        case "education":
            return elements.addSectionFields.educationSchool;
        case "experience":
            return elements.addSectionFields.experienceTitle;
        case "qualifications":
        case "projects":
        case "achievements":
            return elements.addSectionFields.sharedTitle;
        case "skills":
            return elements.addSectionFields.softSkills;
        default:
            return null;
    }
}

async function handleSave(event) {
    event.preventDefault();

    const nextPageData = cloneData(state.pageData);
    const sectionKey = state.activeEditorSection;

    switch (sectionKey) {
        case "profile":
            nextPageData.profile.name = elements.formFields.profileName.value.trim();
            nextPageData.profile.headline = elements.formFields.headline.value.trim();
            nextPageData.profile.institution = elements.formFields.institution.value.trim();
            nextPageData.profile.location = elements.formFields.location.value.trim();
            break;
        case "analytics":
            nextPageData.analytics.privacy = elements.formFields.analyticsPrivacy.value.trim();
            nextPageData.analytics.items[0].title = elements.formFields.profileViews.value.trim();
            nextPageData.analytics.items[0].description = elements.formFields.profileViewsCopy.value.trim();
            nextPageData.analytics.items[1].title = elements.formFields.postImpressions.value.trim();
            nextPageData.analytics.items[1].description = elements.formFields.postImpressionsCopy.value.trim();
            nextPageData.analytics.items[1].period = elements.formFields.postImpressionsPeriod.value.trim();
            break;
        case "about":
            nextPageData.about.intro = elements.formFields.aboutIntro.value.trim();
            nextPageData.about.passion = elements.formFields.aboutPassion.value.trim();
            break;
        case "activity":
            nextPageData.activity.createPostLabel = elements.formFields.createPostLabel.value.trim();
            nextPageData.activity.emptyTitle = elements.formFields.activityTitle.value.trim();
            nextPageData.activity.emptyCopy = elements.formFields.activityCopy.value.trim();
            break;
        case "experience":
            if (!nextPageData.experience[0]) {
                nextPageData.experience[0] = {
                    id: createItemId("experience"),
                    logo: "",
                    title: "",
                    company: "",
                    employmentType: "",
                    dates: "",
                    duration: "",
                    locationType: "",
                    description: ""
                };
            }

            nextPageData.experience[0].title = elements.formFields.experienceTitle.value.trim();
            nextPageData.experience[0].company = elements.formFields.experienceCompany.value.trim();
            nextPageData.experience[0].employmentType = elements.formFields.experienceType.value.trim();
            nextPageData.experience[0].dates = elements.formFields.experienceDates.value.trim();
            nextPageData.experience[0].duration = elements.formFields.experienceDuration.value.trim();
            nextPageData.experience[0].locationType = elements.formFields.experienceLocationType.value.trim();
            nextPageData.experience[0].description = elements.formFields.experienceDescription.value.trim();
            break;
        case "education":
            if (!nextPageData.education[0]) {
                nextPageData.education[0] = {
                    id: createItemId("education"),
                    logo: "",
                    school: "",
                    field: "",
                    dates: ""
                };
            }

            nextPageData.education[0].school = elements.formFields.educationSchool.value.trim();
            nextPageData.education[0].field = elements.formFields.educationField.value.trim();
            nextPageData.education[0].dates = elements.formFields.educationDates.value.trim();
            break;
        case "skills":
            nextPageData.skills.softSkills = parseSkillText(elements.formFields.softSkills.value);
            nextPageData.skills.technicalSkills = parseSkillText(elements.formFields.technicalSkills.value);
            break;
        case "qualifications":
            nextPageData.qualifications.intro = elements.formFields.qualificationsIntro.value.trim();
            nextPageData.qualifications.buttonLabel = elements.formFields.qualificationsButton.value.trim();
            break;
        case "projects":
            nextPageData.projects.intro = elements.formFields.projectsIntro.value.trim();
            nextPageData.projects.buttonLabel = elements.formFields.projectsButton.value.trim();
            break;
        case "achievements":
            nextPageData.achievements.intro = elements.formFields.achievementsIntro.value.trim();
            nextPageData.achievements.buttonLabel = elements.formFields.achievementsButton.value.trim();
            break;
        default:
            setFeedback("Open a section before saving changes.");
            return;
    }

    try {
        state.pageData = await profileGateway.savePageData(nextPageData);
        if (sectionKey === "qualifications") {
            state.qualificationsDismissed = false;
        }

        if (sectionKey === "skills") {
            state.skillsDismissed = false;
        }

        if (sectionKey === "projects") {
            state.projectsDismissed = false;
        }

        if (sectionKey === "achievements") {
            state.achievementsDismissed = false;
        }

        renderPage();
        syncEditorForm();
        closeEditor();
        setFeedback(`${editorSectionLabels[sectionKey]} updated.`);
    } catch (error) {
        console.error("Unable to save the profile page.", error);
        setFeedback("The updated profile content could not be saved.");
    }
}

async function handleAddSection(event) {
    event.preventDefault();

    if (!state.pageData) {
        return;
    }

    const sectionType = elements.addSectionSelect.value;

    if (!sectionType) {
        setFeedback("Choose a section before adding details.");
        elements.addSectionSelect.focus();
        return;
    }

    const nextPageData = cloneData(state.pageData);
    const nextDismissedState = {
        educationDismissed: state.educationDismissed,
        achievementsDismissed: state.achievementsDismissed,
        experienceDismissed: state.experienceDismissed,
        projectsDismissed: state.projectsDismissed,
        qualificationsDismissed: state.qualificationsDismissed,
        skillsDismissed: state.skillsDismissed
    };
    let sectionLabel = "";

    switch (sectionType) {
        case "education": {
            const educationItem = buildEducationItem();

            if (!educationItem) {
                return;
            }

            nextPageData.education.push(educationItem);
            nextDismissedState.educationDismissed = false;
            sectionLabel = "Education";
            break;
        }
        case "experience": {
            const experienceItem = buildExperienceItem();

            if (!experienceItem) {
                return;
            }

            nextPageData.experience.push(experienceItem);
            nextDismissedState.experienceDismissed = false;
            sectionLabel = "Experience";
            break;
        }
        case "skills": {
            const softSkills = parseSkillText(elements.addSectionFields.softSkills.value);
            const technicalSkills = parseSkillText(elements.addSectionFields.technicalSkills.value);

            if (softSkills.length === 0 && technicalSkills.length === 0) {
                setFeedback("Add at least one skill before saving.");
                elements.addSectionFields.softSkills.focus();
                return;
            }

            nextPageData.skills.softSkills = mergeUniqueItems(nextPageData.skills.softSkills, softSkills);
            nextPageData.skills.technicalSkills = mergeUniqueItems(nextPageData.skills.technicalSkills, technicalSkills);
            nextDismissedState.skillsDismissed = false;
            sectionLabel = "Skills";
            break;
        }
        case "qualifications":
        case "projects":
        case "achievements": {
            const sharedItem = buildSharedSectionItem(sectionType);

            if (!sharedItem) {
                return;
            }

            nextPageData[sectionType].items.push(sharedItem);

            if (sectionType === "qualifications") {
                nextDismissedState.qualificationsDismissed = false;
                sectionLabel = "Qualifications";
            }

            if (sectionType === "projects") {
                nextDismissedState.projectsDismissed = false;
                sectionLabel = "Projects";
            }

            if (sectionType === "achievements") {
                nextDismissedState.achievementsDismissed = false;
                sectionLabel = "Achievements";
            }

            break;
        }
        default:
            setFeedback("That section is not available yet.");
            return;
    }

    try {
        state.pageData = await profileGateway.savePageData(nextPageData);
        state.educationDismissed = nextDismissedState.educationDismissed;
        state.achievementsDismissed = nextDismissedState.achievementsDismissed;
        state.experienceDismissed = nextDismissedState.experienceDismissed;
        state.projectsDismissed = nextDismissedState.projectsDismissed;
        state.qualificationsDismissed = nextDismissedState.qualificationsDismissed;
        state.skillsDismissed = nextDismissedState.skillsDismissed;
        renderPage();
        syncEditorForm();
        closeAddSectionPanel();
        setFeedback(`${sectionLabel} has been added to the profile.`);
        scrollToSection(sectionType);
    } catch (error) {
        console.error("Unable to add the new section details.", error);
        setFeedback("The new section details could not be saved.");
    }
}

function parseSkillText(value) {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function buildEducationItem() {
    const school = elements.addSectionFields.educationSchool.value.trim();
    const field = elements.addSectionFields.educationField.value.trim();
    const dates = elements.addSectionFields.educationDates.value.trim();

    if (!school || !field || !dates) {
        setFeedback("Fill in all education details before saving.");
        focusFirstEmptyField([
            elements.addSectionFields.educationSchool,
            elements.addSectionFields.educationField,
            elements.addSectionFields.educationDates
        ]);
        return null;
    }

    return {
        id: createItemId("education"),
        logo: createLogoFromText(school),
        school,
        field,
        dates
    };
}

function buildExperienceItem() {
    const title = elements.addSectionFields.experienceTitle.value.trim();
    const company = elements.addSectionFields.experienceCompany.value.trim();
    const employmentType = elements.addSectionFields.experienceType.value.trim();
    const dates = elements.addSectionFields.experienceDates.value.trim();
    const duration = elements.addSectionFields.experienceDuration.value.trim();
    const locationType = elements.addSectionFields.experienceLocationType.value.trim();
    const description = elements.addSectionFields.experienceDescription.value.trim();

    if (!title || !company || !employmentType || !dates || !duration || !locationType || !description) {
        setFeedback("Fill in all experience details before saving.");
        focusFirstEmptyField([
            elements.addSectionFields.experienceTitle,
            elements.addSectionFields.experienceCompany,
            elements.addSectionFields.experienceType,
            elements.addSectionFields.experienceDates,
            elements.addSectionFields.experienceDuration,
            elements.addSectionFields.experienceLocationType,
            elements.addSectionFields.experienceDescription
        ]);
        return null;
    }

    return {
        id: createItemId("experience"),
        logo: createLogoFromText(title),
        title,
        company,
        employmentType,
        dates,
        duration,
        locationType,
        description
    };
}

function buildSharedSectionItem(sectionType) {
    const title = elements.addSectionFields.sharedTitle.value.trim();
    const subtitle = elements.addSectionFields.sharedSubtitle.value.trim();
    const dates = elements.addSectionFields.sharedDates.value.trim();
    const description = elements.addSectionFields.sharedDescription.value.trim();

    if (!title || !subtitle || !dates || !description) {
        setFeedback(`Fill in all ${sectionType} details before saving.`);
        focusFirstEmptyField([
            elements.addSectionFields.sharedTitle,
            elements.addSectionFields.sharedSubtitle,
            elements.addSectionFields.sharedDates,
            elements.addSectionFields.sharedDescription
        ]);
        return null;
    }

    return {
        id: createItemId(sectionType),
        logo: createLogoFromText(title),
        title,
        subtitle,
        dates,
        description
    };
}

function focusFirstEmptyField(fields) {
    const emptyField = fields.find((field) => field.value.trim() === "");

    if (emptyField) {
        emptyField.focus();
    }
}

function mergeUniqueItems(existingItems, newItems) {
    const seen = new Set();

    return [...existingItems, ...newItems].filter((item) => {
        const key = item.toLowerCase();

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function createItemId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createLogoFromText(value) {
    const match = value.trim().match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "?";
}

function formatPostCount(count) {
    return `${count} ${count === 1 ? "post" : "posts"} available`;
}

function readPersistedSession() {
    const localStorageSession = readLocalStorageSession();

    if (localStorageSession) {
        return localStorageSession;
    }

    const historyState = window.history.state;
    const savedSession = historyState && historyState[historyStateKey];

    if (!savedSession || typeof savedSession !== "object" || !savedSession.pageData || savedSession.version !== mockProfileVersion) {
        return null;
    }

    return cloneData(savedSession);
}

function readLocalStorageSession() {
    try {
        const savedSession = window.localStorage.getItem(localStorageKey);

        if (!savedSession) {
            return null;
        }

        const parsedSession = JSON.parse(savedSession);

        if (!parsedSession || typeof parsedSession !== "object" || !parsedSession.pageData || parsedSession.version !== mockProfileVersion) {
            return null;
        }

        return cloneData(parsedSession);
    } catch (error) {
        console.warn("Unable to read the editable profile state from local storage.", error);
        return null;
    }
}

function persistSessionState() {
    if (!state.pageData) {
        return;
    }

    try {
        // Temporary client-side persistence until the shared backend is connected.
        const sessionSnapshot = cloneData({
            version: mockProfileVersion,
            pageData: state.pageData,
            activityExpanded: state.activityExpanded,
            educationDismissed: state.educationDismissed,
            achievementsDismissed: state.achievementsDismissed,
            experienceDismissed: state.experienceDismissed,
            projectsDismissed: state.projectsDismissed,
            qualificationsDismissed: state.qualificationsDismissed,
            skillsDismissed: state.skillsDismissed
        });
        const nextHistoryState = {
            ...(window.history.state && typeof window.history.state === "object" ? window.history.state : {}),
            [historyStateKey]: cloneData(sessionSnapshot)
        };

        window.history.replaceState(nextHistoryState, document.title);
        window.localStorage.setItem(localStorageKey, JSON.stringify(sessionSnapshot));
    } catch (error) {
        console.warn("Unable to persist the editable profile state.", error);
    }
}

function closeSectionActionMenus(exceptionMenu = null) {
    let closedAny = false;

    document.querySelectorAll(".section-action-menu[open]").forEach((menu) => {
        if (menu === exceptionMenu) {
            return;
        }

        menu.open = false;
        closedAny = true;
    });

    return closedAny;
}

async function handleDeleteSection(sectionKey) {
    if (!state.pageData || !sectionDeleteConfig[sectionKey]) {
        return;
    }

    const nextPageData = cloneData(state.pageData);
    sectionDeleteConfig[sectionKey].delete(nextPageData);

    try {
        state.pageData = await profileGateway.savePageData(nextPageData);

        if (sectionKey === "education") {
            state.educationDismissed = false;
        }

        if (sectionKey === "qualifications") {
            state.qualificationsDismissed = false;
        }

        if (sectionKey === "experience") {
            state.experienceDismissed = false;
        }

        if (sectionKey === "skills") {
            state.skillsDismissed = false;
        }

        if (sectionKey === "projects") {
            state.projectsDismissed = false;
        }

        if (sectionKey === "achievements") {
            state.achievementsDismissed = false;
        }

        closeSectionActionMenus();
        renderPage();
        syncEditorForm();
        setFeedback(`${sectionDeleteConfig[sectionKey].label} section deleted.`);
    } catch (error) {
        console.error("Unable to delete the section.", error);
        setFeedback("The section could not be deleted.");
    }
}

async function handleDeletePost(postId) {
    if (!state.pageData) {
        return;
    }

    const nextPageData = cloneData(state.pageData);
    nextPageData.posts = nextPageData.posts.filter((post) => post.id !== postId);

    if (nextPageData.posts.length === 0) {
        state.activityExpanded = false;
    }

    try {
        state.pageData = await profileGateway.savePageData(nextPageData);
        renderPage();
        syncEditorForm();
        setFeedback("Post deleted.");
    } catch (error) {
        console.error("Unable to delete the post.", error);
        setFeedback("The post could not be deleted.");
    }
}

function scrollToSection(sectionType) {
    const sectionMap = {
        education: elements.educationSection,
        experience: elements.experienceSection,
        qualifications: elements.qualificationsSection,
        skills: elements.skillsSection,
        projects: elements.projectsSection,
        achievements: elements.achievementsSection
    };
    const targetSection = sectionMap[sectionType];

    if (!targetSection) {
        return;
    }

    targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function handleDismissQualifications() {
    state.qualificationsDismissed = true;
    renderQualifications();
    persistSessionState();
    setFeedback("Qualifications suggestions hidden.");
}

function handleDismissEducation() {
    state.educationDismissed = true;
    renderEducation();
    persistSessionState();
    setFeedback("Education suggestions hidden.");
}

function handleDismissSkills() {
    state.skillsDismissed = true;
    renderSkills();
    persistSessionState();
    setFeedback("Skills suggestions hidden.");
}

function handleDismissExperience() {
    state.experienceDismissed = true;
    renderExperience();
    persistSessionState();
    setFeedback("Experience suggestions hidden.");
}

function handleDismissProjects() {
    state.projectsDismissed = true;
    renderProjects();
    persistSessionState();
    setFeedback("Projects suggestions hidden.");
}

function handleDismissAchievements() {
    state.achievementsDismissed = true;
    renderAchievements();
    persistSessionState();
    setFeedback("Achievements suggestions hidden.");
}

function handleToggleActivityPosts() {
    if (state.pageData.posts.length === 0) {
        setFeedback("There are no posts available yet.");
        return;
    }

    state.activityExpanded = !state.activityExpanded;
    renderActivity();
    persistSessionState();

    if (state.activityExpanded) {
        elements.activityPostsList.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

function toggleAvatarMenu() {
    const shouldOpen = elements.avatarMenu.hidden;
    elements.avatarMenu.hidden = !shouldOpen;
    elements.avatarMenuButton.setAttribute("aria-expanded", String(shouldOpen));
}

function closeAvatarMenu() {
    elements.avatarMenu.hidden = true;
    elements.avatarMenuButton.setAttribute("aria-expanded", "false");
}

function handleViewProfile() {
    closeAvatarMenu();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function triggerPhotoPicker() {
    closeAvatarMenu();
    elements.photoInput.click();
}

async function handlePhotoSelection(event) {
    const [file] = event.target.files || [];

    if (!file) {
        return;
    }

    try {
        const photoUrl = await profileGateway.uploadProfilePhoto(file);
        releaseTemporaryPhotoUrl();
        state.temporaryPhotoUrl = photoUrl;
        state.pageData.profile.photoUrl = photoUrl;
        renderProfile();
        persistSessionState();
        setFeedback("Profile picture updated for this demo session.");
    } catch (error) {
        console.error("Unable to update the profile picture.", error);
        setFeedback("The profile picture could not be updated.");
    } finally {
        elements.photoInput.value = "";
    }
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

function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function releaseTemporaryPhotoUrl() {
    if (!state.temporaryPhotoUrl || !state.temporaryPhotoUrl.startsWith("blob:")) {
        return;
    }

    URL.revokeObjectURL(state.temporaryPhotoUrl);
    state.temporaryPhotoUrl = "";
}
