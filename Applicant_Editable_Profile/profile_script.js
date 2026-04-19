const initialPageData = Object.freeze({
    profile: {
        name: "Naledi Mokoena",
        addSectionButton: "Add section",
        photoUrl: ""
    },
    about: {
        intro: "I am a frontend developer with a growing focus on UX research and interface design. I enjoy turning complex workflows into simple, welcoming experiences that people can use with confidence.",
        passion: "Most of my work revolves around education, community tools, and accessible web interfaces. I like combining structure, visual polish, and practical problem solving."
    },
    education: [
        { id: "education-1", logo: "U", school: "University of Pretoria", field: "BSc Information and Knowledge Systems", dates: "2022 - 2025" },
        { id: "education-2", logo: "O", school: "Open Design Academy", field: "Short Course in Product Design", dates: "2025" }
    ],
    qualifications: {
        intro: "Highlight certifications and focused learning that strengthen your design and frontend practice.",
        buttonLabel: "Add qualifications",
        items: [
            { id: "qualification-1", logo: "G", title: "Google UX Design Certificate", subtitle: "Coursera - Google", dates: "2025", description: "Completed training in user research, wireframing, prototyping, and usability testing." },
            { id: "qualification-2", logo: "R", title: "Responsive Web Design Certification", subtitle: "freeCodeCamp", dates: "2024", description: "Covered semantic HTML, modern CSS layouts, and accessibility-focused frontend practice." }
        ]
    },
    skills: {
        intro: "Add the soft and technical skills that reflect how you work and what you build.",
        softSkills: ["Facilitation", "Active listening", "Collaboration", "Presentation design"],
        technicalSkills: ["HTML & CSS", "JavaScript", "Figma", "User research"]
    },
    personalDetails: {
        phone: "+27 72 555 0184",
        email: "naledi.mokoena@example.com",
        address: "458 Park Street\nArcadia, Pretoria\nGauteng, South Africa"
    },
    cv: {
        fileName: "",
        fileUrl: ""
    }
});

const SECTION_LABELS = Object.freeze({
    profile: "Profile",
    about: "About",
    education: "Education",
    qualifications: "Qualifications",
    skills: "Skills",
    personalDetails: "Personal details"
});

const EDUCATION_EMPTY_STATE = Object.freeze({
    intro: "Add your school, study field, and dates so people can quickly understand your academic background.",
    buttonLabel: "Add education"
});

const QUALIFICATION_FIELD_COPY = Object.freeze({
    legend: "Qualification details",
    title: "Qualification title",
    subtitle: "Issuer or institution",
    dates: "Date or period",
    description: "Qualification details"
});

const HAS_DOM = typeof document !== "undefined";
const HAS_WINDOW = typeof window !== "undefined";

function cloneData(value) {
    return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(typeof reader.result === "string" ? reader.result : ""));
        reader.addEventListener("error", () => reject(reader.error || new Error("Unable to read the selected file.")));
        reader.readAsDataURL(file);
    });
}

