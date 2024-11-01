console.log("CPLiveButton Version 2-8");


// URL to the Google Sheet
const msgSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=1737117292&single=true&output=csv";

// Hide elements on page load
document.addEventListener('DOMContentLoaded', function() {
    // Hide the element with the CSS ID 'liveSession'
    var liveSessionElement = document.getElementById('liveSession');
    if (liveSessionElement) {
        liveSessionElement.style.display = 'none';
    }

    // Fetch and display messages initially
    fetchMessagesFromSheet(displayMessages);
    setInterval(() => fetchMessagesFromSheet(displayMessages), 30000); // Refresh every 30 seconds
});

// Function to fetch and parse data from Google Sheet
function fetchMessagesFromSheet(callback) {
    fetch(msgSheetUrl)
        .then(response => response.text())
        .then(csvText => {
            let messages = [];
            let rows = csvText.split("\n");
            let headers = rows[0].split(",");

            for (let i = 1; i < rows.length; i++) {
                let values = rows[i].split(",");
                let messageData = {};

                headers.forEach((header, index) => {
                    messageData[header.trim()] = values[index] ? values[index].trim() : "";
                });

                // Parse dates and times using the dd-mm-yyyy format and interpret times in New York timezone
                if (messageData.startDate) {
                    messageData.startDateTime = moment.tz(`${messageData.startDate} ${messageData.startTime || '00:00'}`, "DD-MM-YYYY HH:mm", "America/New_York");
                }
                if (messageData.endDate) {
                    messageData.endDateTime = moment.tz(`${messageData.endDate} ${messageData.endTime || '23:59'}`, "DD-MM-YYYY HH:mm", "America/New_York");
                }

                messages.push(messageData);
            }
            callback(messages);
        })
        .catch(error => console.error("Error fetching Google Sheet data:", error));
}

// Function to check if a message should be displayed
function shouldDisplayMessage(message) {
    if (message.Enabled.toUpperCase() !== "TRUE") {
        return false;
    }

    const now = moment.tz("America/New_York");

    // If startDate and endDate are both empty, always show the message
    if (!message.startDate && !message.endDate) {
        return true;
    }

    // Check if there is a date range and time range set
    if (message.startDateTime && message.endDateTime) {
        return now.isBetween(message.startDateTime, message.endDateTime, null, '[]');
    }
    // Check if there is only a start date (show indefinitely after start date)
    if (message.startDateTime && !message.endDateTime) {
        return now.isSameOrAfter(message.startDateTime);
    }
    // Check if there is only an end date (show until end date)
    if (!message.startDateTime && message.endDateTime) {
        return now.isSameOrBefore(message.endDateTime);
    }

    // Default to showing the message if conditions are ambiguous
    return true;
}

// Function to filter messages by the current courseID and sectionID
function filterMessagesByEnrollment(messages) {
    return messages.filter(message => {
        const shouldDisplay = shouldDisplayMessage(message);

        // Check for enrolled section ID match
        if (message.sectionID && enrolledSections.includes(message.sectionID) && shouldDisplay) {
            return true;
        }

        // Check for course ID match if no section ID is specified
        if (!message.sectionID && message.courseID === currentCourseID && shouldDisplay) {
            return true;
        }

        return false;
    });
}

// Function to display messages
function displayMessages(messages) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.getElementById('message');

    const filteredMessages = filterMessagesByEnrollment(messages);

    if (filteredMessages.length > 0) {
        const message = filteredMessages[0].Message;
        messageElement.textContent = message;
        messageElement.style.color = "white";
        messageContainer.style.borderColor = "white";
    } else {
        messageElement.textContent = "-";
        messageElement.style.color = "transparent";
        messageContainer.style.borderColor = "transparent";
    }
}


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
                zoomCall.schedule = [{
                    day: parseInt(zoomCall.day),
                    hour: parseInt(zoomCall.hour),
                    minute: parseInt(zoomCall.minute),
                    duration: parseInt(zoomCall.duration)
                }];

                // Generate the 'live' text automatically
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                zoomCall.live = `${dayNames[zoomCall.schedule[0].day]} ${zoomCall.schedule[0].hour % 12 || 12}:${zoomCall.schedule[0].minute.toString().padStart(2, '0')} ${zoomCall.schedule[0].hour >= 12 ? 'pm' : 'am'} ET`;

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
        if (call.Enabled) {
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

// Initial call to update the button
document.addEventListener('DOMContentLoaded', function() {
    fetchZoomCallsFromSheet(updateLiveRoomButton);
    setInterval(() => fetchZoomCallsFromSheet(updateLiveRoomButton), 30000);
});
