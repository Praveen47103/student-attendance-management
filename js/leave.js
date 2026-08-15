// ==========================================
// APPLY DARK MODE FROM STORAGE
// ==========================================

function applyDarkModeFromStorage() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

applyDarkModeFromStorage();


// ==========================================
// LOGIN VALIDATION
// ==========================================

document.addEventListener('DOMContentLoaded', function () {

    // Check if student is logged in
    const savedStudent = localStorage.getItem('loggedInStudent');
    const savedAdmin = localStorage.getItem('loggedInAdmin');

    if (!savedStudent && !savedAdmin) {
        window.location.href = 'index.html';
        return;
    }

    // If admin is logged in, redirect to admin page
    if (savedAdmin && !savedStudent) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // Initialize the page
    initializeLeavePage();

});


// ==========================================
// INITIALIZE PAGE
// ==========================================

function initializeLeavePage() {

    const student = getLoggedInStudent();

    // Update user info
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = student.name || 'Student';
    }

    // Set up form submission
    const form = document.getElementById('leaveForm');
    if (form) {
        form.addEventListener('submit', handleLeaveSubmit);
    }

    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Set up mobile menu
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Load and display leave requests and stats
    displayLeaveRequests();
    updateLeaveStatistics();

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const leaveFrom = document.getElementById('leaveFrom');
    const leaveTo = document.getElementById('leaveTo');

    if (leaveFrom) leaveFrom.setAttribute('min', today);
    if (leaveTo) leaveTo.setAttribute('min', today);

    // Auto-update 'To Date' min when 'From Date' changes
    if (leaveFrom && leaveTo) {
        leaveFrom.addEventListener('change', function () {
            if (this.value) {
                leaveTo.setAttribute('min', this.value);
                if (leaveTo.value && leaveTo.value < this.value) {
                    leaveTo.value = this.value;
                }
            }
        });
    }

}


// ==========================================
// GET LOGGED IN STUDENT HELPER
// ==========================================

function getLoggedInStudent() {
    try {
        return JSON.parse(localStorage.getItem('loggedInStudent')) || {};
    } catch (e) {
        return {};
    }
}

function getStudentRollNumber(student) {
    return (student.rollNo || student.roll || '').trim().toUpperCase();
}


// ==========================================
// HANDLE LEAVE SUBMISSION
// ==========================================