function isPdfFile(file) {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

const profileGateway = {
    async fetchPageData() { return cloneData(initialPageData); },
    async savePageData(pageData) { return cloneData(pageData); },
    async uploadProfilePhoto(file) { return readFileAsDataUrl(file); },
    async uploadCv(file) { return readFileAsDataUrl(file); }
};

const state = {
    activeEditorSection: "",
    feedbackTimer: null,
    isAddSectionOpen: false,
    isEditorOpen: false,
    isInitialized: false,
    pageData: null,
    temporaryPhotoUrl: ""
};

const $ = (id) => (HAS_DOM ? document.getElementById(id) : null);
const $$ = (selector) => (HAS_DOM ? Array.from(document.querySelectorAll(selector)) : []);
const ids = (pairs) => Object.fromEntries(pairs.map(([key, id]) => [key, $(id)]));
const readValue = (field) => field?.value.trim() || "";
const setText = (node, value = "") => node && (node.textContent = value);

const elements = {
    ...ids([
        ["aboutIntro", "about-intro"],
        ["aboutPassion", "about-passion"],
        ["addSectionButton", "add-section-button"],
        ["addSectionForm", "add-section-form"],
        ["addSectionPanel", "add-section-panel"],
        ["addSectionSelect", "add-section-select"],
        ["avatarFallback", "avatar-fallback"],
        ["avatarMenu", "avatar-menu"],
        ["avatarMenuButton", "avatar-menu-button"],
        ["cancelAddSectionButton", "cancel-add-section-button"],
        ["cancelEditorButton", "cancel-editor-button"],
        ["changePhotoOption", "change-photo-option"],
        ["closeAddSectionButton", "close-add-section-button"],
        ["closeEditorButton", "close-editor-button"],
        ["cvFileName", "cv-file-name"],
        ["cvFileNote", "cv-file-note"],
        ["cvInput", "cv-input"],
        ["editorForm", "editor-form"],
        ["editorHeading", "editor-heading"],
        ["editorPanel", "editor-panel"],
        ["educationActiveHeader", "education-active-header"],
        ["educationAddButton", "education-add-button"],
        ["educationAddGroup", "education-add-group"],
        ["educationIntro", "education-intro"],
        ["educationList", "education-list"],
        ["educationPlaceholder", "education-placeholder"],
        ["educationSection", "education-section"],
        ["educationTemplate", "education-item-template"],
        ["feedback", "page-feedback"],
        ["personalAddress", "personal-address"],
        ["personalEmail", "personal-email"],
        ["personalPhone", "personal-phone"],
        ["photoInput", "photo-input"],
        ["profileName", "profile-name"],
        ["profilePhoto", "profile-photo"],
        ["qualificationsActiveHeader", "qualifications-active-header"],
        ["qualificationsAddButton", "qualifications-add-button"],
        ["qualificationsIntro", "qualifications-intro"],
        ["qualificationsList", "qualifications-list"],
        ["qualificationsPlaceholder", "qualifications-placeholder"],
        ["qualificationsSection", "qualifications-section"],
        ["resumeTemplate", "resume-item-template"],
        ["sharedDatesLabel", "shared-dates-label"],
        ["sharedDescriptionLabel", "shared-description-label"],
        ["sharedSubtitleLabel", "shared-subtitle-label"],
        ["sharedTitleLabel", "shared-title-label"],
        ["skillGroupTemplate", "skill-group-template"],
        ["skillsActiveHeader", "skills-active-header"],
        ["skillsAddButton", "skills-add-button"],
        ["skillsAddGroup", "skills-add-group"],
        ["skillsList", "skills-list"],
        ["skillsPlaceholder", "skills-placeholder"],
        ["skillsPlaceholderIntro", "skills-placeholder-intro"],
        ["skillsSection", "skills-section"],
        ["supplementalAddGroup", "supplemental-add-group"],
        ["supplementalLegend", "supplemental-legend"],
        ["uploadCvButton", "upload-cv-button"],
        ["viewCvLink", "view-cv-link"],
        ["viewProfileOption", "view-profile-option"]
    ]),
    editorGroups: $$("[data-editor-section]"),
    addSectionFields: ids([
        ["educationSchool", "add-education-school-input"],
        ["educationField", "add-education-field-input"],
        ["educationDates", "add-education-dates-input"],
        ["sharedTitle", "add-shared-title-input"],
        ["sharedSubtitle", "add-shared-subtitle-input"],
        ["sharedDates", "add-shared-dates-input"],
        ["sharedDescription", "add-shared-description-input"],
        ["softSkills", "add-soft-skills-input"],
        ["technicalSkills", "add-technical-skills-input"]
    ]),
    formFields: ids([
        ["aboutIntro", "about-intro-input"],
        ["aboutPassion", "about-passion-input"],
        ["address", "address-input"],
        ["educationDates", "education-dates-input"],
        ["educationField", "education-field-input"],
        ["educationSchool", "education-school-input"],
        ["email", "email-input"],
        ["phone", "phone-input"],
        ["profileName", "profile-name-input"],
        ["qualificationsButton", "qualifications-button-input"],
        ["qualificationsIntro", "qualifications-intro-input"],
        ["softSkills", "soft-skills-input"],
        ["technicalSkills", "technical-skills-input"]
    ])
};

const editorTargetMap = Object.freeze({
    "profile-name-input": "profile",
    "about-intro-input": "about",
    "about-passion-input": "about",
    "education-school-input": "education",
    "education-field-input": "education",
    "education-dates-input": "education",
    "qualifications-intro-input": "qualifications",
    "qualifications-button-input": "qualifications",
    "soft-skills-input": "skills",
    "technical-skills-input": "skills",
    "phone-input": "personalDetails",
    "email-input": "personalDetails",
    "address-input": "personalDetails"
});

const sectionViews = {
    education: {
        section: elements.educationSection,
        placeholder: elements.educationPlaceholder,
        header: elements.educationActiveHeader,
        list: elements.educationList,
        intro: elements.educationIntro,
        button: elements.educationAddButton,
        getItems: (pageData) => pageData.education,
        getIntro: () => EDUCATION_EMPTY_STATE.intro,
        getButton: () => EDUCATION_EMPTY_STATE.buttonLabel,
        render: renderEducationItems
    },
    qualifications: {
        section: elements.qualificationsSection,
        placeholder: elements.qualificationsPlaceholder,
        header: elements.qualificationsActiveHeader,
        list: elements.qualificationsList,
        intro: elements.qualificationsIntro,
        button: elements.qualificationsAddButton,
        getItems: (pageData) => pageData.qualifications.items,
        getIntro: (pageData) => pageData.qualifications.intro,
        getButton: (pageData) => pageData.qualifications.buttonLabel,
        render: renderResumeItems
    },
    skills: {
        section: elements.skillsSection,
        placeholder: elements.skillsPlaceholder,
        header: elements.skillsActiveHeader,
        list: elements.skillsList,
        intro: elements.skillsPlaceholderIntro,
        button: elements.skillsAddButton,
        getItems: (pageData) => getSkillGroups(pageData.skills),
        getIntro: (pageData) => pageData.skills.intro,
        getButton: () => "Add skills",
        render: renderSkillGroups
    }
};

const saveHandlers = {
    profile(pageData) {
        Object.assign(pageData.profile, {
            name: readValue(elements.formFields.profileName)
        });
    },
    about(pageData) {
        Object.assign(pageData.about, {
            intro: readValue(elements.formFields.aboutIntro),
            passion: readValue(elements.formFields.aboutPassion)
        });
    },
    education(pageData) {
        const item = pageData.education[0] || createEmptyEducationItem();
        Object.assign(item, {
            school: readValue(elements.formFields.educationSchool),
            field: readValue(elements.formFields.educationField),
            dates: readValue(elements.formFields.educationDates),
            logo: createLogoFromText(readValue(elements.formFields.educationSchool))
        });
        pageData.education[0] = item;
    },
    qualifications(pageData) {
        Object.assign(pageData.qualifications, {
            intro: readValue(elements.formFields.qualificationsIntro),
            buttonLabel: readValue(elements.formFields.qualificationsButton)
        });
    },
    skills(pageData) {
        pageData.skills.softSkills = parseSkillText(elements.formFields.softSkills.value);
        pageData.skills.technicalSkills = parseSkillText(elements.formFields.technicalSkills.value);
    },
    personalDetails(pageData) {
        Object.assign(pageData.personalDetails, {
            phone: readValue(elements.formFields.phone),
            email: readValue(elements.formFields.email),
            address: readValue(elements.formFields.address)
        });
    }
};

const addHandlers = {
    education(pageData) {
        const item = buildEducationItem();
        if (!item) return null;
        pageData.education.push(item);
        return "education";
    },
    qualifications(pageData) {
        const item = buildQualificationItem();
        if (!item) return null;
        pageData.qualifications.items.push(item);
        return "qualifications";
    },
    skills(pageData) {
        const softSkills = parseSkillText(elements.addSectionFields.softSkills.value);
        const technicalSkills = parseSkillText(elements.addSectionFields.technicalSkills.value);
        if (!softSkills.length && !technicalSkills.length) {
            setFeedback("Add at least one skill before saving.");
            elements.addSectionFields.softSkills.focus();
            return null;
        }

        pageData.skills.softSkills = mergeUniqueItems(pageData.skills.softSkills, softSkills);
        pageData.skills.technicalSkills = mergeUniqueItems(pageData.skills.technicalSkills, technicalSkills);
        return "skills";
    }
};

const deleteHandlers = {
    education(pageData) {
        pageData.education = [];
        return "education";
    },
    qualifications(pageData) {
        pageData.qualifications.items = [];
        return "qualifications";
    },
    skills(pageData) {
        pageData.skills.softSkills = [];
        pageData.skills.technicalSkills = [];
        return "skills";
    }
};

if (HAS_WINDOW) {
    window.addEventListener("beforeunload", releaseTemporaryPhotoUrl);
    window.ApplicantEditableProfile = Object.freeze({
        cloneData,
        createItemId,
        createLogoFromText,
        getInitials,
        initializePage,
        isPdfFile,
        mergeUniqueItems,
        parseSkillText,
        profileGateway,
        state
    });
}

if (HAS_DOM) {
    document.readyState === "loading"
        ? document.addEventListener("DOMContentLoaded", initializePage, { once: true })
        : initializePage();
}

async function initializePage() {
    if (state.isInitialized || !isPageReady()) return;
    state.isInitialized = true;
    bindEvents();

    try {
        state.pageData = await profileGateway.fetchPageData();
        renderPage();
        syncEditorForm();
    } catch (error) {
        console.error("Unable to load the profile page.", error);
        setFeedback("The profile page could not be loaded.");
    }
}

function isPageReady() {
    return Boolean(elements.addSectionButton && elements.editorForm && elements.profileName);
}

function on(node, eventName, handler) {
    node?.addEventListener(eventName, handler);
}

function bindEvents() {
    on(elements.addSectionButton, "click", () => openAddSectionPanel());
    on(elements.addSectionForm, "submit", handleAddSection);
    on(elements.addSectionSelect, "change", ({ target }) => updateAddSectionFields(target.value));
    on(elements.avatarMenuButton, "click", toggleAvatarMenu);
    on(elements.viewProfileOption, "click", handleViewProfile);
    on(elements.changePhotoOption, "click", triggerPhotoPicker);
    on(elements.uploadCvButton, "click", triggerCvPicker);
    on(elements.photoInput, "change", handlePhotoSelection);
    on(elements.cvInput, "change", handleCvSelection);
    on(elements.editorForm, "submit", handleSave);
    on(elements.closeAddSectionButton, "click", closeAddSectionPanel);
    on(elements.cancelAddSectionButton, "click", closeAddSectionPanel);
    on(elements.closeEditorButton, "click", closeEditor);
    on(elements.cancelEditorButton, "click", closeEditor);
    on(document, "click", handleDocumentClick);
    on(document, "keydown", handleEscapeKey);
    on(elements.addSectionPanel, "click", ({ target }) => target === elements.addSectionPanel && closeAddSectionPanel());
    on(elements.editorPanel, "click", ({ target }) => target === elements.editorPanel && closeEditor());
}

function handleDocumentClick({ target }) {
    const editorTrigger = target.closest("[data-open-editor]");
    const addTrigger = target.closest("[data-open-add-section]");
    const deleteTrigger = target.closest("[data-delete-section]");

    if (editorTrigger) {
        closeSectionActionMenus();
        openEditor(editorTrigger.dataset.openEditor);
        return;
    }

    if (addTrigger) {
        closeSectionActionMenus();
        openAddSectionPanel(addTrigger.dataset.openAddSection);
        return;
    }

    if (deleteTrigger) {
        handleDeleteSection(deleteTrigger.dataset.deleteSection);
        return;
    }

    if (!elements.avatarMenu.hidden && !elements.avatarMenu.contains(target) && !elements.avatarMenuButton.contains(target)) {
        closeAvatarMenu();
    }

    closeSectionActionMenus(target.closest(".section-action-menu"));
}

function handleEscapeKey({ key }) {
    if (key !== "Escape") return;
    if (!elements.avatarMenu.hidden) return closeAvatarMenu();
    if (closeSectionActionMenus()) return;
    if (state.isEditorOpen) return closeEditor();
    if (state.isAddSectionOpen) closeAddSectionPanel();
}

function renderPage() {
    if (!state.pageData) return;
    renderProfile(state.pageData.profile);
    renderAbout(state.pageData.about);
    renderCv(state.pageData.cv);
    renderPersonalDetails(state.pageData.personalDetails);
    Object.values(sectionViews).forEach((view) => renderListSection(view, state.pageData));
}

function renderProfile(profile) {
    setText(elements.profileName, profile.name);
    setText(elements.addSectionButton, profile.addSectionButton);
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
    setText(elements.avatarFallback, getInitials(profile.name));
}

function renderAbout(about) {
    setText(elements.aboutIntro, about.intro);
    setText(elements.aboutPassion, about.passion);
    elements.aboutIntro.hidden = !about.intro;
    elements.aboutPassion.hidden = !about.passion;
}

function renderPersonalDetails(personalDetails) {
    setDetailText(elements.personalPhone, personalDetails.phone, "Add your phone number");
    setDetailText(elements.personalEmail, personalDetails.email, "Add your email address");
    setDetailText(elements.personalAddress, personalDetails.address, "Add your home address");
}

function renderCv(cv) {
    const hasCv = Boolean(cv.fileUrl);
    setText(elements.cvFileName, hasCv ? cv.fileName : "No CV uploaded yet");
    setText(elements.cvFileNote, hasCv ? "PDF uploaded and ready to view." : "Upload a PDF version of your CV. Only PDF files are accepted.");
    setText(elements.uploadCvButton, hasCv ? "Replace PDF CV" : "Upload PDF CV");

    if (!hasCv) {
        elements.viewCvLink.hidden = true;
        elements.viewCvLink.removeAttribute("href");
        elements.viewCvLink.removeAttribute("download");
        return;
    }

    elements.viewCvLink.hidden = false;
    elements.viewCvLink.href = cv.fileUrl;
    elements.viewCvLink.download = cv.fileName;
}

function renderListSection(view, pageData) {
    const items = view.getItems(pageData);
    const hasItems = items.length > 0;

    view.section.classList.toggle("screen-section-muted", !hasItems);
    view.placeholder.hidden = hasItems;
    view.header.hidden = !hasItems;
    view.list.hidden = !hasItems;
    setText(view.intro, view.getIntro(pageData));
    setText(view.button, view.getButton(pageData));
    view.list.replaceChildren();
    if (hasItems) view.render(items, view.list);
}

function renderEducationItems(items, list) {
    renderTemplateItems(list, items, elements.educationTemplate, (fragment, item) => {
        setText(fragment.querySelector(".resume-logo-text"), item.logo || createLogoFromText(item.school));
        setText(fragment.querySelector(".resume-title"), item.school);
        setText(fragment.querySelector(".education-field-line"), item.field);
        setText(fragment.querySelector(".education-date-line"), item.dates);
    });
}

function renderResumeItems(items, list) {
    renderTemplateItems(list, items, elements.resumeTemplate, (fragment, item) => {
        const subtitle = fragment.querySelector(".resume-company-line");
        const dates = fragment.querySelector(".resume-date-line");
        const location = fragment.querySelector(".resume-location-line");
        const description = fragment.querySelector(".resume-description");

        setText(fragment.querySelector(".resume-logo-text"), item.logo || createLogoFromText(item.title));
        setText(fragment.querySelector(".resume-title"), item.title);
        setText(subtitle, item.subtitle);
        setText(dates, item.dates);
        setText(description, item.description);
        subtitle.hidden = !item.subtitle;
        dates.hidden = !item.dates;
        description.hidden = !item.description;
        location.hidden = true;
    });
}

function renderSkillGroups(groups, list) {
    renderTemplateItems(list, groups, elements.skillGroupTemplate, (fragment, group) => {
        const groupedList = fragment.querySelector(".grouped-skill-list");
        setText(fragment.querySelector(".resume-logo-text"), createLogoFromText(group.heading));
        setText(fragment.querySelector(".resume-title"), group.heading);
        group.items.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.textContent = item;
            groupedList.append(listItem);
        });
    });
}

