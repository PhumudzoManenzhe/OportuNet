const initialPageData = Object.freeze({
    // Mock recruiter profile data used to render the editable demo before a shared backend exists.
    profile: {
        name: "Ayesha Patel",
        headline: "Senior Talent Partner | Building strong hiring pipelines for product, operations, and customer teams",
        institution: "Vertex People Solutions",
        campus: "Johannesburg Hub",
        location: "Johannesburg, Gauteng, South Africa",
        addSectionButton: "Add section",
        photoUrl: ""
    },
    analytics: {
        privacy: "Private to you",
        items: [
            {
                id: "views",
                icon: "<span class=\"metric-icon-badge metric-icon-badge-views\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M2.75 12S6.4 6.75 12 6.75 21.25 12 21.25 12 17.6 17.25 12 17.25 2.75 12 2.75 12Z\"></path><circle cx=\"12\" cy=\"12\" r=\"2.7\"></circle></svg></span>",
                title: "412 profile visits",
                description: "Hiring managers and business partners found your profile through recruiter and talent searches.",
                period: ""
            },
            {
                id: "impressions",
                icon: "<span class=\"metric-icon-badge metric-icon-badge-impressions\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4.5 18.5H19.5\"></path><path d=\"M7 18.5V12.75\"></path><path d=\"M11.33 18.5V9.25\"></path><path d=\"M15.67 18.5V6.25\"></path><path d=\"M20 18.5V11\"></path></svg></span>",
                title: "128 update impressions",
                description: "Recent hiring and culture updates are getting steady visibility.",
                period: "Past 7 days"
            }
        ]
    },
    about: {
        intro: "I lead recruitment partnerships for growing teams and help businesses build thoughtful, well-structured hiring pipelines that balance speed, fit, and candidate experience.",
        passion: "My focus is on aligning open roles with business goals, workspace realities, and team culture while keeping the hiring journey clear for candidates and hiring managers."
    },
    qualifications: {
        intro: "Highlight the markets, departments, or role levels your team is actively hiring for.",
        buttonLabel: "Add hiring focus",
        items: [
            {
                id: "qualification-1",
                logo: "T",
                title: "Technology and Product Hiring",
                subtitle: "Frontend, backend, product design, and QA",
                dates: "Active in 2026",
                description: "Partnering with engineering and product leads to fill delivery-critical roles across multiple squads."
            },
            {
                id: "qualification-2",
                logo: "O",
                title: "Operations and Support Teams",
                subtitle: "Customer support, onboarding, and office operations",
                dates: "Quarter 2 hiring",
                description: "Supporting steady business growth with structured hiring for customer-facing and internal operations roles."
            }
        ]
    },
    activity: {
        createPostLabel: "Share an update",
        emptyTitle: "Recruiter updates are available",
        emptyCopy: "Hiring notes, role announcements, and company updates shared from this profile will appear here. Use Show all to view the full list."
    },
    posts: [
        {
            id: "post-1",
            content: "We opened applications for two frontend roles this week and the response has been strong already. Clearer role briefs are making the screening stage much smoother.",
            timestamp: "2026-04-10T09:15:00+02:00"
        },
        {
            id: "post-2",
            content: "Our hiring team spent time tightening interview scorecards this month. It has made feedback loops clearer for both candidates and hiring managers.",
            timestamp: "2026-04-07T16:40:00+02:00"
        },
        {
            id: "post-3",
            content: "We are continuing to grow our operations and customer support teams across multiple workspaces. Excited about the talent conversations coming through.",
            timestamp: "2026-04-04T13:05:00+02:00"
        }
    ],
    experience: [
        {
            id: "experience-1",
            logo: "J",
            title: "Johannesburg Talent Hub",
            company: "Vertex People Solutions",
            employmentType: "In-house recruitment workspace",
            dates: "Mon-Fri | 08:00-17:00",
            duration: "12 recruiters",
            locationType: "Hybrid",
            description: "Central hiring workspace for sourcing, screening, stakeholder meetings, and weekly recruiting reviews."
        },
        {
            id: "experience-2",
            logo: "C",
            title: "Cape Town Operations Desk",
            company: "Regional hiring support",
            employmentType: "Satellite workspace",
            dates: "Tue-Thu | Collaboration days",
            duration: "5 coordinators",
            locationType: "On-site",
            description: "Supports interviews, candidate onboarding, and coordination for high-volume roles in the Western Cape."
        }
    ],
    education: [
        {
            id: "education-1",
            logo: "V",
            school: "Vertex People Solutions",
            field: "Recruitment and talent advisory",
            dates: "51-200 employees"
        },
        {
            id: "education-2",
            logo: "N",
            school: "Nexa Workspace Group",
            field: "Flexible office and hiring support",
            dates: "3 workspaces across South Africa"
        }
    ],
    skills: {
        intro: "Add the roles, tools, and hiring channels that define how your team recruits.",
        softSkills: [
            "Software engineers",
            "Product designers",
            "Customer success",
            "Operations coordinators"
        ],
        technicalSkills: [
            "LinkedIn Recruiter",
            "Greenhouse",
            "Google Workspace",
            "Microsoft Teams"
        ]
    },
    projects: {
        intro: "Show the roles your business is currently hiring for so candidates and partners can quickly scan opportunities.",
        buttonLabel: "Add open role",
        items: [
            {
                id: "project-1",
                logo: "F",
                title: "Senior Frontend Developer",
                subtitle: "Johannesburg | Hybrid",
                dates: "Applications open now",
                description: "Leading UI delivery across customer-facing products and mentoring a small frontend team."
            },
            {
                id: "project-2",
                logo: "C",
                title: "Customer Success Lead",
                subtitle: "Cape Town | On-site",
                dates: "Shortlist in progress",
                description: "Owning onboarding quality, escalations, and customer retention support for a growing service team."
            }
        ]
    },
    achievements: {
        intro: "Use this space for visible company milestones, hiring wins, or culture moments worth sharing.",
        buttonLabel: "Add highlight",
        items: [
            {
                id: "achievement-1",
                logo: "W",
                title: "Expanded to a third workspace location",
                subtitle: "Operations and recruitment growth",
                dates: "2026",
                description: "Opened a new collaborative hiring space to support cross-functional interview days and client workshops."
            },
            {
                id: "achievement-2",
                logo: "R",
                title: "Reduced time-to-hire by 28%",
                subtitle: "Recruitment process improvement",
                dates: "Past 12 months",
                description: "Introduced structured screening and shared scorecards to shorten decision cycles without losing candidate quality."
            }
        ]
    }
});

