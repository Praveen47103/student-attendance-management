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

    // 1. Render immediately from local cache
    renderLeaveRequests();

    // 2. Fetch live requests from Supabase & connect Realtime
    fetchLiveLeaveRequests();
    setupRealtimeLeaveRequests();

}


// ==========================================
// DEFAULT / LOCAL LEAVE DATA
// ==========================================

function getDefaultLeaveRequests() {

    return [
        {
            id: '1718000001',
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
            id: '1718000002',
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
            id: '1718000003',
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
        try {
            return JSON.parse(stored);
        } catch (e) {
            return getDefaultLeaveRequests();
        }
    }

    const defaults = getDefaultLeaveRequests();
    localStorage.setItem('leaveRequests', JSON.stringify(defaults));
    return defaults;

}


// ==========================================
// FETCH LIVE LEAVE REQUESTS FROM SUPABASE
// ==========================================

async function fetchLiveLeaveRequests() {

    if (!window.supabaseClient) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('leave_requests')
            .select(`
                id,
                student_id,
                type,
                from_date,
                to_date,
                days,
                reason,
                description,
                status,
                review_remarks,
                reviewed_at,
                created_at,
                students (
                    id,
                    roll_number,
                    name,
                    department
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Supabase leave_requests query error:', error);
            return;
        }

        if (data && Array.isArray(data)) {
            const mapped = data.map(item => ({
                id: item.id,
                studentRoll: item.students?.roll_number || 'Unknown',
                studentName: item.students?.name || 'Student',
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

            localStorage.setItem('leaveRequests', JSON.stringify(mapped));
            renderLeaveRequests();
        }

    } catch (err) {
        console.error('Error fetching live leave requests:', err);
    }

}


// ==========================================
// REALTIME SUBSCRIPTION FOR ADMIN
// ==========================================

function setupRealtimeLeaveRequests() {

    if (!window.supabaseClient) return;

    try {
        window.supabaseClient
            .channel('realtime:admin_leave')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leave_requests' },
                payload => {
                    console.log('🔄 Realtime leave change detected on admin portal:', payload);
                    fetchLiveLeaveRequests();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('📡 Realtime connected for admin leave management');
                }
            });
    } catch (err) {
        console.warn('Could not setup realtime for admin leave:', err);
    }

}


// ==========================================
// RENDER LEAVE REQUESTS
// ==========================================

function renderLeaveRequests() {

    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const searchStudent = (document.getElementById('searchStudent')?.value || '').toLowerCase().trim();

    const requests = getLeaveRequests();
    const tbody = document.getElementById('leaveTableBody');
    const noLeavesMsg = document.getElementById('noLeavesMsg');
    const countEl = document.getElementById('requestCount');

    if (!tbody) return;

    tbody.innerHTML = '';

    const filtered = requests.filter(req => {
        const matchStatus = !statusFilter || req.status === statusFilter;
        const matchSearch = !searchStudent ||
            (req.studentName && req.studentName.toLowerCase().includes(searchStudent)) ||
            (req.studentRoll && req.studentRoll.toLowerCase().includes(searchStudent)) ||
            (req.reason && req.reason.toLowerCase().includes(searchStudent));

        return matchStatus && matchSearch;
    });

    if (countEl) {
        countEl.textContent = `${filtered.length} request${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
        if (noLeavesMsg) noLeavesMsg.style.display = 'block';
        return;
    }

    if (noLeavesMsg) noLeavesMsg.style.display = 'none';

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

        const safeId = typeof req.id === 'string' ? `'${req.id}'` : req.id;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${escapeHtml(req.studentRoll || '-')}</strong></td>
            <td>${escapeHtml(req.studentName || 'Student')}</td>
            <td><span class="badge">${escapeHtml(req.type || 'Leave')}</span></td>
            <td>${formatDate(req.fromDate)}</td>
            <td>${formatDate(req.toDate)}</td>
            <td title="${escapeHtml(req.reason || '')}">${escapeHtml(req.reason || '-')}</td>
            <td><span class="status-badge ${statusClass}">${statusIcon} ${req.status}</span></td>
            <td class="action-cell">
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="openLeaveDetails(${safeId})">Review</button>
                <button class="action-btn delete-btn" onclick="deleteLeave(${safeId})" title="Delete">🗑</button>
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

    if (statusFilter) statusFilter.addEventListener('change', renderLeaveRequests);
    if (searchStudent) searchStudent.addEventListener('input', renderLeaveRequests);

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (statusFilter) statusFilter.value = '';
            if (searchStudent) searchStudent.value = '';
            renderLeaveRequests();
        });
    }

}


// ==========================================
// LEAVE DETAILS MODAL
// ==========================================

function setupModalClose() {

    const modal = document.getElementById('leaveModal');
    const closeBtn = document.getElementById('closeLeaveModal');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

}

