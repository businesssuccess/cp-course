console.log("CPCourseActivity Version 1-3");

// Import Firestore functions for logging course activity
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Function to log course activity with an access log
export async function logCourseActivity(email, courseId, activityData) {
  console.log("Starting logCourseActivity function");
  console.log("Email:", email);
  console.log("Course ID:", courseId);
  console.log("Activity Data:", activityData);

  try {
    // Create a document reference for the contact
    const contactDocRef = doc(window.db, "contacts", email);
    console.log("Document reference created for:", email);

    // Retrieve the existing document to check for previous access logs
    const contactDoc = await getDoc(contactDocRef);
    console.log("Document retrieved:", contactDoc.exists() ? "Document exists" : "Document does not exist");

    // Get today's date as a string
    const todayDate = new Date().toISOString().split('T')[0];
    console.log("Today's Date:", todayDate);

    // Placeholder for the IP address (replace with actual method to get the IP if needed)
    const userIP = activityData.ip || "Unknown";
    console.log("User IP:", userIP);

    // Initialize or update access log
    let accessLog = contactDoc.exists() && contactDoc.data().course_activity?.[courseId]?.access_log || [];
    console.log("Initial Access Log:", accessLog);

    const alreadyLogged = accessLog.some(entry => entry.date === todayDate && entry.ip === userIP);
    console.log("Already logged today with same IP:", alreadyLogged);

    // Only add a new entry if today's date and IP aren't already logged
    if (!alreadyLogged) {
      accessLog.push({ date: todayDate, ip: userIP });
      console.log("New entry added to access log:", { date: todayDate, ip: userIP });
    } else {
      console.log("No new entry added, already logged today.");
    }

    // Structure the new data to add or update under the specific course ID
    const dataToUpdate = {
      course_activity: {
        [courseId]: {
          last_accessed: new Date().toISOString(),
          access_log: accessLog // Log unique access attempts
        }
      }
    };
    console.log("Data to update:", dataToUpdate);

    // Write the new data with merge to avoid overwriting existing data
    await setDoc(contactDocRef, dataToUpdate, { merge: true });
    console.log(`Course activity for ${courseId} logged successfully for ${email}.`);
  } catch (error) {
    console.error("Error logging course activity to Firestore:", error);
  }
}