// Deep-clone nested data so editable state changes do not mutate the frozen defaults directly.
function cloneData(value) {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

// Gateway abstraction that stands in for future backend reads, saves, and media uploads.
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

// Runtime state for open panels, dismissed placeholders, persisted data, and temporary media.
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
    feedbackTimer: null,
    temporaryPhotoUrl: "",
    isEditorOpen: false
};

// Cache DOM references used throughout rendering, editing, adding sections, and feedback flows.
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
    profileBackButton: document.getElementById("profile-back-button"),
    profileHeadline: document.getElementById("profile-headline"),
    profileInstitution: document.getElementById("profile-institution"),
    profileLocation: document.getElementById("profile-location"),
    profileName: document.getElementById("profile-name"),
    profilePhoto: document.getElementById("profile-photo"),
    profileSearchForm: document.getElementById("profile-search-form"),
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
    supplementalAddGroup: document.getElementById("supplemental-add-group"),
    supplementalLegend: document.getElementById("supplemental-legend"),
    viewProfileOption: document.getElementById("view-profile-option"),
    activityEmptyTitle: document.getElementById("activity-empty-title"),
    activityEmptyCopy: document.getElementById("activity-empty-copy"),
    achievementsSection: document.getElementById("achievements-section"),
    educationAddGroup: document.getElementById("education-add-group"),
    experienceAddGroup: document.getElementById("experience-add-group"),
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
        sharedDescription: document.getElementById("add-shared-description-input")
    }
};

