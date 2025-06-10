document.addEventListener('DOMContentLoaded', () => {

            const availabilityForm = document.getElementById('availabilityForm');
            const resultBox = document.getElementById('resultBox');
            const checkButton = document.getElementById('checkButton');
            const buttonText = document.getElementById('buttonText');
            const loadingSpinner = document.getElementById('loadingSpinner');
            const agesContainer = document.getElementById('agesContainer');
            const occupantsInput = document.getElementById('occupantsInput')
            const arrivalDateInput = document.getElementById("arrivalDateInput")
            const departureDateInput = document.getElementById("departureDateInput")

            const currentDate = new Date()
            const year = currentDate.getFullYear()
            const month = String(currentDate.getMonth() + 1).padStart(2, "0")
            const day = String(currentDate.getDate()).padStart(2, "0")
            arrivalDateInput.min = `${year}-${month}-${day}`
    
            function formatDateToDDMMYYYY(dateStr) {
                const [year, month, day] = dateStr.split('-');
                return `${day}/${month}/${year}`;
            }

            function showLoading() {
                checkButton.disabled = true;
                buttonText.style.display = 'none';
                loadingSpinner.style.display = 'inline-block';
                resultBox.style.display = 'none';
            }

            function hideLoading() {
                checkButton.disabled = false;
                buttonText.style.display = 'inline';
                loadingSpinner.style.display = 'none';
            }

            function generateAgeInputs() {
                agesContainer.innerHTML = ''
                const occupants = parseInt(occupantsInput.value)

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

                        label.appendChild(input);
                        agesContainer.appendChild(label);
                    }
                } else {
                    agesContainer.style.display = 'none';
                }
            }

            arrivalDateInput.addEventListener('input', () => {
                const arrivalDate = new Date(arrivalDateInput.value)
                arrivalDate.setDate(arrivalDate.getDate() + 1)
                const minDepartureDate = arrivalDate.toISOString().split('T')[0]
                departureDateInput.min = minDepartureDate

                if(departureDateInput.value && new Date(departureDateInput.value) < arrivalDate){
                    departureDateInput.value = minDepartureDate
                }
            })

            occupantsInput.addEventListener('input', generateAgeInputs)
            generateAgeInputs()

            availabilityForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                showLoading();

                const form = e.target;
                const arrivalDate = formatDateToDDMMYYYY(form.Arrival.value);
                const departureDate = formatDateToDDMMYYYY(form.Departure.value);

                const ageInputs = document.querySelectorAll('.age-input')
                const ages = Array.from(ageInputs).map(input => parseInt(input.value.trim()))

                const payload = {
                    "Arrival": arrivalDate,
                    "Departure": departureDate,
                    "Unit Name": form.UnitName.value,
                    "Ages": ages,
                    "Occupants": parseInt(form.Occupants.value)
                };

                try {
                    const res = await fetch('http://localhost/gondwana-php-api/api/index.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();

                    if (!Array.isArray(data)) {
                        resultBox.textContent = "Unexpected response format.";
                        resultBox.style.color = '#d33';
                        resultBox.style.display = 'block';
                        return;
                    }

                    const messages = data.map(item => {
                        return `Unit: ${item["Unit Name"]}\nRate: ${item["Rate"]}\nDates: ${item["Date Range"]}\nAvailability: ${item["Availability"]}\n`;
                    });

                    resultBox.textContent = messages.join('\n');
                    resultBox.style.color = '#000';
                    resultBox.style.display = 'block';

                } catch (err) {
                    console.error("Fetch error:", err);
                    resultBox.textContent = "Request failed. Try again later.";
                    resultBox.style.color = '#d33';
                    resultBox.style.display = 'block';
                } finally {
                    hideLoading();
                }
            });
        });