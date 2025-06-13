document.addEventListener('DOMContentLoaded', () => {
    const availabilityForm = document.getElementById('availabilityForm');
    const arrivalDateInput = document.getElementById('arrivalDateInput');
    const departureDateInput = document.getElementById('departureDateInput');
    const occupantsInput = document.getElementById('occupantsInput');
    const agesContainer = document.getElementById('agesContainer');
    const resultBox = document.getElementById('resultBox');
    const checkButton = document.getElementById('checkButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    arrivalDateInput.min = `${year}-${month}-${day}`;

    function formatDateToDDMMYYYY(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function showLoading() {
        checkButton.disabled = true;
        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
        resultBox.style.display = 'none';
        resultBox.innerHTML = '';
    }

    function hideLoading() {
        checkButton.disabled = false;
        buttonText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }

    function generateAgeInputs() {
        agesContainer.innerHTML = '';

        const occupants = parseInt(occupantsInput.value);

        if (occupants > 0) {
            agesContainer.style.display = 'block';

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
                input.name = `age_${i}`;
                input.min = '0';
                input.required = true;
                input.classList.add('age-input');
                input.style.marginBottom = '0.75rem';

                label.appendChild(input);
                agesContainer.appendChild(label);
            }
        } else {
            agesContainer.style.display = 'none';
        }
    }

    arrivalDateInput.addEventListener('input', () => {
        const arrivalDate = new Date(arrivalDateInput.value);
        arrivalDate.setDate(arrivalDate.getDate() + 1);
        const minDepartureDate = arrivalDate.toISOString().split('T')[0];
        departureDateInput.min = minDepartureDate;

        if (departureDateInput.value && new Date(departureDateInput.value) < arrivalDate) {
            departureDateInput.value = minDepartureDate;
        }
    });

    occupantsInput.addEventListener('input', generateAgeInputs);
    generateAgeInputs();

    availabilityForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const arrDate = new Date(arrivalDateInput.value);
        const depDate = new Date(departureDateInput.value);

        if (depDate <= arrDate) {
            resultBox.innerHTML = `<div style="color: #d33; font-weight: bold;">Error: Departure Date must be after Arrival Date.</div>`;
            resultBox.style.display = 'block';
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        showLoading();

        const form = e.target;
        const arrivalDate = formatDateToDDMMYYYY(form.Arrival.value);
        const departureDate = formatDateToDDMMYYYY(form.Departure.value);

        const ageInputs = document.querySelectorAll('.age-input');
        const ages = Array.from(ageInputs).map(input => parseInt(input.value.trim()));

        const payload = {
            "Arrival": arrivalDate,
            "Departure": departureDate,
            "Unit Name": form.UnitName.value,
            "Occupants": parseInt(form.Occupants.value),
            "Ages": ages
        };

        try {
            const res = await fetch('/api/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!Array.isArray(data)) {
                resultBox.innerHTML = `<div style="color: #d33; font-weight: bold;">⚠️ Unexpected response format. Please try again or contact support.</div>`;
                resultBox.style.display = 'block';
                resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            if (data.length === 0) {
                resultBox.innerHTML = `<div style="color: #0077ff; font-weight: bold;">No units found matching your criteria. Please adjust your dates or unit type and try again.</div>`;
                resultBox.style.display = 'block';
                resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            const resultCount = `<div style="margin-bottom: 1rem; font-weight: bold; font-size: 1.1rem;">🔍 ${data.length} propert${data.length === 1 ? 'y' : 'ies'} found</div>`;

            const messagesHtml = data.map(item => {
                const availabilityColor = item["Availability"] === "Available" ? '#28a745' : '#dc3545';
                return `<div class="unit-result">
                    Unit: <span style="font-weight: bold;">${item["Unit Name"]}</span><br>
                    Rate: ${item["Rate"]}<br>
                    Dates: ${item["Date Range"]}<br>
                    Availability: <span style="color: ${availabilityColor}; font-weight: bold;">${item["Availability"]}</span>
                </div>`;
            });

            resultBox.innerHTML = resultCount + messagesHtml.join('');
            resultBox.style.display = 'block';
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (err) {
            console.error("Fetch error:", err);
            resultBox.innerHTML = `<div style="color: #d33; font-weight: bold;">Could not connect to the booking service. Please check your internet connection or the API path. Error details: ${err.message}.</div>`;
            resultBox.style.display = 'block';
            resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } finally {
            hideLoading();
        }
    });
});