// Copy used to relabel the shared add-section form for supplemental recruiter sections.
const supplementalSectionCopy = {
    qualifications: {
        legend: "Hiring focus details",
        title: "Hiring focus area",
        subtitle: "Departments, roles or markets",
        dates: "Current period",
        description: "Hiring focus summary"
    },
    projects: {
        legend: "Open role details",
        title: "Role title",
        subtitle: "Location, team or level",
        dates: "Hiring timeline",
        description: "Role summary"
    },
    achievements: {
        legend: "Company highlight details",
        title: "Highlight title",
        subtitle: "Team, campaign or context",
        dates: "Date or period",
        description: "Highlight summary"
    }
};

// Placeholder copy shown before business details or workspace details have any saved items.
const primarySectionPlaceholderCopy = {
    education: {
        intro: "Add your business name, industry, and company size so visitors can understand the organization behind this recruiter profile.",
        buttonLabel: "Add business details"
    },
    experience: {
        intro: "Add the workspace setup, team size, and operating details candidates should know before engaging with your team.",
        buttonLabel: "Add workspace details"
    }
};

// Delete rules and labels for each removable recruiter profile section.
const sectionDeleteConfig = {
    education: {
        label: "Business Details",
        delete(pageData) {
            pageData.education = [];
        }
    },
    experience: {
        label: "Workspace Details",
        delete(pageData) {
            pageData.experience = [];
        }
    },
    qualifications: {
        label: "Hiring Focus",
        delete(pageData) {
            pageData.qualifications.items = [];
        }
    },
    projects: {
        label: "Open Roles",
        delete(pageData) {
            pageData.projects.items = [];
        }
    },
    achievements: {
        label: "Company Highlights",
        delete(pageData) {
            pageData.achievements.items = [];
        }
    }
};

// Human-readable section names reused by editor headings and feedback messages.
const editorSectionLabels = {
    profile: "Profile",
    analytics: "Analytics",
    about: "About",
    activity: "Activity",
    experience: "Workspace Details",
    education: "Business Details",
    qualifications: "Hiring Focus",
    projects: "Open Roles",
    achievements: "Company Highlights"
};

// Map individual editor inputs back to the profile section they belong to.
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
    "qualifications-intro-input": "qualifications",
    "qualifications-button-input": "qualifications",
    "projects-intro-input": "projects",
    "projects-button-input": "projects",
    "achievements-intro-input": "achievements",
    "achievements-button-input": "achievements"
};

// Keys used to persist the editable recruiter profile state between refreshes.
const historyStateKey = "recruiterProfilePageSession";
const localStorageKey = "recruiterEditableProfilePageSession";
const mockProfileVersion = "2026-04-12-recruiter-profile";

// Start the recruiter profile flow once the DOM is ready, and clean up temporary photo URLs on exit.
document.addEventListener("DOMContentLoaded", initializePage);
window.addEventListener("beforeunload", releaseTemporaryPhotoUrl);

// Restore a saved session when available, otherwise load mock data and render the full page.
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
        renderPage();
        syncEditorForm();
    } catch (error) {
        console.error("Unable to load the profile page.", error);
        setFeedback("The profile page could not be loaded.");
    }
}

// Attach all interactive behaviors for editing, adding, dismissing, deleting, and media actions.
function bindEvents() {
    if (elements.profileBackButton) {
        elements.profileBackButton.addEventListener("click", handleBackNavigation);
    }

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
    elements.editorForm.addEventListener("submit", handleSave);
    elements.closeEditorButton.addEventListener("click", closeEditor);
    elements.cancelEditorButton.addEventListener("click", closeEditor);
    elements.activityShowAllButton.addEventListener("click", handleToggleActivityPosts);

    if (elements.profileSearchForm) {
        elements.profileSearchForm.addEventListener("submit", handleSearchSubmit);
    }

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

function handleBackNavigation() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = "../Recruiter_homepage/index.html";
}

