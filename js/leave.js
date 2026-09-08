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

let currentStudentUuid = null;

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

    // 1. Render immediately from local cache
    displayLeaveRequests();
    updateLeaveStatistics();

    // 2. Load live requests from Supabase & subscribe to Realtime
    loadLiveLeaveRequests();
    setupRealtimeLeave();

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
// RESOLVE STUDENT DATABASE UUID
// ==========================================

async function getStudentUuid(rollNo) {
    if (currentStudentUuid) return currentStudentUuid;
    if (!window.supabaseClient || !rollNo) return null;

    try {
        const { data, error } = await window.supabaseClient
            .from('students')
            .select('id')
            .eq('roll_number', rollNo)
            .maybeSingle();

        if (data && data.id) {
            currentStudentUuid = data.id;
            return currentStudentUuid;
        }
    } catch (err) {
        console.warn('Could not fetch student UUID from Supabase:', err);
    }
    return null;
}


// ==========================================
// LOAD LIVE LEAVE REQUESTS FROM SUPABASE
// ==========================================

async function loadLiveLeaveRequests() {

    if (!window.supabaseClient) return;

    const student = getLoggedInStudent();
    const currentRoll = getStudentRollNumber(student);
    if (!currentRoll) return;

    try {
        const studentId = await getStudentUuid(currentRoll);
        if (!studentId) return;

        const { data, error } = await window.supabaseClient
            .from('leave_requests')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Supabase leave_requests query error:', error);
            return;
        }

        if (data && Array.isArray(data)) {
            const mapped = data.map(item => ({
                id: item.id,
                studentRoll: currentRoll,
                studentName: student.name || 'Student',
                type: item.type,
                fromDate: item.from_date,
                toDate: item.to_date,
                days: item.days,
                reason: item.reason,
                description: item.description || '',
                status: item.status,
                reviewRemarks: item.review_remarks || '',
                reviewedAt: item.reviewed_at || '',
                submittedDate: item.created_at ? item.created_at.split('T')[0] : '',
                submittedTime: item.created_at ? new Date(item.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : ''
            }));

            // Sync with local storage
            let allStored = [];
            try {
                allStored = JSON.parse(localStorage.getItem('leaveRequests')) || [];
            } catch (e) {
                allStored = [];
            }
            const otherStudentsLeaves = allStored.filter(r => (r.studentRoll || '').toUpperCase() !== currentRoll);
            const merged = [...mapped, ...otherStudentsLeaves];
            localStorage.setItem('leaveRequests', JSON.stringify(merged));

            // Render live data
            renderLeaveTable(mapped);
            updateLeaveStatsFromList(mapped);
        }

    } catch (err) {
        console.error('Error loading live leave requests:', err);
    }

}


// ==========================================
// REALTIME LEAVE SUBSCRIPTION
// ==========================================

function setupRealtimeLeave() {

    if (!window.supabaseClient) return;

    try {
        window.supabaseClient
            .channel('realtime:student_leave')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leave_requests' },
                payload => {
                    console.log('🔄 Realtime leave change detected:', payload);
                    loadLiveLeaveRequests();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('📡 Realtime connected for student leave requests');
                }
            });
    } catch (err) {
        console.warn('Could not initialize Realtime for leave requests:', err);
    }

}


// ==========================================
// HANDLE LEAVE SUBMISSION
// ==========================================

