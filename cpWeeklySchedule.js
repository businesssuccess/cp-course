console.log("CPWeeklySchedule Version 2-3");

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
                        const callDate = moment.tz(callData['Date'], "DD/MM/YYYY", "America/New_York");
                        if (callDate.isValid()) {
                            const [hour, minute] = callData.Time ? callData.Time.split(":").map(Number) : [0, 0];
                            callDate.hour(hour).minute(minute);
                            callData.callDate = callDate;

                            callData.liveCurrentWeek = `${callDate.format("dddd h:mm A")} ET - <b>${callData.CallName}</b>`;
                            callData.liveUpcoming = `${callDate.format("dddd, MMM D")} at ${callDate.format("h:mm A")} ET - <b>${callData.CallName}</b>`;
                            callData.schedule = [{ day: callDate.day(), hour, minute, duration: parseInt(callData.duration) || 60 }];
                            callData.isRecurring = false;
                            calls.push(callData);
                        }
                    } else if (callData.Day && callData.Time) {
                        callData.dayIndex = dayNames.indexOf(callData.Day);
                        const [hour, minute] = callData.Time.split(":").map(Number);
                        const today = moment.tz("America/New_York").startOf('week').add(callData.dayIndex, 'days');
                        callData.callDate = today.clone().hour(hour).minute(minute);

                        callData.liveCurrentWeek = `${callData.Day} ${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'} ET - <b>${callData.CallName}</b>`;
                        callData.schedule = [{ day: callData.dayIndex, hour, minute, duration: parseInt(callData.duration) || 60 }];
                        callData.isRecurring = true;
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
    const courseID = call['courseID'] && call['courseID'].trim();
    const enrolledInCourse = enrolledCourses.includes(courseID);
    const sectionIDs = call['sectionID'] ? call['sectionID'].split(",").map(id => id.trim()) : [];
    const enrolledInSection = sectionIDs.length === 0 || sectionIDs.some(id => enrolledSections.includes(id));

    return enrolledInCourse && enrolledInSection;
}

// Function to create a pill element
function createPillHtml(text, backgroundColor, textColor) {
    return `<span style="background-color: ${backgroundColor}; color: ${textColor}; padding-left: 5px; padding-right: 5px; border-radius: 15px; font-weight: bold; font-size: calc(100% - 6px); margin-left: 10px; display: inline-block; position: relative; top: -2px;">${text}</span>`;
}

// Function to display the weekly schedule and upcoming calls
function displayWeeklySchedule(calls) {
    const weeklyScheduleBlock = $('[data-title="weeklyScheduleBlock"] p');
    const weeklyScheduleRow = $('#weeklyScheduleRow');
    const currentTime = moment.tz("America/New_York");

    const enrolledCalls = calls.filter(isUserEnrolled);

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

    currentWeekCalls.sort((a, b) => a.callDate.diff(b.callDate));
    currentWeekCalls.forEach(call => {
        const schedule = call.schedule[0];
        const sessionStartTime = moment(call.callDate);
        const isStartingSoon = currentTime.isBetween(sessionStartTime.clone().subtract(1, 'hours'), sessionStartTime, null, '[)');
        const isRoomOpen = currentTime.isBetween(sessionStartTime.clone().subtract(5, 'minutes'), sessionStartTime, null, '[)');
        const isInProgress = currentTime.isBetween(sessionStartTime, sessionStartTime.clone().add(schedule.duration, 'minutes'), null, '[)');

        let callLine = `<div>▶ ${call.liveCurrentWeek}`;
        if (isInProgress) callLine += createPillHtml('IN PROGRESS', 'red', 'white');
        else if (isRoomOpen) callLine += createPillHtml('ROOM OPEN', '#00A90A', 'white');
        else if (isStartingSoon) callLine += createPillHtml('STARTING SOON', '#2E95D3', 'white');
        callLine += `</div>`;

        weeklyScheduleContent += callLine;
    });

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