// Show placeholder feedback until recruiter profile search is connected to the broader app shell.
function handleSearchSubmit(event) {
    event.preventDefault();
    setFeedback("Search will be connected to the wider application shell.");
}

// Render every visible section of the recruiter profile using the latest page state.
function renderPage() {
    renderProfile();
    renderAnalytics();
    renderAbout();
    renderEducation();
    renderExperience();
    renderQualifications();
    renderProjects();
    renderAchievements();
    renderActivity();
    persistSessionState();
}

// Render the summary card, top-level action label, and avatar state.
function renderProfile() {
    const { profile } = state.pageData;

    elements.profileName.textContent = profile.name;
    elements.profileHeadline.textContent = profile.headline;
    elements.profileInstitution.textContent = profile.institution;
    elements.profileLocation.textContent = profile.location;
    elements.addSectionButton.textContent = profile.addSectionButton;

    renderAvatar(profile);
}

// Show either the selected profile photo or an initials fallback avatar.
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

// Render the private analytics cards shown near the top of the recruiter profile.
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

// Render the recruiter or business introduction text.
function renderAbout() {
    elements.aboutIntro.textContent = state.pageData.about.intro;
    elements.aboutPassion.textContent = state.pageData.about.passion;
    elements.aboutIntro.hidden = !state.pageData.about.intro;
    elements.aboutPassion.hidden = !state.pageData.about.passion;
}

// Render the hiring-focus section, including placeholder and active states.
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

// Render the activity summary and optionally reveal the recruiter's posts.
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

// Render each recruiter post into the expandable activity list.
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

// Render the workspace-details section and its placeholder/active views.
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

// Render the business-details section and its placeholder/active views.
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

// Render the open-roles section and its placeholder/active views.
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

// Render the company-highlights section and its placeholder/active views.
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

// Shared renderer for supplemental sections such as hiring focus, open roles, and highlights.
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

// Shared renderer for primary sections that can switch between empty prompts and saved entries.
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

// Render business detail entries using the education-style card template.
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

// Render workspace detail entries using the shared resume-style template.
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

// Render shared list-card sections such as hiring focus, roles, and highlights.
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

// Copy the current profile state into the editor inputs before opening edit panels.
function syncEditorForm() {
    const { profile, analytics, about, qualifications, activity, experience, education, projects, achievements } = state.pageData;
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
    elements.formFields.projectsIntro.value = projects.intro;
    elements.formFields.projectsButton.value = projects.buttonLabel;
    elements.formFields.achievementsIntro.value = achievements.intro;
    elements.formFields.achievementsButton.value = achievements.buttonLabel;
}

// Open the main editor and focus the field tied to the clicked edit control.
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

// Close the main editor panel and release its locked-scroll state.
function closeEditor() {
    state.isEditorOpen = false;
    state.activeEditorSection = "";
    elements.editorPanel.hidden = true;
    updateEditorSections("");
    updateEditorHeading("");
    updatePanelLockState();
}

// Open the add-section panel, optionally preselecting the requested section type.
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

// Close the add-section panel and clear any temporary form state.
function closeAddSectionPanel() {
    state.isAddSectionOpen = false;
    elements.addSectionPanel.hidden = true;
    elements.addSectionForm.reset();
    updateAddSectionFields("");
    updatePanelLockState();
}

// Reset and reconfigure the add-section form after a panel open or close event.
function resetAddSectionForm(sectionType) {
    elements.addSectionForm.reset();
    elements.addSectionSelect.value = sectionType;
    updateAddSectionFields(sectionType);
}

// Prevent background scrolling while either the editor or add-section panel is open.
function updatePanelLockState() {
    document.body.classList.toggle("editor-open", state.isEditorOpen || state.isAddSectionOpen);
}

