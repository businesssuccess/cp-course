// Include minimized Moment.js and Moment Timezone libraries for only America/New_York timezone
// Ensure to add this in your HTML file:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
// <script src="https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.34/moment-timezone-with-data.min.js"></script>

// Define the call details
var zoomCalls = [
    {
        "Enabled": false,
        "CallName": "INSERT NAME OF IMPROMPTU MEETING HERE",
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/86527841409?pwd=ks99w0RPbX2bIKS4Lh49CmNaDsYoHU.1",
        "live": "Sunday 5:00pm ET",
        "courseID": "45579", //courseID
        "sectionID": "",
        "schedule": [
            {"day": 3, "hour": 23, "minute": 0, "duration": 60} // Sunday 5pm ET, duration 60 minutes
        ]
    },
    {
        "Enabled": true,
        "CallName": "CONNECT ACCELERATE - Weekly Kickstart",
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/86527841409?pwd=ks99w0RPbX2bIKS4Lh49CmNaDsYoHU.1",
        "live": "Sunday 5:00pm ET",
        "courseID": "45579",
        "sectionID": "248654",
        "schedule": [
            {"day": 0, "hour": 17, "minute": 0, "duration": 60} // Sunday 5pm ET, duration 60 minutes
        ]
    },
    {
        "Enabled": true,
        "CallName": "CONNECT LAUNCH - Momentum Booster",
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/82015514549?pwd=bVIhMNHWUcjxdmk4lCpVaf6Kbkb019.1",  //FYM LAUNCH LINK
        //"ZoomOrObvioURL": "https://us06web.zoom.us/j/82092292948?pwd=brbjbQUv7uap2wI3Na93TylbQj12rQ.1",  //HTF LINK
        "live": "Wednesday 5:00pm ET",
        "courseID": "45579",
        "sectionID": "248655",
        "schedule": [
            {"day": 3, "hour": 17, "minute": 0, "duration": 60} // Tuesday 5pm ET, duration 60 minutes
        ]
    },
    {
        "Enabled": true,
        "CallName": "SEAMLESS EVENT FRAMEWORK LIVE CALL",
        "ZoomOrObvioURL": "https://frameworks.obv.io/area/Nnd47Zj5w1qeWjQo",  //Frameworks Obvio Link
        "live": "Wednesday 3:00pm ET",
        "courseID": "50994",
        "sectionID": "",
        "schedule": [
            {"day": 3, "hour": 15, "minute": 00, "duration": 60} // Wednesday 3pm ET, duration 60 minutes
        ]
    },
    {
        "Enabled": true,
        "CallName": "Traffic Lab",
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/81949703883?pwd=PvypOsj0tE3taeLkyjthb3HHYXL3rr.1",
        "live": "Monday 12:00pm ET",
        "courseID": "47548",
        "sectionID": "", // No section ID
        "schedule": [
            {"day": 1, "hour": 12, "minute": 0, "duration": 60} // Monday 12pm ET, duration 60 minutes
        ]
    },
    {
        "Enabled": true,
        "CallName": "ClickFunnels Tech Call",
        //"ZoomOrObvioURL": "https://us06web.zoom.us/j/85258278013?pwd=bk9PV2VsazlqTnZzRk03OXZZMjFaQT09", //Adam's zoom link
        "ZoomOrObvioURL": "https://tech.obv.io/area/bL0Q2qMN2BZDMyne",  //Obvio TECH Event
        "live": "Wednesday 7:00pm ET",
        "courseID": "48992",
        "sectionID": "", // No section ID
        "schedule": [
            {"day": 3, "hour": 19, "minute": 0, "duration": 60} // Wednesday 7pm ET, duration 60 minutes
        ]
    }
];

var offlineText = "Live Room Is Currently Offline";

// Fetch enrolled courses and sections safely
var enrolledCourses = {{contact.enrolled_course_ids | json}} || []; // List of enrolled course IDs
var enrolledSections = {{contact.enrolled_section_ids | json}} || []; // List of enrolled section IDs

// Get the current time in Eastern Time (ET) using Moment.js
function getEasternTime() {
    return moment.tz("America/New_York");
}

// Function to filter zoomCalls based on enrollment
function filterZoomCallsByEnrollment(calls) {
    return calls.filter(function(call) {
        // Check if the user is enrolled in the course or section
        var isEnrolledInCourse = enrolledCourses.includes(call.courseID);
        var isEnrolledInSection = call.sectionID && enrolledSections.includes(call.sectionID);

        // Include the call if the user is enrolled in the course or specifically in the section
        if (call.sectionID) {
            // If a section ID is defined, use it to filter enrollment
            return isEnrolledInSection;
        } else {
            // If no section ID, rely on course enrollment
            return isEnrolledInCourse;
        }
    });
}

