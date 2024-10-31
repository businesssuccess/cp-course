// Define the call details
var zoomCalls = [
    {
        "Enabled": false,
        "CallName": "INSERT NAME OF IMPROMPTU MEETING HERE",
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/86527841409?pwd=ks99w0RPbX2bIKS4Lh49CmNaDsYoHU.1",
        "live": "Sunday 5:00pm ET",
        "courseID": "123456", //courseID
        "sectionID": "",
        "schedule": [
            {"day": 0, "hour": 17, "minute": 0, "duration": 60} // Sunday 5pm ET, duration 60 minutes
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
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/82015514549?pwd=bVIhMNHWUcjxdmk4lCpVaf6Kbkb019.1",
        "live": "Wednesday 5:00pm ET",
        "courseID": "45579",
        "sectionID": "248655",
        "schedule": [
            {"day": 3, "hour": 17, "minute": 0, "duration": 60} // Wednesday 5pm ET, duration 60 minutes
        ]
    },
    {
        "Enabled": true,
        "CallName": "SEAMLESS EVENT FRAMEWORK LIVE CALL",
        "ZoomOrObvioURL": "https://frameworks.obv.io/area/Nnd47Zj5w1qeWjQo",
        "live": "Wednesday 3:00pm ET",
        "courseID": "50994",
        "sectionID": "",
        "schedule": [
            {"day": 3, "hour": 15, "minute": 0, "duration": 60}
        ]
    },
    {
        "Enabled": true,
        "CallName": "Traffic Lab",
        "ZoomOrObvioURL": "https://us06web.zoom.us/j/81949703883?pwd=PvypOsj0tE3taeLkyjthb3HHYXL3rr.1",
        "live": "Monday 12:00pm ET",
        "courseID": "47548",
        "sectionID": "",
        "schedule": [
            {"day": 1, "hour": 12, "minute": 0, "duration": 60}
        ]
    },
    {
        "Enabled": true,
        "CallName": "ClickFunnels Tech Call",
        "ZoomOrObvioURL": "https://tech.obv.io/area/bL0Q2qMN2BZDMyne",
        "live": "Wednesday 7:00pm ET",
        "courseID": "48992",
        "sectionID": "",
        "schedule": [
            {"day": 3, "hour": 19, "minute": 0, "duration": 60}
        ]
    }
];

var offlineText = "Live Room Is Currently Offline";

// Placeholder values if `enrolledCourses` and `enrolledSections` are not provided
var enrolledCourses = typeof enrolledCourses !== 'undefined' ? enrolledCourses : [];
var enrolledSections = typeof enrolledSections !== 'undefined' ? enrolledSections : [];

// Get the current time in Eastern Time (ET) using Moment.js
function getEasternTime() {
    return moment.tz("America/New_York");
}

// Function to filter zoomCalls based on enrollment
function filterZoomCallsByEnrollment(calls) {
    return calls.filter(function(call) {
        var isEnrolledInCourse = enrolledCourses.includes(call.courseID);
        var isEnrolledInSection = call.sectionID && enrolledSections.includes(call.sectionID);
        return call.sectionID ? isEnrolledInSection : isEnrolledInCourse;
    });
}

// Function to check the current status of calls
function updateLiveRoomButton() {
    var liveRoomButton = document.getElementById('liveRoomButton');
    if (!liveRoomButton) return;

    var buttonText = liveRoomButton.querySelector('.elButtonSub');
    var buttonLink = liveRoomButton.querySelector('a');
    var innerButton = liveRoomButton.querySelector('.elButton');
    var liveSessionImage = document.getElementById('liveSession');

    var availableZoomCalls = filterZoomCallsByEnrollment(zoomCalls);

    var now = getEasternTime();
    var currentDay = now.day();
    var currentMinutesSinceMidnight = now.hour() * 60 + now.minute();

    var newText = offlineText;
    var newHref = "#";
    var inProgress = false;

    for (var i = 0; i < availableZoomCalls.length; i++) {
        var call = availableZoomCalls[i];
        if (!call.Enabled) continue;

        for (var j = 0; j < call.schedule.length; j++) {
            var schedule = call.schedule[j];
            var startMinutesSinceMidnight = schedule.hour * 60 + schedule.minute;
            var endMinutesSinceMidnight = startMinutesSinceMidnight + schedule.duration;
            var openMinutesSinceMidnight = startMinutesSinceMidnight - 10;
            var soonStartMinutesSinceMidnight = startMinutesSinceMidnight - 30;

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
        if (newText !== offlineText) break;
    }

    if (buttonText) buttonText.textContent = newText;
    if (buttonLink) {
        if (newText === offlineText) {
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

// Initial update on page load
document.addEventListener('DOMContentLoaded', function() {
    updateLiveRoomButton();
    setInterval(updateLiveRoomButton, 30000);
});
