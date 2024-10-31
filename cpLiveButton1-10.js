// Define Google Sheet URL
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?output=csv";

// Fetch logged-in user's email
const loggedInUserEmail = "{{ contact.email }}";

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
                zoomCall.schedule = [{
                    day: parseInt(zoomCall.day),
                    hour: parseInt(zoomCall.hour),
                    minute: parseInt(zoomCall.minute),
                    duration: parseInt(zoomCall.duration)
                }];

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
function filterZoomCallsByEnrollment(calls, isHost) {
    const enrolledCourses = []; // Replace this with data injection from the page context
    const enrolledSections = []; // Replace this with data injection from the page context

    return calls.filter(call => {
        if (isHost) return true; // Hosts see all upcoming calls
        const isEnrolledInCourse = enrolledCourses.includes(call.courseID);
        const isEnrolledInSection = call.sectionID && enrolledSections.includes(call.sectionID);
        return call.sectionID ? isEnrolledInSection : isEnrolledInCourse;
    });
}

// Function to check if the logged-in user is a host
function isUserHost(call) {
    return (
        call.hosts1 === loggedInUserEmail ||
        call.hosts2 === loggedInUserEmail ||
        call.hosts3 === loggedInUserEmail ||
        call.hosts4 === loggedInUserEmail ||
        call.hosts5 === loggedInUserEmail
    );
}

// Function to find the next upcoming call, including the following week if necessary
function findNextCall(zoomCalls, currentDay, currentMinutesSinceMidnight, isHost) {
    let nextCall = null;

    // Search for calls later this week
    zoomCalls.forEach(call => {
        if (call.Enabled) {
            call.schedule.forEach(schedule => {
                if ((schedule.day > currentDay) || 
                    (schedule.day === currentDay && schedule.hour * 60 + schedule.minute > currentMinutesSinceMidnight)) {
                    if (!nextCall || (schedule.day < nextCall.schedule[0].day || 
                        (schedule.day === nextCall.schedule[0].day && schedule.hour * 60 + schedule.minute < nextCall.schedule[0].hour * 60 + nextCall.schedule[0].minute))) {
                        nextCall = call;
                    }
                }
            });
        }
    });

    // If no call found for this week, search for the earliest call next week
    if (!nextCall) {
        zoomCalls.forEach(call => {
            if (call.Enabled) {
                call.schedule.forEach(schedule => {
                    if (schedule.day >= 0) { // Looking for any day in the next week
                        if (!nextCall || schedule.day < nextCall.schedule[0].day ||
                            (schedule.day === nextCall.schedule[0].day && schedule.hour * 60 + schedule.minute < nextCall.schedule[0].hour * 60 + nextCall.schedule[0].minute)) {
                            nextCall = call;
                        }
                    }
                });
            }
        });
    }

    return nextCall;
}

// Function to update the live room button based on zoomCalls
function updateLiveRoomButton(zoomCalls) {
    const liveRoomButton = document.getElementById('liveRoomButton');
    if (!liveRoomButton) return;

    const buttonText = liveRoomButton.querySelector('.elButtonSub');
    const buttonLink = liveRoomButton.querySelector('a');
    const innerButton = liveRoomButton.querySelector('.elButton');
    const liveSessionImage = document.getElementById('liveSession');

    const isHost = zoomCalls.some(call => isUserHost(call));
    const availableZoomCalls = filterZoomCallsByEnrollment(zoomCalls, isHost);

    const now = getEasternTime();
    const currentDay = now.day();
    const currentMinutesSinceMidnight = now.hour() * 60 + now.minute();

    let newText = "Live Room Is Currently Offline";
    let newHref = "#";
    let inProgress = false;

    const nextCall = findNextCall(availableZoomCalls, currentDay, currentMinutesSinceMidnight, isHost);

    if (nextCall) {
        const schedule = nextCall.schedule[0];
        const startMinutesSinceMidnight = schedule.hour * 60 + schedule.minute;
        const soonStartMinutesSinceMidnight = startMinutesSinceMidnight - 30;

        const targetUrl = isUserHost(nextCall) && nextCall.hostLink ? nextCall.hostLink : nextCall.ZoomOrObvioURL;
        const prefixText = isUserHost(nextCall) ? "HOST: " : "";

        // Determine the text and link based on whether the user is a host or attendee
        if (isHost) {
            if (currentDay === schedule.day && currentMinutesSinceMidnight >= startMinutesSinceMidnight && currentMinutesSinceMidnight < startMinutesSinceMidnight + schedule.duration) {
                newText = `${prefixText}${nextCall.CallName} - ${nextCall.live} - IN PROGRESS`;
                inProgress = true;
            } else {
                newText = `${prefixText}${nextCall.CallName} - ${nextCall.live} - UPCOMING MEETING`;
            }
        } else {
            if (currentDay === schedule.day && currentMinutesSinceMidnight >= startMinutesSinceMidnight && currentMinutesSinceMidnight < startMinutesSinceMidnight + schedule.duration) {
                newText = `${nextCall.CallName} - ${nextCall.live} - IN PROGRESS`;
                inProgress = true;
                newHref = targetUrl;
            } else if (currentDay === schedule.day && currentMinutesSinceMidnight >= soonStartMinutesSinceMidnight && currentMinutesSinceMidnight < startMinutesSinceMidnight) {
                newText = `${nextCall.CallName} - ${nextCall.live} - STARTING SOON`;
                newHref = targetUrl;
            }
        }

        newHref = targetUrl;
    }

    if (buttonText) buttonText.textContent = newText;
    if (buttonLink) {
        if (newText === "Live Room Is Currently Offline") {
            buttonLink.removeAttribute('href');
            buttonLink.classList.add('disabled');
            if (innerButton) {
                innerButton.style.backgroundColor = "gray";
                innerButton.style.opacity = "1.0";
                innerButton.onmouseover = function() { innerButton.style.opacity = "0.9"; };
                innerButton.onmouseout = function() { innerButton.style.opacity = "1.0"; };
            }
        } else {
            buttonLink.setAttribute('href', newHref);
            buttonLink.classList.remove('disabled');
            if (innerButton) {
                innerButton.style.backgroundColor = "#20a3d6";
                innerButton.style.opacity = "1.0";
                innerButton.onmouseover = function() { innerButton.style.opacity = "0.9"; };
                innerButton.onmouseout = function() { innerButton.style.opacity = "1.0"; };
            }
        }
    }

    if (liveSessionImage) {
        liveSessionImage.style.display = inProgress ? "block" : "none";
    }
}

// Load zoomCalls and update button
document.addEventListener('DOMContentLoaded', function() {
    fetchZoomCallsFromSheet(updateLiveRoomButton);
    setInterval(() => fetchZoomCallsFromSheet(updateLiveRoomButton), 30000);
});