window.openLeaveDetails = function (id) {

    const requests = getLeaveRequests();
    const req = requests.find(r => String(r.id) === String(id));
    if (!req) return;

    const modal = document.getElementById('leaveModal');
    const modalBody = document.getElementById('leaveModalBody');
    const modalFooter = document.getElementById('leaveModalFooter');

    if (!modal || !modalBody || !modalFooter) return;

    const safeId = typeof req.id === 'string' ? `'${req.id}'` : req.id;

    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Student Name</p>
                <strong style="font-size: 15px;">${escapeHtml(req.studentName)}</strong>
            </div>
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Roll Number</p>
                <strong style="font-size: 15px;">${escapeHtml(req.studentRoll)}</strong>
            </div>
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Leave Type</p>
                <span class="badge">${escapeHtml(req.type)}</span>
            </div>
            <div>
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Duration</p>
                <strong>${req.days} Day(s)</strong> (${formatDate(req.fromDate)} to ${formatDate(req.toDate)})
            </div>
        </div>
        <div style="margin-bottom: 15px;">
            <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Reason</p>
            <p style="background: rgba(102, 126, 234, 0.05); padding: 10px; border-radius: 8px;">${escapeHtml(req.reason)}</p>
        </div>
        ${req.description ? `
            <div style="margin-bottom: 15px;">
                <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Detailed Description</p>
                <p style="background: rgba(102, 126, 234, 0.05); padding: 10px; border-radius: 8px; font-size: 13px;">${escapeHtml(req.description)}</p>
            </div>
        ` : ''}
        <div style="margin-bottom: 15px;">
            <p style="color: #888; font-size: 12px; margin-bottom: 2px;">Current Status</p>
            <strong>${req.status}</strong> (Submitted on ${req.submittedDate || 'Recent'} ${req.submittedTime || ''})
        </div>
        <div style="margin-bottom: 15px;">
            <label for="reviewRemarksInput" style="color: #888; font-size: 12px; display: block; margin-bottom: 4px;">Review Remarks (Optional):</label>
            <input type="text" id="reviewRemarksInput" value="${escapeHtml(req.reviewRemarks || '')}" placeholder="e.g. Approved with condition / Medical certificate verified" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;">
        </div>
    `;

    let actionButtons = '';
    if (req.status === 'Pending') {
        actionButtons = `
            <button class="btn btn-success" style="background: #2ecc71; color: white;" onclick="updateLeaveStatus(${safeId}, 'Approved')">
                ✅ Approve Leave
            </button>
            <button class="btn btn-danger" onclick="updateLeaveStatus(${safeId}, 'Rejected')">
                ❌ Reject Leave
            </button>
        `;
    } else if (req.status === 'Approved') {
        actionButtons = `
            <span style="color: #27ae60; font-weight: 600; margin-right: auto; display: flex; align-items: center;">✅ Currently Approved</span>
            <button class="btn btn-danger" onclick="updateLeaveStatus(${safeId}, 'Rejected')">
                Change to Rejected
            </button>
        `;
    } else {
        actionButtons = `
            <span style="color: #c0392b; font-weight: 600; margin-right: auto; display: flex; align-items: center;">❌ Currently Rejected</span>
            <button class="btn btn-success" style="background: #2ecc71; color: white;" onclick="updateLeaveStatus(${safeId}, 'Approved')">
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


// ==========================================
// UPDATE LEAVE STATUS (APPROVE / REJECT)
// ==========================================

window.updateLeaveStatus = async function (id, newStatus) {

    const remarksInput = document.getElementById('reviewRemarksInput');
    const remarks = remarksInput ? remarksInput.value.trim() : '';

    // 1. Update in Supabase
    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from('leave_requests')
                .update({
                    status: newStatus,
                    review_remarks: remarks || null,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.warn('Supabase leave update error:', error);
            } else {
                console.log(`✅ Leave request ${id} updated to ${newStatus} in Supabase`);
            }
        } catch (err) {
            console.error('Error updating leave status in Supabase:', err);
        }
    }

    // 2. Update in localStorage
    let requests = getLeaveRequests();
    const reqIndex = requests.findIndex(r => String(r.id) === String(id));

    if (reqIndex >= 0) {
        requests[reqIndex].status = newStatus;
        if (remarks) {
            requests[reqIndex].reviewRemarks = remarks;
        }
        localStorage.setItem('leaveRequests', JSON.stringify(requests));
    }

    const modal = document.getElementById('leaveModal');
    if (modal) modal.classList.add('hidden');

    renderLeaveRequests();

};


// ==========================================
// DELETE LEAVE REQUEST
// ==========================================

window.deleteLeave = async function (id) {

    if (!confirm('❓ Are you sure you want to delete this leave request?')) return;

    // 1. Delete from Supabase
    if (window.supabaseClient) {
        try {
            const { error } = await window.supabaseClient
                .from('leave_requests')
                .delete()
                .eq('id', id);

            if (error) {
                console.warn('Supabase leave delete error:', error);
            } else {
                console.log(`✅ Leave request ${id} deleted from Supabase`);
            }
        } catch (err) {
            console.error('Error deleting leave request in Supabase:', err);
        }
    }

    // 2. Delete from localStorage
    let requests = getLeaveRequests();
    requests = requests.filter(r => String(r.id) !== String(id));
    localStorage.setItem('leaveRequests', JSON.stringify(requests));

    renderLeaveRequests();

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
            if (window.supabaseClient?.auth) {
                window.supabaseClient.auth.signOut().catch(() => {});
            }
            window.location.href = 'index.html';
        }
    });

}