function renderTemplateItems(list, items, template, fill) {
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        const node = template.content.cloneNode(true);
        fill(node, item);
        fragment.append(node);
    });
    list.append(fragment);
}

function getSkillGroups(skills) {
    return [
        { heading: "Soft skills", items: skills.softSkills },
        { heading: "Technical skills", items: skills.technicalSkills }
    ].filter((group) => group.items.length > 0);
}

function syncEditorForm() {
    if (!state.pageData) return;

    const education = state.pageData.education[0] || {};
    setFieldValues(elements.formFields, {
        profileName: state.pageData.profile.name,
        phone: state.pageData.personalDetails.phone,
        email: state.pageData.personalDetails.email,
        address: state.pageData.personalDetails.address,
        aboutIntro: state.pageData.about.intro,
        aboutPassion: state.pageData.about.passion,
        educationSchool: education.school || "",
        educationField: education.field || "",
        educationDates: education.dates || "",
        qualificationsIntro: state.pageData.qualifications.intro,
        qualificationsButton: state.pageData.qualifications.buttonLabel,
        softSkills: state.pageData.skills.softSkills.join(", "),
        technicalSkills: state.pageData.skills.technicalSkills.join(", ")
    });
}

function setFieldValues(fields, values) {
    Object.entries(values).forEach(([key, value]) => fields[key] && (fields[key].value = value));
}

