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

    init();
});

// State management
let currentDate = new Date();
let selectedDate = null;
let allPlans = [];

// DOM Elements
const monthYearEl = document.getElementById('monthYear');
const calendarGridEl = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const notesSectionEl = document.getElementById('notesSection');
const selectedDateEl = document.getElementById('selectedDate');
const notesListEl = document.getElementById('notesList');
const addButton = document.querySelector('.add-button');
const planModal = document.getElementById('planModal');
const closeModalBtn = document.getElementById('closeModal');
const savePlanBtn = document.getElementById('savePlan');
const planDateInput = document.getElementById('planDate');
const planNotesInput = document.getElementById('planNotes');
const planTimeInput = document.getElementById('planTime');
const planLocationInput = document.getElementById('planLocation');

// Initialize
async function init() {
    await loadPlans();
    updateCurrentDateDisplay();
    renderCalendar();
    setupEventListeners();
}

// Update current date display in header
function updateCurrentDateDisplay() {
    const dateEl = document.querySelector('.date');
    if (dateEl) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

// Load plans from database
async function loadPlans() {
    try {
        const response = await fetch('/api/plans', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const plans = await response.json();
        
        if (response.ok) {
            allPlans = plans;
        } else {
            console.error('Failed to load plans');
            allPlans = [];
        }
    } catch (error) {
        console.error('Error loading plans:', error);
        allPlans = [];
    }
}

// Get plans for a specific date
function getPlansForDate(dateKey) {
    return allPlans.filter(plan => plan.date === dateKey);
}

// Setup event listeners
function setupEventListeners() {
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Add button to open modal
    if (addButton) {
        addButton.addEventListener('click', openPlanModal);
    }

    // Close modal button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePlanModal);
    }

    // Save plan button
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', savePlan);
    }

    // Close modal when clicking outside
    if (planModal) {
        planModal.addEventListener('click', (e) => {
            if (e.target === planModal) {
                closePlanModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && planModal.style.display === 'flex') {
            closePlanModal();
        }
    });
}

// Open plan modal
function openPlanModal() {
    document.body.classList.add('modal-open');
    
    // Pre-fill date if a date is selected
    if (selectedDate) {
        planDateInput.value = formatDateForInput(selectedDate);
    }
    
    planModal.style.display = 'flex';
}

// Close plan modal
function closePlanModal() {
    document.body.classList.remove('modal-open');
    planModal.style.display = 'none';
    
    // Clear form
    planDateInput.value = '';
    planNotesInput.value = '';
    planTimeInput.value = '';
    planLocationInput.value = '';
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

// Save plan
async function savePlan() {
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
    savePlanBtn.disabled = true;
    savePlanBtn.textContent = 'Saving...';
    
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
            // Reload plans from database
            await loadPlans();
            
            // Close modal
            closePlanModal();
            
            // Refresh calendar
            renderCalendar();
            
            // If the saved date is selected, update notes display
            if (selectedDate && formatDate(selectedDate) === date) {
                renderNotes();
            }
            
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
        savePlanBtn.disabled = false;
        savePlanBtn.textContent = 'Save Plan';
    }
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;

    // Clear calendar
    calendarGridEl.innerHTML = '';

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(year, month, day);
        dayDate.setHours(0, 0, 0, 0);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayEl.appendChild(dayNumber);

        // Get plans for this day
        const dateKey = formatDate(dayDate);
        const dayPlans = getPlansForDate(dateKey);
        
        // Add note preview
        if (dayPlans.length > 0) {
            const notePreview = document.createElement('div');
            notePreview.className = 'note-preview';
            notePreview.textContent = dayPlans[0].notes;
            dayEl.appendChild(notePreview);
            dayEl.classList.add('has-notes');
        }

        // Determine day status
        if (dayDate.getTime() === today.getTime()) {
            dayEl.classList.add('today');
        } else if (dayDate < today) {
            dayEl.classList.add('past');
        } else {
            dayEl.classList.add('future');
        }

        // Add click event
        dayEl.addEventListener('click', () => selectDate(dayDate, dayEl));
        
        calendarGridEl.appendChild(dayEl);
    }

    // Fill remaining cells to complete the grid
    const totalCells = Math.ceil(daysInMonth / 4) * 4;
    for (let i = daysInMonth; i < totalCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGridEl.appendChild(emptyDay);
    }
}

// Format date as string key
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    return formatDate(date);
}

// Format date for display
function formatDateDisplay(date) {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Select a date
function selectDate(date, dayEl) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Add selection to clicked day
    dayEl.classList.add('selected');
    
    selectedDate = date;
    selectedDateEl.textContent = formatDateDisplay(date);
    
    notesSectionEl.style.display = 'block';
    renderNotes();
}

// Render notes for selected date
function renderNotes() {
    if (!selectedDate) {
        notesListEl.innerHTML = '<p class="no-notes">Select a date</p>';
        return;
    }

    const dateKey = formatDate(selectedDate);
    const dayPlans = getPlansForDate(dateKey);

    if (dayPlans.length === 0) {
        notesListEl.innerHTML = '<p class="no-notes">No notes for this date</p>';
        return;
    }

    notesListEl.innerHTML = '';
    dayPlans.forEach((plan) => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        
        const noteText = document.createElement('div');
        noteText.className = 'note-text';
        
        // Build display text
        let displayText = plan.notes;
        if (plan.time) {
            const formattedTime = formatTimeWithAMPM(plan.time);
            displayText += ` at ${formattedTime}`;
        }
        if (plan.location) {
            displayText += ` - ${plan.location}`;
        }
        
        noteText.textContent = displayText;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', () => deletePlan(plan.id));
        
        noteItem.appendChild(noteText);
        noteItem.appendChild(deleteBtn);
        notesListEl.appendChild(noteItem);
    });
}

// Delete plan
async function deletePlan(planId) {
    if (!confirm('Are you sure you want to delete this plan?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/plans/${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Reload plans from database
            await loadPlans();
            
            // Refresh calendar
            renderCalendar();
            
            // Refresh notes if a date is selected
            if (selectedDate) {
                renderNotes();
            }
            
            alert('Plan deleted successfully!');
        } else {
            alert(data.message || 'Failed to delete plan');
        }
    } catch (error) {
        console.error('Error deleting plan:', error);
        alert('An error occurred while deleting the plan');
    }
}
