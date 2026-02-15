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

        // Mock additional data for demo (Progress, Materials, etc.)
        const courseDetails = {
            'Mathematics': { progress: 75, nextClass: 'Tomorrow, 09:00 AM', instructor: 'Mr. Wilson' },
            'Science': { progress: 45, nextClass: 'Tuesday, 10:00 AM', instructor: 'Ms. Davis' },
            'English': { progress: 90, nextClass: 'Wednesday, 08:30 AM', instructor: 'Mrs. Thompson' },
            'History': { progress: 60, nextClass: 'Thursday, 11:30 AM', instructor: 'Mr. Roberts' }
        };

        container.innerHTML = classes.map((c, i) => {
            const detail = courseDetails[c.name] || { progress: 0, nextClass: 'N/A', instructor: c.teacher || 'N/A' };
            return `
                <div class="class-card animate-slide-up" style="animation-delay: ${i * 0.1}s">
                    <div class="class-card-icon purple">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3>${c.name}</h3>
                    <p class="text-muted">Section: ${c.section}</p>
                    
                    <div class="progress-container">
                        <div class="progress-header">
                            <span>Course Progress</span>
                            <span>${detail.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${detail.progress}%"></div>
                        </div>
                    </div>

                    <div class="next-class-badge">
                        <i class="fas fa-clock"></i>
                        Next: ${detail.nextClass}
                    </div>

                    <div class="mt-1">
                        <button class="btn btn-sm btn-primary btn-block" onclick="Student.viewCourseDetails('${c.id}')">
                            <i class="fas fa-external-link-alt mr-1"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    viewCourseDetails: (classId) => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        const course = classes.find(c => c.id === classId);
        if (!course) return;

        const container = document.getElementById('modal-container');

        // Mock data for modal
        const mockMaterials = [
            { name: 'Lecture Notes - Week 1-4', type: 'notes', icon: 'fa-file-alt' },
            { name: 'Intro Video Workshop', type: 'video', icon: 'fa-play-circle' },
            { name: 'Mid-term Revision.pdf', type: 'pdf', icon: 'fa-file-pdf' }
        ];

        container.innerHTML = `
            <div class="modal modal-dark animate-slide-up" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>${course.name} - Details</h2>
                    <button class="btn-close" onclick="Student.closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="section-title">
                        <i class="fas fa-chalkboard-teacher mr-1"></i> Instructor Detail
                    </div>
                    <div class="instructor-profile">
                        <img src="https://ui-avatars.com/api/?name=${course.teacher || 'Instructor'}&background=6366f1&color=fff" class="instructor-avatar">
                        <div class="instructor-info">
                            <h4>${course.teacher || 'N/A'}</h4>
                            <p>Senior Faculty Member • Professional Educator</p>
                            <div class="mt-1">
                                <button class="btn btn-sm btn-secondary"><i class="fas fa-envelope mr-1"></i> Contact</button>
                            </div>
                        </div>
                    </div>

                    <div class="section-title mt-2">
                        <i class="fas fa-folder-open mr-1"></i> Course Materials
                    </div>
                    <div class="material-hub">
                        ${mockMaterials.map(m => `
                            <div class="material-item ${m.type}">
                                <i class="fas ${m.icon}"></i>
                                <span>${m.name}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="section-title mt-2">
                        <i class="fas fa-calendar-alt mr-1"></i> Upcoming Classes
                    </div>
                    <div class="card mt-1 p-1">
                        <div class="timeline-item pb-1">
                            <p><strong>Tuesday, Feb 17</strong> • 10:00 AM - 11:30 AM</p>
                        </div>
                        <div class="timeline-item">
                            <p><strong>Thursday, Feb 19</strong> • 01:00 PM - 02:30 PM</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.style.display = 'flex';
    },

    closeModal: () => {
        document.getElementById('modal-container').style.display = 'none';
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