function openEditor(targetId) {
    if (!state.pageData) return;
    if (state.isAddSectionOpen) closeAddSectionPanel();

    state.activeEditorSection = editorTargetMap[targetId] || "";
    state.isEditorOpen = true;
    syncEditorForm();
    updateEditorSections();
    setText(elements.editorHeading, state.activeEditorSection ? `Edit ${SECTION_LABELS[state.activeEditorSection]}` : "Edit profile content");
    elements.editorPanel.hidden = false;
    updatePanelLockState();
    closeAvatarMenu();
    focusLater($(targetId) || elements.formFields.profileName);
}

function closeEditor() {
    state.activeEditorSection = "";
    state.isEditorOpen = false;
    elements.editorPanel.hidden = true;
    updateEditorSections();
    setText(elements.editorHeading, "Edit profile content");
    updatePanelLockState();
}

function updateEditorSections() {
    elements.editorGroups.forEach((group) => {
        const visible = !state.activeEditorSection || group.dataset.editorSection === state.activeEditorSection;
        group.hidden = !visible;
        group.querySelectorAll("input, textarea, select").forEach((field) => {
            field.disabled = !visible;
        });
    });
}

function openAddSectionPanel(sectionType = "") {
    if (!state.pageData) return;
    if (state.isEditorOpen) closeEditor();

    elements.addSectionForm.reset();
    elements.addSectionSelect.value = sectionType;
    updateAddSectionFields(sectionType);
    state.isAddSectionOpen = true;
    elements.addSectionPanel.hidden = false;
    updatePanelLockState();
    closeAvatarMenu();
    focusLater(getFirstAddSectionField(sectionType) || elements.addSectionSelect);
}