async function handleLeaveSubmit(e) {

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

    // Get all existing leave requests to check overlap
    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (err) {
        leaveRequests = [];
    }

    // Filter ONLY active (Pending or Approved) requests belonging to THIS student
    const studentActiveLeaves = leaveRequests.filter(req => {
        const reqRoll = (req.studentRoll || '').trim().toUpperCase();
        const isActive = req.status === 'Pending' || req.status === 'Approved';
        return reqRoll === currentRoll && isActive;
    });

    // Check for date overlap
    const overlappingRequest = studentActiveLeaves.find(req => {
        if (!req.fromDate || !req.toDate) return false;
        const reqFrom = new Date(req.fromDate + 'T00:00:00');
        const reqTo = new Date(req.toDate + 'T00:00:00');

        if (isNaN(reqFrom.getTime()) || isNaN(reqTo.getTime())) return false;
        return (fromDate <= reqTo && toDate >= reqFrom);
    });

    if (overlappingRequest) {
        messageEl.textContent = `❌ You already have an active ${overlappingRequest.status} leave for these dates (${overlappingRequest.fromDate} to ${overlappingRequest.toDate}).`;
        messageEl.className = 'form-message error';
        return;
    }

    // Prepare new leave object
    const now = new Date();
    let newLeaveId = Date.now().toString();

    // 1. SAVE TO SUPABASE
    if (window.supabaseClient) {
        try {
            messageEl.textContent = '⏳ Submitting leave request to Supabase...';
            messageEl.className = 'form-message';

            const studentId = await getStudentUuid(currentRoll);

            if (studentId) {
                const { data: inserted, error } = await window.supabaseClient
                    .from('leave_requests')
                    .insert([{
                        student_id: studentId,
                        type: leaveType,
                        from_date: leaveFrom,
                        to_date: leaveTo,
                        days: days,
                        reason: leaveReason,
                        description: leaveDescription,
                        status: 'Pending'
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase leave insert error:', error);
                    messageEl.textContent = `⚠️ Database Notice: ${error.message}. Saved to local cache.`;
                    messageEl.className = 'form-message error';
                } else if (inserted && inserted.id) {
                    newLeaveId = inserted.id;
                    console.log('✅ Leave saved to Supabase with ID:', newLeaveId);
                }
            }
        } catch (err) {
            console.error('Error saving leave to Supabase:', err);
        }
    }

    // 2. SAVE TO LOCAL STORAGE (DUAL-MODE CACHE)
    const newLeave = {
        id: newLeaveId,
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
// DISPLAY LEAVE REQUESTS (FROM STORAGE)
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

    renderLeaveTable(studentLeaves);

}


// ==========================================
// RENDER LEAVE TABLE
// ==========================================

function renderLeaveTable(studentLeaves) {

    const tableBody = document.getElementById('leaveTableBody');
    const noLeaveMessage = document.getElementById('noLeaveMessage');

    if (!tableBody) return;

    if (!studentLeaves || studentLeaves.length === 0) {
        tableBody.innerHTML = '';
        if (noLeaveMessage) noLeaveMessage.style.display = 'block';
        return;
    }

    if (noLeaveMessage) noLeaveMessage.style.display = 'none';

    // Sort newest first
    const sortedLeaves = [...studentLeaves].sort((a, b) => {
        const da = new Date(a.submittedDate || a.fromDate || 0);
        const db = new Date(b.submittedDate || b.fromDate || 0);
        return db - da;
    });

    tableBody.innerHTML = sortedLeaves.map(leave => {

        const statusClass = getStatusClass(leave.status);
        const statusIcon = getStatusIcon(leave.status);
        const safeId = typeof leave.id === 'string' ? `'${leave.id}'` : leave.id;

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
                <td class="reason-cell" title="${escapeHtml(leave.reason)}">
                    ${escapeHtml(leave.reason)}
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
                            onclick="deleteLeaveRequest(${safeId})"
                            title="Cancel / Delete pending request"
                        >
                            🗑️
                        </button>
                    ` : `
                        <button 
                            class="action-btn view-btn"
                            onclick="viewLeaveDetails(${safeId})"
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

    const studentLeaves = leaveRequests.filter(
        req => (req.studentRoll || '').trim().toUpperCase() === currentRoll
    );

    updateLeaveStatsFromList(studentLeaves);

}

function updateLeaveStatsFromList(studentLeaves) {

    let totalDays = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    (studentLeaves || []).forEach(leave => {
        if (leave.status === 'Approved') {
            totalDays += Number(leave.days) || 0;
            approvedCount++;
        } else if (leave.status === 'Pending') {
            pendingCount++;
        } else if (leave.status === 'Rejected') {
            rejectedCount++;
        }
    });

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

window.deleteLeaveRequest = async function (leaveId) {

    if (!confirm('❓ Are you sure you want to cancel and delete this pending leave request?')) {
        return;
    }

    // 1. Delete from Supabase
    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from('leave_requests')
                .delete()
                .eq('id', leaveId);

            if (error) {
                console.warn('Supabase delete error:', error);
            } else {
                console.log('✅ Leave request deleted from Supabase:', leaveId);
            }
        } catch (err) {
            console.error('Error deleting from Supabase:', err);
        }
    }

    // 2. Delete from localStorage
    let leaveRequests = [];
    try {
        leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
    } catch (e) {
        leaveRequests = [];
    }

    leaveRequests = leaveRequests.filter(req => String(req.id) !== String(leaveId));
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

    const leave = leaveRequests.find(req => String(req.id) === String(leaveId));
    if (!leave) return;

    let reviewText = '';
    if (leave.reviewRemarks) {
        reviewText = `\nReview Remarks: ${leave.reviewRemarks}`;
    }

    alert(`📄 LEAVE REQUEST DETAILS\n\nType: ${leave.type}\nFrom: ${formatDate(leave.fromDate)}\nTo: ${formatDate(leave.toDate)}\nDays: ${leave.days}\nReason: ${leave.reason}\nStatus: ${leave.status}${reviewText}\nSubmitted: ${leave.submittedDate} ${leave.submittedTime}\n\n${leave.description ? `Description:\n${leave.description}` : ''}`);

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

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ==========================================
// LOGOUT HANDLER
// ==========================================

function handleLogout() {

    if (confirm('🚪 Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInStudent');
        localStorage.removeItem('loggedInAdmin');
        if (window.supabaseClient?.auth) {
            window.supabaseClient.auth.signOut().catch(() => {});
        }
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
