console.log("CPHostTools Version 1-0");



// Define Google Sheet URL
const programSheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR0hAJJi-JYNbxLJQG8SOe0E36EYFi04AMZG3JP4YSzrSyHx0DXoJv_z8XKOXezYt62pumzK5eZN1hM/pub?gid=114880507&single=true&output=csv";

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
                    if (loggedInUserEmail === 'jason@funneljedi.com') {
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
        //console.log("Program buttons added to the page.");
    } else {
        //console.log("No matching programs found for the current user.");
    }
}

// Initial call to fetch and display program buttons
document.addEventListener('DOMContentLoaded', function() {
    fetchProgramsFromSheet(createProgramButtons);
});