function closeAddSectionPanel() {
    state.isAddSectionOpen = false;
    elements.addSectionPanel.hidden = true;
    elements.addSectionForm.reset();
    updateAddSectionFields("");
    updatePanelLockState();
}

function updateAddSectionFields(sectionType) {
    const isQualification = sectionType === "qualifications";
    elements.educationAddGroup.hidden = sectionType !== "education";
    elements.skillsAddGroup.hidden = sectionType !== "skills";
    elements.supplementalAddGroup.hidden = !isQualification;
    if (!isQualification) return;

    setText(elements.supplementalLegend, QUALIFICATION_FIELD_COPY.legend);
    setText(elements.sharedTitleLabel, QUALIFICATION_FIELD_COPY.title);
    setText(elements.sharedSubtitleLabel, QUALIFICATION_FIELD_COPY.subtitle);
    setText(elements.sharedDatesLabel, QUALIFICATION_FIELD_COPY.dates);
    setText(elements.sharedDescriptionLabel, QUALIFICATION_FIELD_COPY.description);
}

function getFirstAddSectionField(sectionType) {
    if (sectionType === "education") return elements.addSectionFields.educationSchool;
    if (sectionType === "qualifications") return elements.addSectionFields.sharedTitle;
    if (sectionType === "skills") return elements.addSectionFields.softSkills;
    return null;
}