// Resolve which editor group belongs to a given form-field id.
function getEditorSectionForTarget(targetId) {
    return editorTargetSectionMap[targetId] || "";
}

// Show only the fieldset relevant to the section currently being edited.
function updateEditorSections(activeSection) {
    document.querySelectorAll("[data-editor-section]").forEach((group) => {
        const isVisible = !activeSection || group.dataset.editorSection === activeSection;
        group.hidden = !isVisible;

        group.querySelectorAll("input, textarea, select").forEach((field) => {
            field.disabled = !isVisible;
        });
    });
}

// Update the editor heading so it reflects the active section.
function updateEditorHeading(activeSection) {
    elements.editorHeading.textContent = activeSection
        ? `Edit ${editorSectionLabels[activeSection]}`
        : "Edit profile content";
}

// React to section changes inside the add-section form.
function handleAddSectionChoiceChange() {
    updateAddSectionFields(elements.addSectionSelect.value);
}

// Re-label and show the correct add-section inputs for the chosen section type.
function updateAddSectionFields(sectionType) {
    const isSupplemental = Object.prototype.hasOwnProperty.call(supplementalSectionCopy, sectionType);

    elements.educationAddGroup.hidden = sectionType !== "education";
    elements.experienceAddGroup.hidden = sectionType !== "experience";
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

// Return the most useful first input to focus for the selected add-section type.
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
        default:
            return null;
    }
}

// Save edits from the main editor panel back into the current recruiter profile state.
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

// Validate and append a brand-new entry to the recruiter section chosen in the add panel.
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
        qualificationsDismissed: state.qualificationsDismissed
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
            sectionLabel = "Business Details";
            break;
        }
        case "experience": {
            const experienceItem = buildExperienceItem();

            if (!experienceItem) {
                return;
            }

            nextPageData.experience.push(experienceItem);
            nextDismissedState.experienceDismissed = false;
            sectionLabel = "Workspace Details";
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
                sectionLabel = "Hiring Focus";
            }

            if (sectionType === "projects") {
                nextDismissedState.projectsDismissed = false;
                sectionLabel = "Open Roles";
            }

            if (sectionType === "achievements") {
                nextDismissedState.achievementsDismissed = false;
                sectionLabel = "Company Highlights";
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

// Normalize multi-value text input into a clean array of distinct skill-like entries.
function parseSkillText(value) {
    return value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean);
}

