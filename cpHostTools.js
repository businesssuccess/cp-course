console.log("CPHostTools Version 1-5");

// Define Google Sheet URL
const programSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=114880507&single=true&output=csv";

// Define guest stream link
const guestStreamLink = "https://www.connectingpieces.com/guest-stream"; // Replace with the actual link

// Function to fetch programs from Google Sheet CSV
function fetchProgramsFromSheet(callback) {
    fetch(programSheetUrl)
        .then(response => response.text())
        .then(csvText => {
            let programs = [];
            let rows = csvText.split("\n");
            let headers = rows[0].split(",");

            for (let i = 1; i < rows.length; i++) {
                let values = rows[i].split(",");
                let programData = {};

                headers.forEach((header, index) => {
                    programData[header.trim()] = values[index] ? values[index].trim() : "";
                });

                if (programData['Active'] === "TRUE") {
                    programs.push(programData);
                }
            }
            callback(programs);
        })
        .catch(error => console.error("Error fetching Google Sheet data:", error));
}

// Function to create a button for each program
function createProgramButtons(programs) {
    const hosts = ['Host1', 'Host2', 'Host3', 'Host4', 'Host5']; // Columns to check for hosts
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "85px"; // Adjusted top position
    wrapper.style.left = "20px";
    wrapper.style.textAlign = "center";
    wrapper.style.zIndex = "50000";

    // Create a title above the buttons
    const title = document.createElement("div");
    title.innerText = "HOST TOOLS";
    title.style.color = "white";
    title.style.fontSize = "24px";
    title.style.marginBottom = "10px";
    wrapper.appendChild(title);

    // Create a container div for the buttons
    const container = document.createElement("div");
    container.id = "programToolsContainer";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "1fr 1fr";
    container.style.gridGap = "1px";
    container.style.textAlign = "left";

    programs.forEach(program => {
        const isHostMatch = hosts.some(hostKey => program[hostKey] && program[hostKey] === loggedInUserEmail);

        if (isHostMatch) {
            const button = document.createElement("button");
            button.innerText = program['Course Name'];

            // Check if the course name is 'BRG / Admin Room' or 'Client Zoom Room' and change the color
            const isSpecialCourse = ['BRG / Admin Room', 'Client Zoom Room'].includes(program['Course Name']);
            const buttonColor = isSpecialCourse ? '#000B71' : '#D30A16';

            Object.assign(button.style, {
                backgroundColor: buttonColor,
                color: "white",
                padding: "20px 10px",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                textAlign: "center",
                width: "100%",
                height: "60px",
                boxSizing: "border-box"
            });

            const link = program['HostLink'] || program['ZoomOrObvioLink'];
            button.onclick = function() {
                if (!program['HostLink'] && loggedInUserEmail !== 'adam.boag@gmail.com') {
                    // Show popup for non-Adam users without a HostLink
                    showPopup(link);
                } else {
                    // Directly open the link
                    window.open(link, '_blank');
                    if (loggedInUserEmail === 'jason@funneljedi.com' && guestStreamLink) {
                        window.open(guestStreamLink, '_blank');
                    }
                }
            };

            container.appendChild(button);
        }
    });

    if (container.children.length > 0) {
        wrapper.appendChild(container);
        document.body.appendChild(wrapper);
    }
}

// Function to display a popup
function showPopup(link) {
    // Check if a popup already exists
    let popup = document.getElementById('customPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'customPopup';
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#D30A16',
            color: 'white',
            padding: '20px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: '10000',
            textAlign: 'center',
            borderRadius: '8px',
            maxWidth: '300px',
            width: '90%',
            fontFamily: 'Arial, sans-serif'
        });

        const message = document.createElement('p');
        message.innerText = "If you are the host, please log into Adam's Zoom account first.";
        message.style.marginBottom = '15px';
        popup.appendChild(message);

        const openRoomButton = document.createElement('button');
        openRoomButton.innerText = 'Open Room';
        Object.assign(openRoomButton.style, {
            backgroundColor: 'white',
            color: '#D30A16',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '14px',
            borderRadius: '5px',
            marginRight: '10px'
        });
        openRoomButton.onclick = function() {
            window.open(link, '_blank');
            if (loggedInUserEmail === 'jason@funneljedi.com' && guestStreamLink) {
                window.open(guestStreamLink, '_blank');
            }
            document.body.removeChild(popup);
        };
        popup.appendChild(openRoomButton);

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        Object.assign(closeButton.style, {
            backgroundColor: 'white',
            color: '#D30A16',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '14px',
            borderRadius: '5px'
        });
        closeButton.onclick = function() {
            document.body.removeChild(popup);
        };
        popup.appendChild(closeButton);

        document.body.appendChild(popup);
    }
}

// Initial call to fetch and display program buttons
document.addEventListener('DOMContentLoaded', function() {
    fetchProgramsFromSheet(createProgramButtons);
});
