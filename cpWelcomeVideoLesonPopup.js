console.log("CPWelcomeLesson Version 1-2");

// URL of the Google Sheet CSV
const liveCallSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=114880507&single=true&output=csv";

// Function to fetch and process data from the Google Sheet
function fetchCourseData(callback) {
    fetch(liveCallSheetUrl)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.split("\n").map(row => row.split(","));
            const headers = rows[0].map(header => header.trim());

            const data = rows.slice(1).map(row => {
                let rowData = {};
                row.forEach((value, index) => {
                    rowData[headers[index]] = value.trim();
                });
                return rowData;
            });

            // Filter for active rows matching current CourseID and, if provided, the SectionID
            const matchingEntries = data.filter(entry => 
                entry["Active"] === "TRUE" &&
                entry["CourseID"] === currentCourseID &&
                (!entry["SectionID"] || enrolledSections.includes(entry["SectionID"]))
            );

            // Sort entries to prioritize higher levels (topmost rows in sheet)
            const sortedEntries = matchingEntries.sort((a, b) => 
                data.indexOf(a) - data.indexOf(b)
            );

            callback(sortedEntries);
        })
        .catch(error => console.error("Error fetching data from Google Sheet:", error));
}

// Redirect logic based on the fetched data
function redirectToWelcomeLesson(matchingEntries) {
    if (matchingEntries.length > 0) {
        // The first matching entry will be the highest priority due to sorting
        const entry = matchingEntries[0];

        const welcomeVideoEnabled = entry["WelcomeVideoEnabled"] === "TRUE";
        const welcomeLessonID = entry["WelcomeLessonID"];
        const welcomeLessonURL = entry["WelcomeLessonURL"];

        if (!welcomeVideoEnabled) return; // Exit if the video is not enabled

        if (!contact.enrolled_courses || !contact.enrolled_courses[currentCourseID]) return; // Ensure course enrollment

        const completedLessons = contact.enrolled_courses[currentCourseID].completed_lessons;

        // Check if the welcome lesson ID is in the completed lessons
        const lessonComplete = completedLessons && completedLessons.includes(String(welcomeLessonID));

        if (!lessonComplete) {
            window.location.href = welcomeLessonURL; // Redirect if the lesson is not complete
        }
    }
}

// Initialize the data fetching and redirect logic
fetchCourseData(redirectToWelcomeLesson);
