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

    const savedAdmin = localStorage.getItem('loggedInAdmin');
    const savedStudent = localStorage.getItem('loggedInStudent');

    if (!savedAdmin || savedStudent) {
        window.location.href = 'index.html';
        return;
    }

    initializeLeavePage();

});


// ==========================================
// INITIALIZE LEAVE PAGE
// ==========================================

function initializeLeavePage() {

    setupMenuButton();
    setupLogoutButton();
    setupFilters();
    setupModalClose();
    renderLeaveRequests();

}


// ==========================================
// GET LEAVE REQUESTS
// ==========================================

function getDefaultLeaveRequests() {

    return [
        {
            id: 1718000001,
            studentRoll: "23RU1A0501",
            studentName: "A.D.SATHISH REDDY",
            type: "Medical",
            fromDate: "2026-08-18",
            toDate: "2026-08-20",
            days: 3,
            reason: "Viral Fever and medical recovery",
            description: "Doctor has advised 3 days complete bed rest. Prescription copy attached.",
            status: "Pending",
            submittedDate: "2026-08-15",
            submittedTime: "10:30 AM"
        },
        {
            id: 1718000002,
            studentRoll: "23RU1A0504",
            studentName: "AREKANTI NAVEEN KUMAR",
            type: "Personal",
            fromDate: "2026-08-22",
            toDate: "2026-08-23",
            days: 2,
            reason: "Family function attending",
            description: "Attending cousin's wedding ceremony in hometown.",
            status: "Approved",
            submittedDate: "2026-08-14",
            submittedTime: "02:15 PM"
        },
        {
            id: 1718000003,
            studentRoll: "23RU1A0510",
            studentName: "BANDI BHARGAVI",
            type: "Casual",
            fromDate: "2026-08-25",
            toDate: "2026-08-25",
            days: 1,
            reason: "Competitive exam attendance",
            description: "State level certification examination slot.",
            status: "Pending",
            submittedDate: "2026-08-15",
            submittedTime: "11:45 AM"
        }
    ];

}

function getLeaveRequests() {

    const stored = localStorage.getItem('leaveRequests');
    if (stored) {
        return JSON.parse(stored);
    }

    const defaults = getDefaultLeaveRequests();
    localStorage.setItem('leaveRequests', JSON.stringify(defaults));
    return defaults;

}


// ==========================================
// RENDER LEAVE REQUESTS
// ==========================================