function updatePanelLockState() {
    document.body.classList.toggle("editor-open", state.isEditorOpen || state.isAddSectionOpen);
}

async function handleSave(event) {
    event.preventDefault();
    const saveSection = saveHandlers[state.activeEditorSection];
    if (!saveSection) {
        setFeedback("Open a section before saving changes.");
        return;
    }

    await persistPageUpdate((nextPageData) => saveSection(nextPageData), {
        success: `${SECTION_LABELS[state.activeEditorSection]} updated.`,
        failure: "The updated profile content could not be saved.",
        afterSave: closeEditor,
        log: "Unable to save the profile page."
    });
}

async function handleAddSection(event) {
    event.preventDefault();
    if (!state.pageData) return;

    const sectionType = elements.addSectionSelect.value;
    if (!sectionType) {
        setFeedback("Choose a section before adding details.");
        elements.addSectionSelect.focus();
        return;
    }

    const addSection = addHandlers[sectionType];
    if (!addSection) {
        setFeedback("That section is not available yet.");
        return;
    }

    await persistPageUpdate((nextPageData) => addSection(nextPageData), {
        success: (key) => `${SECTION_LABELS[key]} has been added to the profile.`,
        failure: "The new section details could not be saved.",
        afterSave: () => {
            closeAddSectionPanel();
            scrollToSection(sectionType);
        },
        log: "Unable to add the new section details."
    });
}

