const Student = {
    init: () => {
        Student.checkAuth();
        Student.setupTabNavigation();
        Student.loadDashboardData();
    },

    checkAuth: () => {
        const user = Storage.getCurrentUser();
        if (!user || user.role !== 'student') {
            window.location.href = 'index.html';
        }
        document.getElementById('student-name').textContent = user.name;
        document.getElementById('welcome-name').textContent = user.name.split(' ')[0];
    },

    setupTabNavigation: () => {
        const tabs = document.querySelectorAll('.sidebar-nav li');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${target}-tab`) {
                        content.classList.add('active');
                    }
                });

                if (target === 'classes') Student.renderEnrolledClasses();
                if (target === 'assignments') Student.renderAssignments();
                if (target === 'grades') Student.renderGrades();
            });
        });
    },

    loadDashboardData: () => {
        // Mock data for demo
        Student.renderSchedule();
        Student.renderRecentGrades();
    },

    renderSchedule: () => {
        const container = document.getElementById('today-schedule');
        const schedule = [
            { time: '09:00 AM', subject: 'Mathematics', room: 'Room 101' },
            { time: '11:00 AM', subject: 'Physics', room: 'Lab 2' },
            { time: '02:00 PM', subject: 'Computer Science', room: 'IT Hall' }
        ];

        container.innerHTML = schedule.map(item => `
            <div class="timeline-item">
                <div class="timeline-content">
                    <h4>${item.time}</h4>
                    <p><strong>${item.subject}</strong> - ${item.room}</p>
                </div>
            </div>
        `).join('');
    },

    renderEnrolledClasses: () => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        const container = document.getElementById('enrolled-classes-list');

        container.innerHTML = classes.map((c, i) => `
            <div class="class-card animate-slide-up" style="animation-delay: ${i * 0.1}s">
                <div class="class-card-icon purple">
                    <i class="fas fa-graduation-cap"></i>
                </div>
                <h3>${c.name}</h3>
                <p class="text-muted">Section: ${c.section}</p>
                <p class="text-muted">Instructor: ${c.teacher || 'N/A'}</p>
                <div class="mt-1">
                    <button class="btn btn-sm btn-primary">View Materials</button>
                </div>
            </div>
        `).join('');
    },

    renderAssignments: () => {
        const assignments = Storage.get(Storage.KEYS.ASSIGNMENTS);
        const container = document.getElementById('student-assignments-list');

        container.innerHTML = assignments.map(a => `
            <div class="student-assignment-row card mb-1 animate-slide-up">
                <div class="assignment-info">
                    <h3>${a.title}</h3>
                    <p class="text-muted">${a.dueDate} • Due</p>
                </div>
                <div class="assignment-status">
                    <span class="assignment-badge badge-blue">Pending</span>
                    <button class="btn btn-sm ml-1"><i class="fas fa-upload"></i> Submit</button>
                </div>
            </div>
        `).join('');
    },

    renderRecentGrades: () => {
        const container = document.getElementById('recent-grades');
        const grades = [
            { subject: 'Math Quiz', score: '95/100', grade: 'A+' },
            { subject: 'Physics Lab', score: '82/100', grade: 'B' }
        ];

        container.innerHTML = grades.map(g => `
            <div class="student-assignment-row">
                <span>${g.subject}</span>
                <strong>${g.score} (${g.grade})</strong>
            </div>
        `).join('');
    },

    renderGrades: () => {
        const container = document.getElementById('student-grades-list');
        // Similar to recent grades but more detailed
        container.innerHTML = `<h3>Full Academic Record</h3><p class="text-muted mt-1">Detailed grades will appear here.</p>`;
    }
};

document.addEventListener('DOMContentLoaded', Student.init);