function renderLeaveRequests() {

    const statusFilter = document.getElementById('statusFilter').value;
    const searchStudent = document.getElementById('searchStudent').value.toLowerCase().trim();

    let requests = getLeaveRequests();
    const tbody = document.getElementById('leaveTableBody');
    const noLeavesMsg = document.getElementById('noLeavesMsg');
    const countEl = document.getElementById('requestCount');

    tbody.innerHTML = '';

    const filtered = requests.filter(req => {
        const matchStatus = !statusFilter || req.status === statusFilter;
        const matchSearch = !searchStudent ||
            (req.studentName && req.studentName.toLowerCase().includes(searchStudent)) ||
            (req.studentRoll && req.studentRoll.toLowerCase().includes(searchStudent)) ||
            (req.reason && req.reason.toLowerCase().includes(searchStudent));

        return matchStatus && matchSearch;
    });

    countEl.textContent = `${filtered.length} request${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        noLeavesMsg.style.display = 'block';
        return;
    }

    noLeavesMsg.style.display = 'none';

    filtered.forEach(req => {
        let statusClass = 'status-pending';
        let statusIcon = '⏳';

        if (req.status === 'Approved') {
            statusClass = 'status-approved';
            statusIcon = '✅';
        } else if (req.status === 'Rejected') {
            statusClass = 'status-rejected';
            statusIcon = '❌';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${req.studentRoll || '-'}</strong></td>
            <td>${req.studentName || 'Student'}</td>
            <td><span class="badge">${req.type}</span></td>
            <td>${req.fromDate}</td>
            <td>${req.toDate}</td>
            <td>${req.reason}</td>
            <td><span class="status-badge ${statusClass}">${statusIcon} ${req.status}</span></td>
            <td class="action-cell">
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="openLeaveDetails(${req.id})">Review</button>
                <button class="action-btn delete-btn" onclick="deleteLeave(${req.id})" title="Delete">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });

}


// ==========================================
// FILTERS
// ==========================================

function setupFilters() {

    const statusFilter = document.getElementById('statusFilter');
    const searchStudent = document.getElementById('searchStudent');
    const clearBtn = document.getElementById('clearFiltersBtn');

    statusFilter.addEventListener('change', renderLeaveRequests);
    searchStudent.addEventListener('input', renderLeaveRequests);

    clearBtn.addEventListener('click', () => {
        statusFilter.value = '';
        searchStudent.value = '';
        renderLeaveRequests();
    });

}


// ==========================================
// LEAVE DETAILS MODAL
// ==========================================

function setupModalClose() {

    const modal = document.getElementById('leaveModal');
    const closeBtn = document.getElementById('closeLeaveModal');

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

}

window.openLeaveDetails = function (id) {

    const requests = getLeaveRequests();
    const req = requests.find(r => r.id === id);
    if (!req) return;

    const modal = document.getElementById('leaveModal');
    const modalBody = document.getElementById('leaveModalBody');
    const modalFooter = document.getElementById('leaveModalFooter');

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Student Name</p>
                <strong style="font-size: 15px;">${req.studentName}</strong>
            </div>
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Roll Number</p>
                <strong style="font-size: 15px;">${req.studentRoll}</strong>
            </div>
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Leave Type</p>
                <span class="badge">${req.type}</span>
            </div>
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Duration</p>
                <strong>${req.days} Day(s)</strong> (${req.fromDate} to ${req.toDate})
            </div>
        </div>
        <div style="margin-bottom: 15px;">
            <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Reason</p>
            <p style="background: rgba(102, 126, 234, 0.05); padding: 10px; border-radius: 8px;">${req.reason}</p>
        </div>
        ${req.description ? `
            <div style="margin-bottom: 15px;">
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Detailed Description</p>
                <p style="background: rgba(102, 126, 234, 0.05); padding: 10px; border-radius: 8px; font-size: 13px;">${req.description}</p>
            </div>
        ` : ''}
        <div>
            <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Current Status</p>
            <strong>${req.status}</strong> (Submitted on ${req.submittedDate || 'Recent'} ${req.submittedTime || ''})
        </div>
    `;

    let actionButtons = '';
    if (req.status === 'Pending') {
        actionButtons = `
            <button class="btn btn-success" style="background: #2ecc71; color: white;" onclick="updateLeaveStatus(${req.id}, 'Approved')">
                ✅ Approve Leave
            </button>
            <button class="btn btn-danger" onclick="updateLeaveStatus(${req.id}, 'Rejected')">
                ❌ Reject Leave
            </button>
        `;
    } else if (req.status === 'Approved') {
        actionButtons = `
            <span style="color: #27ae60; font-weight: 600; margin-right: auto; display: flex; align-items: center;">✅ Currently Approved</span>
            <button class="btn btn-danger" onclick="updateLeaveStatus(${req.id}, 'Rejected')">
                Change to Rejected
            </button>
        `;
    } else {
        actionButtons = `
            <span style="color: #c0392b; font-weight: 600; margin-right: auto; display: flex; align-items: center;">❌ Currently Rejected</span>
            <button class="btn btn-success" style="background: #2ecc71; color: white;" onclick="updateLeaveStatus(${req.id}, 'Approved')">
                Change to Approved
            </button>
        `;
    }

    modalFooter.innerHTML = `
        <div style="display: flex; gap: 10px; width: 100%; justify-content: flex-end; align-items: center;">
            ${actionButtons}
            <button class="btn btn-secondary" onclick="document.getElementById('leaveModal').classList.add('hidden')">
                Close
            </button>
        </div>
    `;

    modal.classList.remove('hidden');

};

window.updateLeaveStatus = function (id, newStatus) {

    let requests = getLeaveRequests();
    const reqIndex = requests.findIndex(r => r.id === id);

    if (reqIndex >= 0) {
        requests[reqIndex].status = newStatus;
        localStorage.setItem('leaveRequests', JSON.stringify(requests));

        const modal = document.getElementById('leaveModal');
        modal.classList.add('hidden');
        renderLeaveRequests();
    }

};

window.deleteLeave = function (id) {

    if (!confirm('❓ Are you sure you want to delete this leave request?')) return;

    let requests = getLeaveRequests();
    requests = requests.filter(r => r.id !== id);
    localStorage.setItem('leaveRequests', JSON.stringify(requests));
    renderLeaveRequests();

};


// ==========================================
// MENU BUTTON
// ==========================================

function setupMenuButton() {

    const menuButton = document.getElementById('menuButton');
    const sidebar = document.getElementById('sidebar');

    if (!menuButton || !sidebar) return;

    menuButton.addEventListener('click', function () {
        sidebar.classList.toggle('mobile-open');
    });

    document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !menuButton.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });

}


// ==========================================
// LOGOUT BUTTON
// ==========================================

function setupLogoutButton() {

    const logoutButton = document.getElementById('logoutButton');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', function () {
        if (confirm('🚪 Are you sure you want to logout?')) {
            localStorage.removeItem('loggedInAdmin');
            localStorage.removeItem('loggedInStudent');
            window.location.href = 'index.html';
        }
    });

}