async function handleDeleteSection(sectionKey) {
    const removeSection = deleteHandlers[sectionKey];
    if (!state.pageData || !removeSection) return;

    await persistPageUpdate((nextPageData) => removeSection(nextPageData), {
        success: (key) => `${SECTION_LABELS[key]} section deleted.`,
        failure: "The section could not be deleted.",
        afterSave: () => closeSectionActionMenus(),
        log: "Unable to delete the section."
    });
}

async function persistPageUpdate(update, { success, failure, afterSave, log }) {
    try {
        const nextPageData = cloneData(state.pageData);
        const result = update(nextPageData);
        if (result === null || result === false) return null;

        state.pageData = await profileGateway.savePageData(nextPageData);
        renderPage();
        syncEditorForm();
        afterSave?.(result);
        setFeedback(typeof success === "function" ? success(result) : success);
        return result;
    } catch (error) {
        console.error(log, error);
        setFeedback(error?.message || failure);
        return null;
    }
}

function buildEducationItem() {
    const { educationSchool, educationField, educationDates } = elements.addSectionFields;
    const school = readValue(educationSchool);
    const field = readValue(educationField);
    const dates = readValue(educationDates);
    if (!school || !field || !dates) {
        setFeedback("Fill in all education details before saving.");
        return focusFirstEmptyField([educationSchool, educationField, educationDates]);
    }

    return { id: createItemId("education"), logo: createLogoFromText(school), school, field, dates };
}

