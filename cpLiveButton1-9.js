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
        const endMinutesSinceMidnight = startMinutesSinceMidnight + schedule.duration;
        const soonStartMinutesSinceMidnight = startMinutesSinceMidnight - 30;

        const targetUrl = isUserHost(nextCall) && nextCall.hostLink ? nextCall.hostLink : nextCall.ZoomOrObvioURL;
        const prefixText = isHost ? "HOST: " : "";

        if (currentDay === schedule.day) {
            if (currentMinutesSinceMidnight >= startMinutesSinceMidnight && currentMinutesSinceMidnight < endMinutesSinceMidnight) {
                // Display "IN PROGRESS" when the session is live
                newText = `${prefixText}${nextCall.CallName} - ${nextCall.live} - IN PROGRESS`;
                newHref = targetUrl;
                inProgress = true;
            } else if (currentMinutesSinceMidnight >= soonStartMinutesSinceMidnight && currentMinutesSinceMidnight < startMinutesSinceMidnight) {
                // Display "STARTING SOON" if within 30 minutes of start time
                newText = `${prefixText}${nextCall.CallName} - ${nextCall.live} - STARTING SOON`;
                newHref = targetUrl;
            } else if (isHost) {
                // For hosts, display the next meeting as "UPCOMING MEETING"
                newText = `${prefixText}${nextCall.CallName} - ${nextCall.live} - UPCOMING MEETING`;
                newHref = targetUrl;
            }
        }
    }

    // Update button and link attributes
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
