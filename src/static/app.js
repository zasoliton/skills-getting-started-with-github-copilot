document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      // Reset activity select to avoid duplicate options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Render participants section (bulleted list)
        const participants = details.participants || [];
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsTitle = document.createElement("p");
        participantsTitle.innerHTML = "<strong>Participants:</strong>";
        participantsDiv.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (participants.length > 0) {
          participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant";

            // participant email text
            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;

            // delete button
            const del = document.createElement("button");
            del.className = "delete-participant";
            del.type = "button";
            del.setAttribute("aria-label", `Remove ${p}`);
            del.innerHTML = "&times;";

            li.appendChild(span);
            li.appendChild(del);
            ul.appendChild(li);

            // delete handler
            del.addEventListener("click", async () => {
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: "POST" }
                );
                const resJson = await resp.json();
                if (resp.ok) {
                  // update local data and UI
                  details.participants = details.participants.filter((x) => x !== p);
                  li.remove();

                  const availabilityP = activityCard.querySelector(".availability");
                  const newSpots = details.max_participants - details.participants.length;
                  if (availabilityP) availabilityP.innerHTML = `<strong>Availability:</strong> ${newSpots} spots left`;

                  // if no participants remain, show placeholder
                  const remaining = activityCard.querySelectorAll('.participants-list .participant').length;
                  if (remaining === 0) {
                    const none = document.createElement('li');
                    none.className = 'no-participants';
                    none.textContent = 'No participants yet';
                    ul.appendChild(none);
                  }

                  messageDiv.textContent = resJson.message || 'Participant removed';
                  messageDiv.className = 'success';
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                }
              } catch (error) {
                messageDiv.textContent = 'Failed to remove participant. Please try again.';
                messageDiv.className = 'error';
                console.error('Error removing participant:', error);
              }
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            });
          });
        } else {
          const li = document.createElement("li");
          li.className = "no-participants";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities to reflect the new participant immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
