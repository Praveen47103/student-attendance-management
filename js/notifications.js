// ==============================================================================
// IN-APP NOTIFICATIONS COMPONENT (PHASE 6)
// ==============================================================================
// Connects to Supabase public.notifications table with Realtime push updates,
// unread badges, mark-as-read, and dual-mode localStorage fallback.
// ==============================================================================

(function () {
    let notifications = [];
    let currentStudentId = null;
    let isAdmin = false;
    let realtimeChannel = null;

    // Helper: Determine current user role
    function detectUserRole() {
        try {
            const admin = localStorage.getItem('loggedInAdmin');
            const student = localStorage.getItem('loggedInStudent');
            if (admin && !student) {
                isAdmin = true;
                return 'admin';
            }
            if (student) {
                isAdmin = false;
                return 'student';
            }
        } catch (e) {}
        // Fallback check URL path
        if (window.location.pathname.includes('admin-')) {
            isAdmin = true;
            return 'admin';
        }
        return 'student';
    }

    // Helper: Get student roll number
    function getStudentRoll() {
        try {
            const student = JSON.parse(localStorage.getItem('loggedInStudent') || '{}');
            return (student.rollNo || student.roll || '').trim().toUpperCase();
        } catch (e) {
            return '';
        }
    }

    // Initialize once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        detectUserRole();
        mountNotificationUI();
        loadCachedNotifications();
        fetchLiveNotifications();
        setupRealtimeSubscription();
    });

    // 1. MOUNT NOTIFICATION BELL & DROPDOWN INTO TOPBAR
    function mountNotificationUI() {
        if (document.getElementById('notificationWrapper')) return;

        // Find insertion anchor: .topbar-user or .user-info or .topbar or .top-bar
        const targetContainer = document.querySelector('.topbar-user') || 
                                document.querySelector('.user-info') ||
                                document.querySelector('.topbar') ||
                                document.querySelector('.top-bar');

        if (!targetContainer) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'notification-wrapper';
        wrapper.id = 'notificationWrapper';

        wrapper.innerHTML = `
            <button id="notificationBellBtn" class="notification-bell-btn" title="Notifications" aria-label="Notifications">
                🔔
                <span id="notificationBadge" class="notification-badge hidden">0</span>
            </button>
            <div id="notificationDropdown" class="notification-dropdown hidden">
                <div class="notification-header">
                    <div class="notification-title-wrap">
                        <h4>🔔 Notifications</h4>
                        <span id="unreadCountBadge" class="unread-count-badge">0 unread</span>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        ${isAdmin ? '<button id="dropdownComposeBtn" class="mark-all-read-btn" style="background: #667eea; color: #ffffff; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer;" title="Compose Announcement">📢 Compose</button>' : ''}
                        <button id="markAllReadBtn" class="mark-all-read-btn" title="Mark all as read">
                            ✓ Mark all
                        </button>
                    </div>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-empty">
                        <div class="notification-empty-icon">🔕</div>
                        <p>No notifications yet</p>
                    </div>
                </div>
                <div class="notification-footer">
                    <small>Student Attendance System • Real-Time Alerts</small>
                </div>
            </div>
        `;

        // Insert before user avatar or details if in .topbar-user, else prepend
        if (targetContainer.firstChild) {
            targetContainer.insertBefore(wrapper, targetContainer.firstChild);
        } else {
            targetContainer.appendChild(wrapper);
        }

        // Attach event listeners
        const bellBtn = document.getElementById('notificationBellBtn');
        const dropdown = document.getElementById('notificationDropdown');
        const markAllBtn = document.getElementById('markAllReadBtn');
        const dropdownCompose = document.getElementById('dropdownComposeBtn');

        if (bellBtn && dropdown) {
            bellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        }

        if (dropdownCompose) {
            dropdownCompose.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.add('hidden');
                const modal = document.getElementById('announcementModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    if (typeof loadAudienceDropdownData === 'function') loadAudienceDropdownData();
                } else {
                    window.location.href = 'admin-dashboard.html#compose';
                }
            });
        }

        if (markAllBtn) {
            markAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                markAllNotificationsAsRead();
            });
        }
    }

    // 2. CACHED NOTIFICATIONS (DUAL-MODE OFFLINE FALLBACK)
    function loadCachedNotifications() {
        try {
            const cached = localStorage.getItem('userNotifications');
            if (cached) {
                notifications = JSON.parse(cached);
                renderNotificationsUI();
            }
        } catch (e) {
            notifications = [];
        }
    }

    function saveCachedNotifications() {
        try {
            localStorage.setItem('userNotifications', JSON.stringify(notifications));
        } catch (e) {}
    }

    // 3. FETCH LIVE NOTIFICATIONS FROM SUPABASE
    async function fetchLiveNotifications() {
        if (!window.supabaseClient) return;

        try {
            let query = window.supabaseClient
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(25);

            if (isAdmin) {
                // Admin sees admin notifications and general announcements
                query = query.or('target_role.eq.admin,target_role.eq.all');
            } else {
                // Student sees their specific notifications, class notifications, and general announcements
                const rollNo = getStudentRoll();
                let currentStudentClass = '';

                if (rollNo) {
                    if (!currentStudentId) {
                        const { data: s } = await window.supabaseClient
                            .from('students')
                            .select('id, department, section')
                            .eq('roll_number', rollNo)
                            .maybeSingle();
                        if (s?.id) {
                            currentStudentId = s.id;
                            if (s.department && s.section) {
                                currentStudentClass = `${s.department}-${s.section}`;
                            }
                        }
                    }

                    const orConditions = ['target_role.eq.all', 'target_role.eq.student'];
                    if (currentStudentId) {
                        orConditions.push(`student_id.eq.${currentStudentId}`);
                    }
                    if (currentStudentClass) {
                        orConditions.push(`target_class.eq.${currentStudentClass}`);
                    }
                    query = query.or(orConditions.join(','));
                } else {
                    query = query.or('target_role.eq.all,target_role.eq.student');
                }
            }

            const { data, error } = await query;

            if (error) {
                console.warn('Supabase notifications fetch error:', error);
                return;
            }

            if (data && Array.isArray(data)) {
                notifications = data;
                saveCachedNotifications();
                renderNotificationsUI();
            }

        } catch (err) {
            console.warn('Error fetching live notifications:', err);
        }
    }

    // 4. REALTIME NOTIFICATIONS SUBSCRIPTION
    function setupRealtimeSubscription() {
        if (!window.supabaseClient) return;

        try {
            if (realtimeChannel) {
                window.supabaseClient.removeChannel(realtimeChannel);
            }

            realtimeChannel = window.supabaseClient
                .channel('realtime:in_app_notifications')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'notifications' },
                    payload => {
                        console.log('🔔 Realtime notification event:', payload);
                        fetchLiveNotifications();
                    }
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'announcements' },
                    payload => {
                        console.log('📢 Realtime announcement event:', payload);
                        fetchLiveNotifications();
                    }
                )
                .subscribe();

        } catch (err) {
            console.warn('Realtime notifications subscription warning:', err);
        }
    }

    // 5. RENDER NOTIFICATIONS UI
    function renderNotificationsUI() {
        const listEl = document.getElementById('notificationList');
        const badgeEl = document.getElementById('notificationBadge');
        const unreadCountEl = document.getElementById('unreadCountBadge');

        if (!listEl) return;

        const unreadCount = notifications.filter(n => !n.is_read).length;

        // Update badge
        if (badgeEl) {
            if (unreadCount > 0) {
                badgeEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badgeEl.classList.remove('hidden');
            } else {
                badgeEl.classList.add('hidden');
            }
        }

        if (unreadCountEl) {
            unreadCountEl.textContent = `${unreadCount} unread`;
        }

        // Empty state
        if (notifications.length === 0) {
            listEl.innerHTML = `
                <div class="notification-empty">
                    <div class="notification-empty-icon">🔕</div>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        // Render items
        listEl.innerHTML = notifications.map(item => {
            const icon = getNotificationIcon(item.type);
            const timeAgo = formatTimeAgo(item.created_at);
            const isUnread = !item.is_read;
            const safeId = typeof item.id === 'string' ? `'${item.id}'` : item.id;

            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="window.markNotificationRead(${safeId})">
                    <div class="notification-icon">${icon}</div>
                    <div class="notification-content">
                        <h5 class="notification-title">${escapeHtml(item.title)}</h5>
                        <p class="notification-message">${escapeHtml(item.message)}</p>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                    ${isUnread ? '<div class="notification-unread-dot" title="Unread"></div>' : ''}
                </div>
            `;
        }).join('');
    }

    // 6. MARK AS READ ACTIONS
    window.markNotificationRead = async function (id) {
        const item = notifications.find(n => String(n.id) === String(id));
        if (!item || item.is_read) return;

        // Optimistically update local state
        item.is_read = true;
        saveCachedNotifications();
        renderNotificationsUI();

        // Update in Supabase
        if (window.supabaseClient) {
            try {
                await window.supabaseClient
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', id);
            } catch (err) {
                console.warn('Error marking notification read in Supabase:', err);
            }
        }
    };

    async function markAllNotificationsAsRead() {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistically update local state
        notifications.forEach(n => n.is_read = true);
        saveCachedNotifications();
        renderNotificationsUI();

        // Update in Supabase
        if (window.supabaseClient) {
            try {
                await window.supabaseClient
                    .from('notifications')
                    .update({ is_read: true })
                    .in('id', unreadIds);
            } catch (err) {
                console.warn('Error marking all notifications read in Supabase:', err);
            }
        }
    }

    // Helper functions
    function getNotificationIcon(type) {
        switch (type) {
            case 'leave':
                return '📝';
            case 'attendance':
                return '📋';
            case 'warning':
                return '⚠️';
            case 'announcement':
                return '📢';
            default:
                return '🔔';
        }
    }

    function formatTimeAgo(dateStr) {
        if (!dateStr) return 'Recent';
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

})();