// Function to check the current status of calls
function updateLiveRoomButton() {
    var liveRoomButton = document.getElementById('liveRoomButton');
    if (!liveRoomButton) return;

    var buttonText = liveRoomButton.querySelector('.elButtonSub');
    var buttonLink = liveRoomButton.querySelector('a');
    var innerButton = liveRoomButton.querySelector('.elButton'); // Target the inner .elButton
    var liveSessionImage = document.getElementById('liveSession'); // Target the #liveSession image

    // Filter the calls based on user enrollment
    var availableZoomCalls = filterZoomCallsByEnrollment(zoomCalls);

    // Get the current date and time in Eastern Time (ET)
    var now = getEasternTime();
    var currentDay = now.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    var currentHour = now.hour();
    var currentMinute = now.minute();
    var currentMinutesSinceMidnight = currentHour * 60 + currentMinute; // Current time in minutes since midnight

    // Initialize variables to hold the button's new values
    var newText = offlineText;
    var newHref = "#"; // Default to no link
    var inProgress = false; // Flag to track if the session is in progress

    // Loop through the available calls to find the current or next live call
    for (var i = 0; i < availableZoomCalls.length; i++) {
        var call = availableZoomCalls[i];

        if (call.Enabled) {
            for (var j = 0; j < call.schedule.length; j++) {
                var schedule = call.schedule[j];
                var startDay = schedule.day;
                var startHour = schedule.hour;
                var startMinute = schedule.minute;
                var duration = schedule.duration;

                // Calculate start and end times in minutes since midnight
                var startMinutesSinceMidnight = startHour * 60 + startMinute;
                var endMinutesSinceMidnight = startMinutesSinceMidnight + duration;
                var openMinutesSinceMidnight = startMinutesSinceMidnight - 10; // 10 minutes before live time
                var soonStartMinutesSinceMidnight = startMinutesSinceMidnight - 30; // 30 minutes before live time

                // Check if the current time is within the call's time range
                if (currentDay === startDay) {
                    if (currentMinutesSinceMidnight >= startMinutesSinceMidnight &&
                        currentMinutesSinceMidnight < endMinutesSinceMidnight) {
                        // Call is currently live
                        newText = call.CallName + " - " + call.live + " - IN PROGRESS";
                        newHref = call.ZoomOrObvioURL;
                        inProgress = true; // Set flag to true
                        break;
                    } else if (currentMinutesSinceMidnight >= openMinutesSinceMidnight && 
                               currentMinutesSinceMidnight < startMinutesSinceMidnight) {
                        // Call is in the "ROOM OPEN" phase
                        newText = call.CallName + " - " + call.live + " - ROOM OPEN";
                        newHref = call.ZoomOrObvioURL;
                        break;
                    } else if (currentMinutesSinceMidnight >= soonStartMinutesSinceMidnight && 
                               currentMinutesSinceMidnight < openMinutesSinceMidnight) {
                        // Call is in the "STARTING SOON" phase
                        newText = call.CallName + " - " + call.live + " - STARTING SOON";
                        newHref = call.ZoomOrObvioURL;
                        break;
                    }
                }
            }
        }

        // Break out of the loop if a match is found
        if (newText !== offlineText) break;
    }

    // Update the button text and href
    if (buttonText) {
        buttonText.textContent = newText;
    }
    if (buttonLink) {
        if (newText === offlineText) {
            // Disable the button by removing the href attribute and adding a class to indicate it's disabled
            buttonLink.removeAttribute('href');
            buttonLink.classList.add('disabled');

            // Apply styles for the offline state to the .elButton within #liveRoomButton
            if (innerButton) {
                innerButton.style.backgroundColor = "gray";
                innerButton.style.opacity = "1.0"; // Normal state
                innerButton.onmouseover = function() {
                    innerButton.style.opacity = "0.9"; // 10% transparency on hover
                };
                innerButton.onmouseout = function() {
                    innerButton.style.opacity = "1.0"; // Reset opacity
                };
            }
        } else {
            // Enable the button by setting the href and removing the disabled class
            buttonLink.setAttribute('href', newHref);
            buttonLink.classList.remove('disabled');

            // Apply styles for the active state to the .elButton within #liveRoomButton
            if (innerButton) {
                innerButton.style.backgroundColor = "#20a3d6";
                innerButton.style.opacity = "1.0"; // Normal state
                innerButton.onmouseover = function() {
                    innerButton.style.opacity = "0.9"; // 10% transparency on hover
                };
                innerButton.onmouseout = function() {
                    innerButton.style.opacity = "1.0"; // Reset opacity
                };
            }
        }
    }

    // Show or hide the image based on the session status
    if (liveSessionImage) {
        if (inProgress) {
            liveSessionImage.style.display = "block"; // Show the image
        } else {
            liveSessionImage.style.display = "none"; // Hide the image
        }
    }
}

// Initial update on page load
document.addEventListener('DOMContentLoaded', function() {
    updateLiveRoomButton();
    // Refresh every 30 seconds
    setInterval(updateLiveRoomButton, 30000);
});
