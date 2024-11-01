console.log("CPLiveButton Version 2-9");

// Define Google Sheet URL
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=0&single=true&output=csv";

// Function to fetch zoom calls from Google Sheet CSV
function fetchZoomCallsFromSheet(callback) {
    fetch(sheetUrl)
        .then(response => response.text())
        .then(csvText => {
            let zoomCalls = [];
            let rows = csvText.split("\n");
            let headers = rows[0].split(",");

            for (let i = 1; i < rows.length; i++) {
                let values = rows[i].split(",");
                let zoomCall = {};

                headers.forEach((header, index) => {
                    zoomCall[header.trim()] = values[index] ? values[index].trim() : "";
                });

                // Convert fields
                zoomCall.Enabled = zoomCall.Enabled === "TRUE";

                // Parse day as a string (e.g., "Sunday") and time as "HH:mm"
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                zoomCall.dayIndex = dayNames.indexOf(zoomCall.Day); // Get the day index (0 for Sunday, etc.)
                
                // Parse the time field into hours and minutes
                if (zoomCall.Time) {
                    const [hour, minute] = zoomCall.Time.split(":").map(Number);
                    zoomCall.schedule = [{
                        day: zoomCall.dayIndex,
                        hour: hour,
                        minute: minute,
                        duration: parseInt(zoomCall.duration) || 60 // Default duration to 60 minutes if not provided
                    }];

                    // Generate the 'live' text automatically
                    zoomCall.live = `${zoomCall.Day} ${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'pm' : 'am'} ET`;
                } else {
                    console.error("Invalid time format in the data.");
                    continue;
                }

                zoomCalls.push(zoomCall);
            }
            callback(zoomCalls);
        })
        .catch(error => console.error("Error fetching Google Sheet data:", error));
}

// Get the current time in Eastern Time (ET) using Moment.js
function getEasternTime() {
    return moment.tz("America/New_York");
}

// Function to filter zoomCalls based on enrollment
function filterZoomCallsByEnrollment(calls) {
    return calls.filter(call => {
        const isEnrolledInCourse = enrolledCourses.includes(call.courseID);
        const isEnrolledInSection = call.sectionID && enrolledSections.includes(call.sectionID);
        return call.sectionID ? isEnrolledInSection : isEnrolledInCourse;
    });
}

// Function to update the live room button based on zoomCalls
function updateLiveRoomButton(zoomCalls) {
    const liveRoomButton = document.getElementById('liveRoomButton');
    if (!liveRoomButton) return;

    const buttonText = liveRoomButton.querySelector('.elButtonSub');
    const buttonLink = liveRoomButton.querySelector('a');
    const innerButton = liveRoomButton.querySelector('.elButton');
    const liveSessionImage = document.getElementById('liveSession');

    const now = getEasternTime();
    const currentDay = now.day();
    const currentMinutesSinceMidnight = now.hour() * 60 + now.minute();

    let newText = "Live Room Is Currently Offline";
    let newHref = "#";
    let inProgress = false;

    // Filter the calls based on user enrollment
    const availableZoomCalls = filterZoomCallsByEnrollment(zoomCalls);

    // Check each available call to update the button
    for (const call of availableZoomCalls) {
        if (call.Enabled && call.dayIndex !== -1) {
            for (const schedule of call.schedule) {
                const startMinutesSinceMidnight = schedule.hour * 60 + schedule.minute;
                const endMinutesSinceMidnight = startMinutesSinceMidnight + schedule.duration;
                const openMinutesSinceMidnight = startMinutesSinceMidnight - 10; // 10 minutes before live time
                const soonStartMinutesSinceMidnight = startMinutesSinceMidnight - 15; // 15 minutes before live time

                if (currentDay === schedule.day) {
                    if (currentMinutesSinceMidnight >= startMinutesSinceMidnight && currentMinutesSinceMidnight < endMinutesSinceMidnight) {
                        newText = `${call.CallName} - ${call.live} - IN PROGRESS`;
                        newHref = call.ZoomOrObvioURL;
                        inProgress = true;
                        break;
                    } else if (currentMinutesSinceMidnight >= openMinutesSinceMidnight && currentMinutesSinceMidnight < startMinutesSinceMidnight) {
                        newText = `${call.CallName} - ${call.live} - ROOM OPEN`;
                        newHref = call.ZoomOrObvioURL;
                        break;
                    } else if (currentMinutesSinceMidnight >= soonStartMinutesSinceMidnight && currentMinutesSinceMidnight < openMinutesSinceMidnight) {
                        newText = `${call.CallName} - ${call.live} - STARTING SOON`;
                        newHref = call.ZoomOrObvioURL;
                        break;
                    }
                }
            }
        }

        if (newText !== "Live Room Is Currently Offline") break;
    }

    // Update the button text and href
    if (buttonText) buttonText.textContent = newText;
    if (buttonLink) {
        if (newText === "Live Room Is Currently Offline") {
            buttonLink.removeAttribute('href');
            buttonLink.classList.add('disabled');
            if (innerButton) {
                innerButton.style.backgroundColor = "gray";
                innerButton.style.opacity = "1.0";
            }
        } else {
            buttonLink.setAttribute('href', newHref);
            buttonLink.classList.remove('disabled');
            if (innerButton) {
                innerButton.style.backgroundColor = "#20a3d6";
                innerButton.style.opacity = "1.0";
            }
        }
    }

    if (liveSessionImage) {
        liveSessionImage.style.display = inProgress ? "block" : "none";
    }
}

// Initial call to update the button and hide the element on page load
document.addEventListener('DOMContentLoaded', function() {
    // Hide the element with the CSS ID 'liveSession'
    const liveSessionElement = document.getElementById('liveSession');
    if (liveSessionElement) {
        liveSessionElement.style.display = 'none';
    }

    fetchZoomCallsFromSheet(updateLiveRoomButton);
    setInterval(() => fetchZoomCallsFromSheet(updateLiveRoomButton), 30000);
});
