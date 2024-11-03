console.log("CPCourseActivity Version 1-2");

// Import Firestore functions for logging course activity
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Function to log course activity with an access log
export async function logCourseActivity(email, courseId, activityData) {
  try {
    // Create a document reference for the contact
    const contactDocRef = doc(window.db, "contacts", email);

    // Retrieve the existing document to check for previous access logs
    const contactDoc = await getDoc(contactDocRef);

    // Get today's date as a string
    const todayDate = new Date().toISOString().split('T')[0];

    // Placeholder for the IP address (replace with actual method to get the IP if needed)
    const userIP = activityData.ip || "Unknown"; // Replace with a method to get the real IP if available

    // Initialize or update access log
    let accessLog = contactDoc.exists() && contactDoc.data().course_activity?.[courseId]?.access_log || [];
    const alreadyLogged = accessLog.some(entry => entry.date === todayDate && entry.ip === userIP);

    // Only add a new entry if today's date and IP aren't already logged
    if (!alreadyLogged) {
      accessLog.push({ date: todayDate, ip: userIP });
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

    // Write the new data with merge to avoid overwriting existing data
    await setDoc(contactDocRef, dataToUpdate, { merge: true });

    console.log(`Course activity for ${courseId} logged successfully for ${email}.`);
  } catch (error) {
    console.error("Error logging course activity to Firestore:", error);
  }
}


