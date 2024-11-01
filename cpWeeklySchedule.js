console.log("CPWeeklySchedule Version 1");

// Define Google Sheet URL
const liveCallsSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=0&single=true&output=csv";

// Function to fetch and parse data from Google Sheet
function fetchLiveCalls(callback) {
    fetch(liveCallsSheetUrl)
        .then(response => response.text())
        .then(csvText => {
            let calls = [];
            let rows = csvText.split("\n");
            let headers = rows[0].split(",");

            for (let i = 1; i < rows.length; i++) {
                let values = rows[i].split(",");
                let callData = {};

                headers.forEach((header, index) => {
                    callData[header.trim()] = values[index] ? values[index].trim() : "";
                });

                if (callData['Enabled'] === "TRUE") {
                    // Parse the schedule day and time
                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    callData.dayIndex = dayNames.indexOf(callData.Day);
                    if (callData.Time) {
                        const [hour, minute] = callData.Time.split(":").map(Number);
                        callData.schedule = [{
                            day: callData.dayIndex,
                            hour: hour,
                            minute: minute,
                            duration: parseInt(callData.duration) || 60 // Default to 60 minutes if not provided
                        }];

                        // Generate the display time in 12-hour format
                        const period = hour >= 12 ? 'pm' : 'am';
                        const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12-hour format
                        callData.live = `${callData.Day} ${displayHour}:${minute.toString().padStart(2, '0')} ${period.toUpperCase()} ET`;

                        calls.push(callData);
                    }
                }
            }
            callback(calls);
        })
        .catch(error => console.error("Error fetching Google Sheet data:", error));
}

// Function to display the weekly schedule
function displayWeeklySchedule(calls) {
    const weeklyScheduleBlock = $('[data-title="weeklyScheduleBlock"] p');
    const currentTime = moment.tz("America/New_York");

    // Sort the calls by day and time
    calls.sort((a, b) => {
        if (a.dayIndex === b.dayIndex) {
            if (a.schedule[0].hour === b.schedule[0].hour) {
                return a.schedule[0].minute - b.schedule[0].minute;
            }
            return a.schedule[0].hour - b.schedule[0].hour;
        }
        return a.dayIndex - b.dayIndex;
    });

    let weeklyScheduleContent = '';

    calls.forEach(call => {
        const schedule = call.schedule[0];
        const sessionStartTime = moment(currentTime).day(schedule.day).hour(schedule.hour).minute(schedule.minute);
        const oneHourBeforeSession = moment(sessionStartTime).subtract(1, 'hours');
        const fiveMinutesBeforeSession = moment(sessionStartTime).subtract(5, 'minutes');
        const isStartingSoon = currentTime.isBetween(oneHourBeforeSession, fiveMinutesBeforeSession, null, '[)');
        const isRoomOpen = currentTime.isBetween(fiveMinutesBeforeSession, sessionStartTime, null, '[)');
        const isInProgress = currentTime.isSameOrAfter(sessionStartTime) && currentTime.isBefore(moment(sessionStartTime).add(schedule.duration, 'minutes'));

        // Create the call line
        let callLine = `<a href="${call.ZoomOrObvioURL}" style="color: black; text-decoration: none;" onmouseover="this.children[0].style.textDecoration='underline'" onmouseout="this.children[0].style.textDecoration='none'"`;

        if (isInProgress || isRoomOpen) {
            callLine += ` onclick="openObvioAndNavigate('${call.ZoomOrObvioURL}', '${call.ZoomOrObvioURL}'); return false;"`;
        }

        callLine += `><span style="text-decoration: none;">▶ ${call.live} - <b>${call.CallName}</b></span>`;

        if (isInProgress) {
            callLine += createPillHtml('IN PROGRESS', 'red', 'white');
        } else if (isRoomOpen) {
            callLine += createPillHtml('ROOM OPEN', '#00A90A', 'white');
        } else if (isStartingSoon) {
            callLine += createPillHtml('STARTING SOON', '#2E95D3', 'white');
        }

        callLine += '</a>';

        weeklyScheduleContent += `<div>${callLine}</div>`;
    });

    weeklyScheduleBlock.html(weeklyScheduleContent);
}

// Function to create a pill element for the schedule
function createPillHtml(text, backgroundColor, textColor) {
    return `<span style="background-color: ${backgroundColor}; color: ${textColor}; padding-left: 5px; padding-right: 5px; border-radius: 15px; font-weight: bold; font-size: calc(100% - 6px); margin-left: 10px; display: inline-block; position: relative; top: -2px;">${text}</span>`;
}

// Initial call to fetch and display the schedule
$(document).ready(function () {
    fetchLiveCalls(displayWeeklySchedule);
    setInterval(() => fetchLiveCalls(displayWeeklySchedule), 60000); // Refresh every minute
});