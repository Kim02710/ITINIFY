document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
    }

    const usernameEl = document.querySelector('.username');
    const avatarInnerEl = document.querySelector('.avatar-inner');

    fetch('/api/user/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(user => {
        usernameEl.textContent = user.username.toUpperCase();
        if (user.profile_image) {
            avatarInnerEl.innerHTML = `<img src="/uploads/${user.profile_image}" alt="Profile" class="profile-image-icon" />`;
        }
    });

    updateCurrentDate();
    loadAndRenderPlanCard();
    loadWeatherForecast();
});

// DOM Elements
const addButton = document.getElementById('addButton');
const closeModal = document.getElementById('closeModal');
const planModal = document.getElementById('planModal');
const savePlanButton = document.getElementById('savePlan');
const container = document.querySelector('.container');
const planCard = document.getElementById('planCard');
const planDateInput = document.getElementById('planDateInput');
const planNotesInput = document.getElementById('planNotesInput');
const planTimeInput = document.getElementById('planTimeInput');
const planLocationInput = document.getElementById('planLocationInput');

// Update current date in header
function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

// Load weather forecast from API
async function loadWeatherForecast() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
                const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                
                if (response.ok) {
                    renderWeatherCards(data.forecasts);
                } else {
                    console.error('Failed to load weather data:', data.message);
                    renderWeatherError();
                }
            } catch (error) {
                console.error('Error loading weather:', error);
                renderWeatherError();
            }
        }, (error) => {
            console.error('Geolocation error:', error.message);
            renderWeatherError(); // Show error if user denies location
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
        renderWeatherError();
    }
}

// Get weather icon class based on weather condition
function getWeatherIcon(weatherMain) {
    const iconMap = {
        'Clear': { icon: 'fa-sun', color: '#FFDD00' },
        'Clouds': { icon: 'fa-cloud', color: '#00D4FF' },
        'Rain': { icon: 'fa-cloud-showers-heavy', color: '#00D4FF' },
        'Drizzle': { icon: 'fa-cloud-rain', color: '#00D4FF' },
        'Thunderstorm': { icon: 'fa-cloud-bolt', color: '#00D4FF' },
        'Snow': { icon: 'fa-snowflake', color: '#00D4FF' },
        'Mist': { icon: 'fa-smog', color: '#00D4FF' },
        'Fog': { icon: 'fa-smog', color: '#00D4FF' },
        'Haze': { icon: 'fa-smog', color: '#00D4FF' }
    };
    
    return iconMap[weatherMain] || { icon: 'fa-cloud', color: '#00D4FF' };
}

// Render weather forecast cards
function renderWeatherCards(forecasts) {
    const forecastCards = document.querySelector('.forecast-cards');
    
    if (!forecasts || forecasts.length === 0) {
        renderWeatherError();
        return;
    }
    
    // Display all available forecasts (up to 5 days typically)
    const displayForecasts = forecasts;
    
    forecastCards.innerHTML = displayForecasts.map(forecast => {
        const weatherIcon = getWeatherIcon(forecast.weatherMain);
        const weatherDescription = forecast.weatherMain === 'Clear' 
            ? `Sunny from 10:00 - 21:00`
            : forecast.rainTimeRange 
                ? `Expected ${forecast.weatherMain.toLowerCase()} from ${forecast.rainTimeRange}`
                : `${forecast.weatherDescription}`;
        
        return `
            <div class="forecast-card">
                <div class="card-header">
                    <div class="day-name">${forecast.dayName}</div>
                    <div class="date-text">${forecast.formattedDate}</div>
                </div>
                <div class="divider"></div>
                <div class="weather-info">
                    <div class="weather-icon">
                        <i class="fa-solid ${weatherIcon.icon}" style="color: ${weatherIcon.color}; font-size: 60px;"></i>
                    </div>
                    <div class="percentage">${forecast.rainProbability}%</div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">${weatherDescription}</div>
                    <div class="weather-detail">Avg Temp: ${forecast.avgTemp}°C</div>
                    <div class="weather-detail">Wind Speed: ${forecast.windSpeed}km/h</div>
                </div>
            </div>
        `;
    }).join('');
}