function handleLeaveSubmit(e) {

    e.preventDefault();

    const student = getLoggedInStudent();
    const currentRoll = getStudentRollNumber(student);

    const leaveType = document.getElementById('leaveType').value;
    const leaveFrom = document.getElementById('leaveFrom').value;
    const leaveTo = document.getElementById('leaveTo').value;
    const leaveReason = document.getElementById('leaveReason').value.trim();
    const leaveDescription = document.getElementById('leaveDescription').value.trim();
    const messageEl = document.getElementById('leaveMessage');

    if (!currentRoll) {
        messageEl.textContent = '❌ Unable to identify current student session. Please log in again.';
        messageEl.className = 'form-message error';
        return;
    }

    if (!leaveType || !leaveFrom || !leaveTo || !leaveReason) {
        messageEl.textContent = '❌ Please fill in all required fields.';
        messageEl.className = 'form-message error';
        return;
    }

    // Normalize date strings into Start-of-Day timestamps for exact comparison
    const fromDate = new Date(leaveFrom + 'T00:00:00');
    const toDate = new Date(leaveTo + 'T00:00:00');

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        messageEl.textContent = '❌ Please select valid start and end dates.';
        messageEl.className = 'form-message error';
        return;
    }

    if (toDate < fromDate) {
        messageEl.textContent = '❌ End date must be on or after start date.';
        messageEl.className = 'form-message error';
        return;
    }

    // Calculate days count inclusive
    const days = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get all existing leave requests
    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (err) {
        leaveRequests = [];
    }

    // Filter ONLY active (Pending or Approved) requests belonging to THIS exact student
    const studentActiveLeaves = leaveRequests.filter(req => {
        const reqRoll = (req.studentRoll || '').trim().toUpperCase();
        const isActive = req.status === 'Pending' || req.status === 'Approved';
        return reqRoll === currentRoll && isActive;
    });

    // Check for date overlap ONLY within the current student's active requests
    const overlappingRequest = studentActiveLeaves.find(req => {
        if (!req.fromDate || !req.toDate) return false;
        const reqFrom = new Date(req.fromDate + 'T00:00:00');
        const reqTo = new Date(req.toDate + 'T00:00:00');

        if (isNaN(reqFrom.getTime()) || isNaN(reqTo.getTime())) return false;

        // Interval overlap condition: fromDate <= reqTo && toDate >= reqFrom
        return (fromDate <= reqTo && toDate >= reqFrom);
    });

    if (overlappingRequest) {
        messageEl.textContent = `❌ You already have an existing ${overlappingRequest.status} leave request for these dates (${overlappingRequest.fromDate} to ${overlappingRequest.toDate}).`;
        messageEl.className = 'form-message error';
        return;
    }

    // Create new leave request
    const now = new Date();
    const newLeave = {
        id: Date.now(),
        studentRoll: currentRoll,
        studentName: student.name || 'Student',
        type: leaveType,
        fromDate: leaveFrom,
        toDate: leaveTo,
        days: days,
        reason: leaveReason,
        description: leaveDescription,
        status: 'Pending',
        submittedDate: now.toISOString().split('T')[0],
        submittedTime: now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    };

    // Save to localStorage
    leaveRequests.push(newLeave);
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));

    // Show success message
    messageEl.textContent = '✅ Leave request submitted successfully! Pending admin approval.';
    messageEl.className = 'form-message success';

    // Reset form
    document.getElementById('leaveForm').reset();

    // Reset date constraints
    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('leaveFrom').setAttribute('min', todayStr);
    document.getElementById('leaveTo').setAttribute('min', todayStr);

    // Immediately update UI table and statistics
    displayLeaveRequests();
    updateLeaveStatistics();

    setTimeout(() => {
        if (messageEl.textContent.includes('successfully')) {
            messageEl.textContent = '';
            messageEl.className = 'form-message';
        }
    }, 4000);

}


// ==========================================
// DISPLAY LEAVE REQUESTS
// ==========================================

function displayLeaveRequests() {

    const student = getLoggedInStudent();
    const currentRoll = getStudentRollNumber(student);

    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (e) {
        leaveRequests = [];
    }

    // Filter requests for current student ONLY
    const studentLeaves = leaveRequests.filter(
        req => (req.studentRoll || '').trim().toUpperCase() === currentRoll
    );

    const tableBody = document.getElementById('leaveTableBody');
    const noLeaveMessage = document.getElementById('noLeaveMessage');

    if (!tableBody) return;

    if (studentLeaves.length === 0) {
        tableBody.innerHTML = '';
        if (noLeaveMessage) noLeaveMessage.style.display = 'block';
        return;
    }

    if (noLeaveMessage) noLeaveMessage.style.display = 'none';

    // Sort newest first
    const sortedLeaves = [...studentLeaves].reverse();

    tableBody.innerHTML = sortedLeaves.map(leave => {

        const statusClass = getStatusClass(leave.status);
        const statusIcon = getStatusIcon(leave.status);

        return `
            <tr class="leave-row">
                <td class="date-cell">
                    <strong>${formatDate(leave.fromDate)}</strong>
                </td>
                <td class="date-cell">
                    <strong>${formatDate(leave.toDate)}</strong>
                </td>
                <td class="type-cell">
                    <span class="badge badge-type">
                        ${leave.type}
                    </span>
                </td>
                <td class="reason-cell" title="${leave.reason}">
                    ${leave.reason}
                </td>
                <td class="days-cell">
                    ${leave.days} day${leave.days > 1 ? 's' : ''}
                </td>
                <td class="status-cell">
                    <span class="status-badge ${statusClass}">
                        ${statusIcon} ${leave.status}
                    </span>
                </td>
                <td class="submitted-cell">
                    <small>
                        ${leave.submittedDate || 'Recent'}
                        <br>
                        ${leave.submittedTime || ''}
                    </small>
                </td>
                <td class="action-cell">
                    ${leave.status === 'Pending' ? `
                        <button 
                            class="action-btn delete-btn"
                            onclick="deleteLeaveRequest(${leave.id})"
                            title="Cancel / Delete pending request"
                        >
                            🗑️
                        </button>
                    ` : `
                        <button 
                            class="action-btn view-btn"
                            onclick="viewLeaveDetails(${leave.id})"
                            title="View details"
                        >
                            👁️
                        </button>
                    `}
                </td>
            </tr>
        `;

    }).join('');

}


