// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const availabilityForm = document.getElementById('availabilityForm');
    const arrivalDateInput = document.getElementById('arrivalDateInput');
    const departureDateInput = document.getElementById('departureDateInput');
    const occupantsInput = document.getElementById('occupantsInput');
    const agesContainer = document.getElementById('agesContainer');
    const resultBox = document.getElementById('resultBox');
    const checkButton = document.getElementById('checkButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    // Set the minimum arrival date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    arrivalDateInput.min = `${year}-${month}-${day}`;

    // Function to format date from ISO (YYYY-MM-DD) to DD/MM/YYYY
    function formatDateToDDMMYYYY(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    // Function to show the loading spinner and disable the button
    function showLoading() {
        checkButton.disabled = true; // Disable the button
        buttonText.style.display = 'none'; // Hide the button text
        loadingSpinner.style.display = 'inline-block'; // Show the spinner
        resultBox.style.display = 'none'; // Hide the result box when loading starts
        resultBox.innerHTML = ''; // Clear previous results
    }

    // Function to hide the loading spinner and enable the button
    function hideLoading() {
        checkButton.disabled = false; // Enable the button
        buttonText.style.display = 'inline'; // Show the button text
        loadingSpinner.style.display = 'none'; // Hide the spinner
    }

    // Function to generate age input fields based on the number of occupants
    function generateAgeInputs() {
        agesContainer.innerHTML = ''; // Clear existing age inputs

        const occupants = parseInt(occupantsInput.value);

        // Check if occupants is a valid positive number
        if (occupants > 0) {
            agesContainer.style.display = 'block'; // Show the ages container

            const agesLabel = document.createElement('p');
            agesLabel.style.fontWeight = '600';
            agesLabel.style.marginBottom = '0.5rem';
            agesLabel.textContent = 'Ages of Occupants:';
            agesContainer.appendChild(agesLabel);

            for (let i = 0; i < occupants; i++) {
                const label = document.createElement('label');
                label.textContent = `Occupant ${i + 1} Age:`;
                const input = document.createElement('input');
                input.type = 'number';
                input.name = `age_${i}`; // Unique name for each age input
                input.min = '0'; // Minimum age can be 0 (for infants)
                input.required = true; // Make age fields required
                input.classList.add('age-input'); // Add a class for easier selection later
                input.style.marginBottom = '0.75rem'; // Apply inline style for spacing

                label.appendChild(input);
                agesContainer.appendChild(label);
            }
        } else {
            agesContainer.style.display = 'none'; // Hide the ages container if occupants is not valid or 0
        }
    }

    // Event listener to dynamically set min date for Departure based on Arrival
    arrivalDateInput.addEventListener('input', () => {
        const arrivalDate = new Date(arrivalDateInput.value);
        // Add one day to the arrival date for the minimum departure date
        arrivalDate.setDate(arrivalDate.getDate() + 1);
        const minDepartureDate = arrivalDate.toISOString().split('T')[0];
        departureDateInput.min = minDepartureDate;

        // If current departure date is earlier than new min, reset it
        if (departureDateInput.value && new Date(departureDateInput.value) < arrivalDate) {
            departureDateInput.value = minDepartureDate;
        }
    });

    // Add event listener to the Occupants input for dynamic age field generation
    occupantsInput.addEventListener('input', generateAgeInputs);

    // Initial generation of age inputs in case a default value is set or user refreshes
    // This also ensures the agesContainer's initial visibility is correct
    generateAgeInputs();

    // Add event listener for form submission
    availabilityForm.addEventListener('submit', async function (e) {
        e.preventDefault(); // Prevent default form submission

        // --- Client-side date validation ---
        const arrDate = new Date(arrivalDateInput.value);
        const depDate = new Date(departureDateInput.value);

        if (depDate <= arrDate) {
            resultBox.innerHTML = `<div style="color: #d33; font-weight: bold;">Error: Departure Date must be after Arrival Date.</div>`;
            resultBox.style.display = 'block';
            return; // Stop form submission
        }
        // --- End client-side date validation ---

        showLoading(); // Call showLoading function (moved after initial validation)

        const form = e.target;
        const arrivalDate = formatDateToDDMMYYYY(form.Arrival.value);
        const departureDate = formatDateToDDMMYYYY(form.Departure.value);

        // Collect ages from dynamically generated input fields
        const ageInputs = document.querySelectorAll('.age-input');
        const ages = Array.from(ageInputs).map(input => parseInt(input.value.trim()));

        // Construct the payload for the API request
        const payload = {
            "Arrival": arrivalDate,
            "Departure": departureDate,
            "Unit Name": form.UnitName.value, // Now gets value from the select element
            "Occupants": parseInt(form.Occupants.value), // Occupants
            "Ages": ages // Ages array
        };

        try {
            // IMPORTANT CHANGE: Use a relative path for the API call
            const res = await fetch('http://localhost/gondwana-php-api/api/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json(); // This line expects JSON response

            // Check if the response data is an array and if it's empty
            if (!Array.isArray(data)) {
                resultBox.innerHTML = `<div style="color: #d33; font-weight: bold;">⚠️ Unexpected response format. Please try again or contact support.</div>`;
                resultBox.style.display = 'block'; // Show result box with error
                return; // Exit the function
            }

            if (data.length === 0) {
                resultBox.innerHTML = `<div style="color: #0077ff; font-weight: bold;">No units found matching your criteria. Please adjust your dates or unit type and try again.</div>`;
                resultBox.style.display = 'block'; // Show result box with specific message
                return;
            }

            // Map the data to formatted HTML messages with color-coded availability
            const messagesHtml = data.map(item => {
                const availabilityColor = item["Availability"] === "Available" ? '#28a745' : '#dc3545'; // Green for available, red for not
                return `<div class="unit-result">
                    Unit: <span style="font-weight: bold;">${item["Unit Name"]}</span><br>
                    Rate: ${item["Rate"]}<br>
                    Dates: ${item["Date Range"]}<br>
                    Availability: <span style="color: ${availabilityColor}; font-weight: bold;">${item["Availability"]}</span>
                </div>`;
            });

            // Display the formatted HTML messages in the result box
            resultBox.innerHTML = messagesHtml.join('');
            resultBox.style.display = 'block'; // Show result box with results

        } catch (err) {
            console.error("Fetch error:", err); // Log the actual error for debugging
            // Provide a more descriptive error message for network/parsing issues
            resultBox.innerHTML = `<div style="color: #d33; font-weight: bold;">Could not connect to the booking service. Please check your internet connection or the API path. Error details: ${err.message}.</div>`;
            resultBox.style.display = 'block'; // Show result box with error message
        } finally {
            // Always hide the loading spinner and enable the button after the request completes
            hideLoading();
        }
    });
});