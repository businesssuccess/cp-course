console.log("CPWeeklySchedule Version 2-2");

// Define Google Sheet URL
const liveCallsSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=0&single=true&output=csv";

// Function to fetch and parse data from Google Sheet
function fetchLiveCalls(callback) {
    fetch(liveCallsSheetUrl)
        .then(response => response.text())
        .then(csvText => {
            let calls = [];
            let rows = csvText.split("\n");
            let headers = rows[0].split(",").map(header => header.trim()); // Trim headers for consistency

            for (let i = 1; i < rows.length; i++) {
                let values = rows[i].split(",");
                let callData = {};

                headers.forEach((header, index) => {
                    callData[header] = values[index] ? values[index].trim() : "";
                });

                if (callData['Enabled'] === "TRUE") {
                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                    if (callData['Date']) {
                        // Handle date-based calls
                        const callDate = moment.tz(callData['Date'], "DD/MM/YYYY", "America/New_York");
                        if (callDate.isValid()) {
                            const [hour, minute] = callData.Time ? callData.Time.split(":").map(Number) : [0, 0];
                            callDate.hour(hour).minute(minute);
                            callData.callDate = callDate;

                            // Format for current week
                            callData.liveCurrentWeek = `${callDate.format("dddd h:mm A")} ET - <b>${callData.CallName}</b>`;
                            // Format for upcoming calls
                            callData.liveUpcoming = `${callDate.format("dddd, MMM D")} at ${callDate.format("h:mm A")} ET - <b>${callData.CallName}</b>`;
                            callData.isRecurring = false; // Mark as non-recurring
                            calls.push(callData);
                        }
                    } else if (callData.Day && callData.Time) {
                        // Handle recurring weekly calls
                        callData.dayIndex = dayNames.indexOf(callData.Day);
                        const [hour, minute] = callData.Time.split(":").map(Number);
                        const period = hour >= 12 ? 'pm' : 'am';
                        const displayHour = hour % 12 || 12;
                        const today = moment.tz("America/New_York").startOf('week').add(callData.dayIndex, 'days');
                        callData.callDate = today.clone().hour(hour).minute(minute); // Generate date for sorting
                        callData.liveCurrentWeek = `${callData.Day} ${displayHour}:${minute.toString().padStart(2, '0')} ${period.toUpperCase()} ET - <b>${callData.CallName}</b>`;
                        callData.isRecurring = true; // Mark as recurring
                        calls.push(callData);
                    }
                }
            }

            callback(calls);
        })
        .catch(error => console.error("Error fetching Google Sheet data:", error));
}

// Function to check if a date falls within the current week
function isDateInCurrentWeek(date) {
    const startOfWeek = moment.tz("America/New_York").startOf('week');
    const endOfWeek = moment.tz("America/New_York").endOf('week');
    return date.isBetween(startOfWeek, endOfWeek, 'day', '[]');
}

// Function to check if a date falls within the next 28 days
function isDateInNext28Days(date) {
    const today = moment.tz("America/New_York");
    const endOf28Days = today.clone().add(28, 'days');
    return date.isAfter(today, 'day') && date.isSameOrBefore(endOf28Days, 'day');
}

// Function to check user enrollment
function isUserEnrolled(call) {
    const courseID = call['courseID'] && call['courseID'].trim(); // Trim to avoid whitespace issues
    const enrolledInCourse = enrolledCourses.includes(courseID);
    const sectionIDs = call['sectionID'] ? call['sectionID'].split(",").map(id => id.trim()) : [];
    const enrolledInSection = sectionIDs.length === 0 || sectionIDs.some(id => enrolledSections.includes(id));

    return enrolledInCourse && enrolledInSection;
}

// Function to display the weekly schedule and upcoming calls
function displayWeeklySchedule(calls) {
    const weeklyScheduleBlock = $('[data-title="weeklyScheduleBlock"] p');
    const weeklyScheduleRow = $('#weeklyScheduleRow');
    const currentTime = moment.tz("America/New_York");

    const enrolledCalls = calls.filter(isUserEnrolled);

    // Separate current week calls and upcoming calls
    const currentWeekCalls = enrolledCalls.filter(call => call.callDate && isDateInCurrentWeek(call.callDate));
    const upcomingCalls = enrolledCalls.filter(call => call.callDate && isDateInNext28Days(call.callDate) && !isDateInCurrentWeek(call.callDate));

    if (currentWeekCalls.length === 0 && upcomingCalls.length === 0) {
        weeklyScheduleRow.hide();
        return;
    } else {
        weeklyScheduleRow.show();
    }

    let weeklyScheduleContent = '';
    let upcomingScheduleContent = '';

    // Sort current week calls by date and time
    currentWeekCalls.sort((a, b) => a.callDate.diff(b.callDate));
    currentWeekCalls.forEach(call => {
        weeklyScheduleContent += `<div>▶ ${call.liveCurrentWeek}</div>`;
    });

    // Display upcoming calls
    if (upcomingCalls.length > 0) {
        weeklyScheduleContent += `<hr><h3>UPCOMING CALLS</h3>`;
        upcomingCalls.sort((a, b) => a.callDate.diff(b.callDate));
        upcomingCalls.forEach(call => {
            upcomingScheduleContent += `<div>▶ ${call.liveUpcoming}</div>`;
        });
    }

    weeklyScheduleBlock.html(weeklyScheduleContent + upcomingScheduleContent);
}

// Initial call to fetch and display the schedule
$(document).ready(function () {
    fetchLiveCalls(displayWeeklySchedule);
    setInterval(() => fetchLiveCalls(displayWeeklySchedule), 60000); // Refresh every minute
});