function buildQualificationItem() {
    const { sharedTitle, sharedSubtitle, sharedDates, sharedDescription } = elements.addSectionFields;
    const title = readValue(sharedTitle);
    const subtitle = readValue(sharedSubtitle);
    const dates = readValue(sharedDates);
    const description = readValue(sharedDescription);
    if (!title || !subtitle || !dates || !description) {
        setFeedback("Fill in all qualifications details before saving.");
        return focusFirstEmptyField([sharedTitle, sharedSubtitle, sharedDates, sharedDescription]);
    }

    return { id: createItemId("qualifications"), logo: createLogoFromText(title), title, subtitle, dates, description };
}

function focusFirstEmptyField(fields) {
    fields.find((field) => !readValue(field))?.focus();
    return null;
}

function focusLater(field) {
    if (!field) return;
    window.setTimeout(() => {
        field.focus();
        field.scrollIntoView({ block: "center" });
    }, 0);
}

function parseSkillText(value) {
    return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function mergeUniqueItems(existingItems, newItems) {
    const seen = new Set();
    return [...existingItems, ...newItems].filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function createEmptyEducationItem() {
    return { id: createItemId("education"), logo: "", school: "", field: "", dates: "" };
}

function createItemId(prefix) {
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `${prefix}-${crypto.randomUUID()}`
        : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function createLogoFromText(value) {
    const match = value.trim().match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : "?";
}

function scrollToSection(sectionType) {
    sectionViews[sectionType]?.section.scrollIntoView({ behavior: "smooth", block: "start" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function triggerPhotoPicker() {
    closeAvatarMenu();
    elements.photoInput.click();
}

function triggerCvPicker() {
    elements.cvInput.click();
}

async function handlePhotoSelection(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
        const photoUrl = await profileGateway.uploadProfilePhoto(file);
        releaseTemporaryPhotoUrl();
        state.temporaryPhotoUrl = photoUrl;
        state.pageData.profile.photoUrl = photoUrl;
        state.pageData = await profileGateway.savePageData(state.pageData);
        renderProfile(state.pageData.profile);
        setFeedback("Profile picture updated.");
    } catch (error) {
        console.error("Unable to update the profile picture.", error);
        setFeedback(error?.message || "The profile picture could not be updated.");
    } finally {
        elements.photoInput.value = "";
    }
}

async function handleCvSelection(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    if (!isPdfFile(file)) {
        setFeedback("Please upload a PDF version of your CV.");
        elements.cvInput.value = "";
        return;
    }

    try {
        const fileUrl = await profileGateway.uploadCv(file);
        state.pageData.cv.fileName = file.name;
        state.pageData.cv.fileUrl = fileUrl;
        state.pageData = await profileGateway.savePageData(state.pageData);
        renderCv(state.pageData.cv);
        setFeedback("PDF CV uploaded.");
    } catch (error) {
        console.error("Unable to upload the CV.", error);
        setFeedback(error?.message || "The CV could not be uploaded.");
    } finally {
        elements.cvInput.value = "";
    }
}

function closeSectionActionMenus(exceptionMenu = null) {
    let closedAny = false;
    document.querySelectorAll(".section-action-menu[open]").forEach((menu) => {
        if (menu === exceptionMenu) return;
        menu.open = false;
        closedAny = true;
    });
    return closedAny;
}

function setFeedback(message) {
    window.clearTimeout(state.feedbackTimer);
    setText(elements.feedback, message);
    elements.feedback.hidden = !message;
    if (!message) return;

    state.feedbackTimer = window.setTimeout(() => {
        elements.feedback.hidden = true;
        elements.feedback.textContent = "";
    }, 3200);
}

function getInitials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

function setDetailText(node, value, emptyText) {
    const hasValue = Boolean(value);
    setText(node, hasValue ? value : emptyText);
    node.classList.toggle("detail-empty", !hasValue);
}

function releaseTemporaryPhotoUrl() {
    if (!state.temporaryPhotoUrl || !state.temporaryPhotoUrl.startsWith("blob:")) return;
    URL.revokeObjectURL(state.temporaryPhotoUrl);
    state.temporaryPhotoUrl = "";
}