// Build and validate a business-details entry from the add-section form.
function buildEducationItem() {
    const school = elements.addSectionFields.educationSchool.value.trim();
    const field = elements.addSectionFields.educationField.value.trim();
    const dates = elements.addSectionFields.educationDates.value.trim();

    if (!school || !field || !dates) {
        setFeedback("Fill in all business details before saving.");
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

// Build and validate a workspace-details entry from the add-section form.
function buildExperienceItem() {
    const title = elements.addSectionFields.experienceTitle.value.trim();
    const company = elements.addSectionFields.experienceCompany.value.trim();
    const employmentType = elements.addSectionFields.experienceType.value.trim();
    const dates = elements.addSectionFields.experienceDates.value.trim();
    const duration = elements.addSectionFields.experienceDuration.value.trim();
    const locationType = elements.addSectionFields.experienceLocationType.value.trim();
    const description = elements.addSectionFields.experienceDescription.value.trim();

    if (!title || !company || !employmentType || !dates || !duration || !locationType || !description) {
        setFeedback("Fill in all workspace details before saving.");
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

// Build and validate a shared supplemental entry such as a role or company highlight.
function buildSharedSectionItem(sectionType) {
    const title = elements.addSectionFields.sharedTitle.value.trim();
    const subtitle = elements.addSectionFields.sharedSubtitle.value.trim();
    const dates = elements.addSectionFields.sharedDates.value.trim();
    const description = elements.addSectionFields.sharedDescription.value.trim();

    if (!title || !subtitle || !dates || !description) {
        setFeedback(`Fill in all ${editorSectionLabels[sectionType].toLowerCase()} details before saving.`);
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

// Focus the first incomplete field when validation fails inside a form panel.
function focusFirstEmptyField(fields) {
    const emptyField = fields.find((field) => field.value.trim() === "");

    if (emptyField) {
        emptyField.focus();
    }
}

// Merge arrays of text values while removing duplicates case-insensitively.
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

// Generate a unique identifier for newly created profile items.
function createItemId(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

// Create a single-character fallback badge from a piece of text.
function createLogoFromText(value) {
    const match = value.trim().match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "?";
}

// Format activity counts with singular or plural wording.
function formatPostCount(count) {
    return `${count} ${count === 1 ? "post" : "posts"} available`;
}

// Restore a previously saved editable session from local storage or history state.
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

// Read and validate the recruiter profile snapshot stored in local storage.
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

// Persist the current recruiter demo session so edits survive refreshes.
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
            qualificationsDismissed: state.qualificationsDismissed
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

// Close any open section action menus, except an optional one that should stay open.
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

// Remove all entries from a chosen section and refresh the profile state.
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

// Delete an activity post from the recruiter profile feed.
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

// Scroll smoothly to a section after new content has been added there.
function scrollToSection(sectionType) {
    const sectionMap = {
        education: elements.educationSection,
        experience: elements.experienceSection,
        qualifications: elements.qualificationsSection,
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

// Hide the placeholder prompt for hiring focus suggestions.
function handleDismissQualifications() {
    state.qualificationsDismissed = true;
    renderQualifications();
    persistSessionState();
    setFeedback("Hiring focus suggestions hidden.");
}

// Hide the placeholder prompt for business details suggestions.
function handleDismissEducation() {
    state.educationDismissed = true;
    renderEducation();
    persistSessionState();
    setFeedback("Business details suggestions hidden.");
}

// Hide the placeholder prompt for workspace details suggestions.
function handleDismissExperience() {
    state.experienceDismissed = true;
    renderExperience();
    persistSessionState();
    setFeedback("Workspace details suggestions hidden.");
}

// Hide the placeholder prompt for open role suggestions.
function handleDismissProjects() {
    state.projectsDismissed = true;
    renderProjects();
    persistSessionState();
    setFeedback("Open roles suggestions hidden.");
}

// Hide the placeholder prompt for company highlight suggestions.
function handleDismissAchievements() {
    state.achievementsDismissed = true;
    renderAchievements();
    persistSessionState();
    setFeedback("Company highlights suggestions hidden.");
}

// Expand or collapse the recruiter activity posts section.
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

// Open or close the avatar action menu beneath the profile photo.
function toggleAvatarMenu() {
    const shouldOpen = elements.avatarMenu.hidden;
    elements.avatarMenu.hidden = !shouldOpen;
    elements.avatarMenuButton.setAttribute("aria-expanded", String(shouldOpen));
}

// Force the avatar action menu closed.
function closeAvatarMenu() {
    elements.avatarMenu.hidden = true;
    elements.avatarMenuButton.setAttribute("aria-expanded", "false");
}

// Scroll back to the top of the page when the avatar menu requests a profile view.
function handleViewProfile() {
    closeAvatarMenu();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Trigger the hidden file input so the recruiter can choose a profile photo.
function triggerPhotoPicker() {
    closeAvatarMenu();
    elements.photoInput.click();
}

// Read the selected image file and update the avatar preview for this demo session.
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

// Show short-lived feedback messages near the bottom of the screen.
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

// Create a two-letter initials fallback from the recruiter name.
function getInitials(name) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

// Revoke any temporary object URL so preview resources do not leak.
function releaseTemporaryPhotoUrl() {
    if (!state.temporaryPhotoUrl || !state.temporaryPhotoUrl.startsWith("blob:")) {
        return;
    }

    URL.revokeObjectURL(state.temporaryPhotoUrl);
    state.temporaryPhotoUrl = "";
}
