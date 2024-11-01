console.log("CPGlobalCourseMessage Version 1-8");

const msgSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=1737117292&single=true&output=csv";

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

        // Check for course ID match first
        if (message.courseID === currentCourseID && shouldDisplay) {
            // Check for enrolled section ID match if available
            if (message.sectionID && enrolledSections.includes(message.sectionID)) {
                return true;
            }
            // If no section ID is specified, still display if course ID matches
            if (!message.sectionID) {
                return true;
            }
        }

        return false;
    });
}

// Function to display messages
function displayMessages(messages) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.getElementById('message');

    // Filter messages by course ID and section ID
    const filteredMessages = filterMessagesByEnrollment(messages);

    // Filter for global messages with CourseID '111111'
    const globalMessages = messages.filter(message => message.courseID === '111111' && shouldDisplayMessage(message));

    let combinedMessages = '';

    if (globalMessages.length > 0) {
        // Add global messages first
        combinedMessages += globalMessages.map(msg => msg.Message).join('<br><br>');
    }

    if (filteredMessages.length > 0) {
        // Add a line break between global and specific messages only if both exist
        if (combinedMessages) {
            combinedMessages += '<br><br>';
        }
        // Add specific course ID matched messages
        combinedMessages += filteredMessages.map(msg => msg.Message).join('<br><br>');
    }

    if (combinedMessages) {
        // Set innerHTML instead of textContent to render the <br> tags
        messageElement.innerHTML = combinedMessages;
        messageElement.style.color = "white";
        messageContainer.style.borderColor = "white";
    } else {
        messageElement.textContent = "-";
        messageElement.style.color = "transparent";
        messageContainer.style.borderColor = "transparent";
    }
}


// Initial call to fetch and display messages
document.addEventListener('DOMContentLoaded', function() {
    fetchMessagesFromSheet(displayMessages);
    setInterval(() => fetchMessagesFromSheet(displayMessages), 30000); // Refresh every 30 seconds
});