// ==========================================
// UPDATE LEAVE STATISTICS
// ==========================================

function updateLeaveStatistics() {

    const student = getLoggedInStudent();
    const currentRoll = getStudentRollNumber(student);

    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (e) {
        leaveRequests = [];
    }

    // Filter requests for current student
    const studentLeaves = leaveRequests.filter(
        req => (req.studentRoll || '').trim().toUpperCase() === currentRoll
    );

    // Calculate statistics
    let totalDays = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    studentLeaves.forEach(leave => {
        if (leave.status === 'Approved') {
            totalDays += Number(leave.days) || 0;
            approvedCount++;
        } else if (leave.status === 'Pending') {
            pendingCount++;
        } else if (leave.status === 'Rejected') {
            rejectedCount++;
        }
    });

    // Update UI
    const totalDaysEl = document.getElementById('totalLeaveDays');
    const pendingEl = document.getElementById('pendingRequests');
    const approvedEl = document.getElementById('approvedLeaves');
    const rejectedEl = document.getElementById('rejectedLeaves');

    if (totalDaysEl) totalDaysEl.textContent = `${totalDays} / 30`;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (approvedEl) approvedEl.textContent = approvedCount;
    if (rejectedEl) rejectedEl.textContent = rejectedCount;

}


// ==========================================
// DELETE LEAVE REQUEST
// ==========================================

window.deleteLeaveRequest = function (leaveId) {

    if (!confirm('❓ Are you sure you want to cancel and delete this pending leave request?')) {
        return;
    }

    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (e) {
        leaveRequests = [];
    }

    leaveRequests = leaveRequests.filter(req => req.id !== leaveId);
    localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));

    displayLeaveRequests();
    updateLeaveStatistics();

};


// ==========================================
// VIEW LEAVE DETAILS
// ==========================================

window.viewLeaveDetails = function (leaveId) {

    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (e) {
        leaveRequests = [];
    }

    const leave = leaveRequests.find(req => req.id === leaveId);
    if (!leave) return;

    alert(`📄 LEAVE REQUEST DETAILS\n\nType: ${leave.type}\nFrom: ${formatDate(leave.fromDate)}\nTo: ${formatDate(leave.toDate)}\nDays: ${leave.days}\nReason: ${leave.reason}\nStatus: ${leave.status}\nSubmitted: ${leave.submittedDate} ${leave.submittedTime}\n\n${leave.description ? `Description:\n${leave.description}` : ''}`);

};


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusClass(status) {
    switch (status) {
        case 'Pending':
            return 'status-pending';
        case 'Approved':
            return 'status-approved';
        case 'Rejected':
            return 'status-rejected';
        default:
            return '';
    }
}

function getStatusIcon(status) {
    switch (status) {
        case 'Pending':
            return '⏳';
        case 'Approved':
            return '✅';
        case 'Rejected':
            return '❌';
        default:
            return '📋';
    }
}


// ==========================================
// LOGOUT HANDLER
// ==========================================

function handleLogout() {

    if (confirm('🚪 Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInStudent');
        localStorage.removeItem('loggedInAdmin');
        window.location.href = 'index.html';
    }

}


// ==========================================
// MOBILE MENU TOGGLE
// ==========================================

function toggleMobileMenu() {

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }

}

document.addEventListener('click', function (e) {

    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.getElementById('mobileMenuBtn');

    if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
    }

});