// Render error state for weather
function renderWeatherError() {
    const forecastCards = document.querySelector('.forecast-cards');
    forecastCards.innerHTML = `
        <div class="forecast-card">
            <div class="card-header">
                <div class="day-name">Weather Unavailable</div>
                <div class="date-text">Unable to load forecast</div>
            </div>
            <div class="divider"></div>
            <div class="weather-info">
                <div class="weather-icon">
                    <i class="fa-solid fa-cloud" style="color: #00D4FF; font-size: 60px;"></i>
                </div>
                <div class="percentage">--</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">Please try again later</div>
            </div>
        </div>
    `;
}
// Load plans from database and render
async function loadAndRenderPlanCard() {
    try {
        const response = await fetch('/api/plans', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const plans = await response.json();
        
        if (response.ok) {
            renderPlanCard(plans);
        } else {
            console.error('Failed to load plans');
            renderPlanCard([]);
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        renderPlanCard([]);
    }
}

// Get upcoming plan from plans array
function getUpcomingPlan(plans) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter future plans and sort by date
    const futurePlans = plans
        .filter(plan => {
            const planDate = new Date(plan.date);
            planDate.setHours(0, 0, 0, 0);
            return planDate >= today;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return futurePlans.length > 0 ? futurePlans[0] : null;
}

// Format time to 12-hour format with AM/PM
function formatTimeWithAMPM(time24) {
    if (!time24) return null;
    
    const [hours, minutes] = time24.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    
    hour = hour % 12;
    hour = hour ? hour : 12; // 0 should be 12
    
    return `${hour}:${minutes} ${ampm}`;
}

// Format date for display
function formatDateDisplay(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Render plan card based on whether there are plans
function renderPlanCard(plans) {
    const upcomingPlan = getUpcomingPlan(plans);
    
    if (!upcomingPlan) {
        // Show "no plans" state
        planCard.className = 'plan-card no-plans-state';
        planCard.innerHTML = `
            <div class="plan-icon">
                <div class="plan-icon-inner"><i class="fa-solid fa-calendar"></i></div>
            </div>
            <div class="plan-status no-plans">No upcoming plans</div>
            <div class="plan-status add-plan-hint">Tap + button to add a new plan</div>
        `;
    } else {
        // Show upcoming plan
        planCard.className = 'plan-card has-plans';
        const dateDisplay = formatDateDisplay(upcomingPlan.date);
        const title = upcomingPlan.notes;
        const time = formatTimeWithAMPM(upcomingPlan.time);
        const location = upcomingPlan.location;
        
        let detailsHTML = '';
        if (time) {
            detailsHTML += `
                <div class="plan-detail-item">
                    <i class="fa-solid fa-clock"></i>
                    <span>Time: ${time}</span>
                </div>
            `;
        }
        if (location) {
            detailsHTML += `
                <div class="plan-detail-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>Location: ${location}</span>
                </div>
            `;
        }
        
        planCard.innerHTML = `
            <div class="plan-date-header">${dateDisplay}</div>
            <div class="plan-title">${title}</div>
            ${detailsHTML ? `<div class="plan-details">${detailsHTML}</div>` : ''}
        `;
    }
}

// Open modal when add button is clicked
addButton.addEventListener('click', () => {
    // Calculate scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Add modal-open class
    document.body.classList.add('modal-open');
    
    // Compensate for scrollbar only on the container
    if (scrollbarWidth > 0) {
        container.style.marginRight = scrollbarWidth + 'px';
    }
    
    planModal.style.display = 'flex';
});

// Close modal when close button is clicked
closeModal.addEventListener('click', () => {
    closeModalFunction();
});

// Close modal when clicking outside
planModal.addEventListener('click', (e) => {
    if (e.target === planModal) {
        closeModalFunction();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && planModal.style.display === 'flex') {
        closeModalFunction();
    }
});

// Save plan functionality
savePlanButton.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Get form values
    const date = planDateInput.value;
    const notes = planNotesInput.value.trim();
    const time = planTimeInput.value;
    const location = planLocationInput.value.trim();
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (!notes) {
        alert('Please enter notes');
        return;
    }
    
    // Disable button to prevent double submission
    savePlanButton.disabled = true;
    savePlanButton.textContent = 'Saving...';
    
    try {
        // Save to database
        const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ date, notes, time, location })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Close modal
            closeModalFunction();
            
            // Refresh plan card
            await loadAndRenderPlanCard();
            
            // Show success message
            alert('Plan saved successfully!');
        } else {
            alert(data.message || 'Failed to save plan');
        }
    } catch (error) {
        console.error('Error saving plan:', error);
        alert('An error occurred while saving the plan');
    } finally {
        // Re-enable button
        savePlanButton.disabled = false;
        savePlanButton.textContent = 'Save Plan';
    }
});

// Function to close modal and reset styles
function closeModalFunction() {
    document.body.classList.remove('modal-open');
    container.style.marginRight = '';
    planModal.style.display = 'none';
    
    // Clear form
    planDateInput.value = '';
    planNotesInput.value = '';
    planTimeInput.value = '';
    planLocationInput.value = '';
}
