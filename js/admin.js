const Admin = {
    init: () => {
        Admin.checkAuth();
        Admin.setupTabNavigation();
        Admin.loadStats();
        Admin.populateStudentFilters();
        Admin.renderStudents();
        Admin.setupSearch();
    },

    checkAuth: () => {
        const user = Storage.getCurrentUser();
        if (!user || user.role !== 'admin') {
            window.location.href = 'index.html';
        }
        document.getElementById('admin-name').textContent = user.name;
    },

    setupTabNavigation: () => {
        const tabs = document.querySelectorAll('.sidebar-nav li');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-tab');

                // Update active tab UI
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show target content
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${target}-tab`) {
                        content.classList.add('active');
                    }
                });

                // Load data based on tab
                if (target === 'students') Admin.renderStudents();
                if (target === 'teachers') Admin.renderTeachers();
                if (target === 'classes') Admin.renderClasses();
                if (target === 'subjects') Admin.renderSubjects();
                if (target === 'schedule') Admin.renderSchedule();
                if (target === 'overview') Admin.loadStats();
            });
        });
    },

    loadStats: () => {
        document.getElementById('stat-students').textContent = Storage.get(Storage.KEYS.STUDENTS).length;
        document.getElementById('stat-teachers').textContent = Storage.get(Storage.KEYS.TEACHERS).length;
        document.getElementById('stat-classes').textContent = Storage.get(Storage.KEYS.CLASSES).length;
        document.getElementById('stat-subjects').textContent = Storage.get(Storage.KEYS.SUBJECTS).length;
    },

    populateStudentFilters: () => {
        const students = Storage.get(Storage.KEYS.STUDENTS);
        const classFilterSelect = document.getElementById('filter-class');
        if (!classFilterSelect) return;

        const uniqueClasses = [...new Set(students.map(s => s.class))];
        classFilterSelect.innerHTML = '<option value="">All Classes</option>' +
            uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('');

        // Add event listeners for filters
        document.getElementById('filter-fee')?.addEventListener('change', () => Admin.renderStudents());
        document.getElementById('filter-class')?.addEventListener('change', () => Admin.renderStudents());
    },

    // Students CRUD
    renderStudents: (filter = '') => {
        const students = Storage.get(Storage.KEYS.STUDENTS);
        const feeFilter = document.getElementById('filter-fee')?.value || '';
        const classFilter = document.getElementById('filter-class')?.value || '';
        const tbody = document.querySelector('#students-table tbody');
        if (!tbody) return;

        const filtered = students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(filter.toLowerCase()) ||
                s.email.toLowerCase().includes(filter.toLowerCase());
            const matchesFee = !feeFilter || s.feeStatus === feeFilter;
            const matchesClass = !classFilter || s.class === classFilter;
            return matchesSearch && matchesFee && matchesClass;
        });

        tbody.innerHTML = filtered.map(s => `
            <tr>
                <td>
                    <div class="user-info">
                        <strong>${s.name}</strong>
                        <span>${s.email}</span>
                    </div>
                </td>
                <td>${s.class}</td>
                <td>${s.roll}</td>
                <td><span class="badge badge-info">${s.attendance || '0%'}</span></td>
                <td><span class="badge badge-purple">${s.performance || 'N/A'}</span></td>
                <td><span class="badge ${s.feeStatus === 'Paid' ? 'badge-success' : 'badge-danger'}">${s.feeStatus || 'Pending'}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" title="Edit Student" onclick="Admin.editStudent('${s.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-blue" title="View Report" onclick="Admin.viewStudentReport('${s.id}')">
                        <i class="fas fa-chart-bar"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Student" onclick="Admin.deleteStudent('${s.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // Teachers CRUD
    renderTeachers: (filter = '') => {
        const teachers = Storage.get(Storage.KEYS.TEACHERS);
        const tbody = document.querySelector('#teachers-table tbody');
        if (!tbody) return;

        const filtered = teachers.filter(t =>
            t.name.toLowerCase().includes(filter.toLowerCase()) ||
            t.email.toLowerCase().includes(filter.toLowerCase())
        );

        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${t.email}</td>
                <td><span class="badge badge-info">${t.subject || 'N/A'}</span></td>
                <td><span class="badge badge-purple">${t.performance || 'N/A'}%</span></td>
                <td><span class="badge badge-success">$${t.salary || '0'}</span></td>
                <td class="actions">
                    <button class="btn-icon btn-edit" title="Edit Teacher" onclick="Admin.editTeacher('${t.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Teacher" onclick="Admin.deleteTeacher('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    deleteTeacher: (id) => Admin.showDeleteConfirmation(id, 'Teacher', () => {
        Admin.deleteEntity(Storage.KEYS.TEACHERS, id, 'Teacher');
    }),

    // Classes CRUD
    renderClasses: (filter = '') => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        const tbody = document.querySelector('#classes-table tbody');
        if (!tbody) return;

        tbody.innerHTML = classes.map(c => `
            <tr>
                <td>${c.name}</td>
                <td><span class="badge badge-info">${c.section}</span></td>
                <td><span class="badge badge-purple">${c.teacher || 'Unassigned'}</span></td>
                <td>${c.duration || 'N/A'}</td>
                <td>${c.schedule || 'N/A'}</td>
                <td>
                    ${c.materials ? `<a href="${c.materials}" target="_blank" class="btn-icon btn-blue" title="View Materials"><i class="fas fa-file-alt"></i></a>` : 'No Materials'}
                </td>
                <td class="actions">
                    <button class="btn-icon btn-edit" title="Edit Course" onclick="Admin.editClass('${c.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Course" onclick="Admin.deleteClass('${c.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // Subjects CRUD
    renderSubjects: (filter = '') => {
        const subjects = Storage.get(Storage.KEYS.SUBJECTS);
        const tbody = document.querySelector('#subjects-table tbody');
        if (!tbody) return;

        tbody.innerHTML = subjects.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.code}</td>
                <td>${s.teacher || 'Unassigned'}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" title="Edit Subject" onclick="Admin.editSubject('${s.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Delete Subject" onclick="Admin.deleteSubject('${s.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // Consolidated Schedule CRUD
    renderSchedule: () => {
        const view = document.getElementById('schedule-view-selector').value;
        const head = document.getElementById('schedule-table-head');
        const body = document.getElementById('schedule-table-body');

        if (view === 'timetable') {
            const data = Storage.get(Storage.KEYS.TIMETABLES);
            head.innerHTML = `<tr><th>Class</th><th>Subject</th><th>Day</th><th>Time</th><th>Teacher</th><th>Actions</th></tr>`;
            body.innerHTML = data.map(t => `
                <tr>
                    <td>${t.class}</td>
                    <td>${t.subject}</td>
                    <td>${t.day}</td>
                    <td>${t.time}</td>
                    <td>${t.teacher}</td>
                    <td class="actions">
                        <button class="btn-icon btn-edit" title="Edit" onclick="Admin.editTimetable('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" title="Delete" onclick="Admin.deleteTimetable('${t.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else if (view === 'exams') {
            const data = Storage.get(Storage.KEYS.EXAMS);
            head.innerHTML = `<tr><th>Title</th><th>Class</th><th>Date</th><th>Actions</th></tr>`;
            body.innerHTML = data.map(e => `
                <tr>
                    <td>${e.title}</td>
                    <td>${e.class}</td>
                    <td>${e.dueDate || 'N/A'}</td>
                    <td class="actions">
                        <button class="btn-icon btn-edit" title="Edit" onclick="Admin.editTask('${e.id}', 'Exam')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" title="Delete" onclick="Admin.deleteTask('${e.id}', 'Exam')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        } else if (view === 'events') {
            const data = Storage.get(Storage.KEYS.EVENTS);
            head.innerHTML = `<tr><th>Event Name</th><th>Date</th><th>Venue</th><th>Actions</th></tr>`;
            body.innerHTML = data.map(e => `
                <tr>
                    <td><strong>${e.name}</strong></td>
                    <td>${e.date}</td>
                    <td>${e.venue}</td>
                    <td class="actions">
                        <button class="btn-icon btn-edit" title="Edit" onclick="Admin.editEvent('${e.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" title="Delete" onclick="Admin.deleteEvent('${e.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }

        Admin.renderScheduleChart();
    },

    renderScheduleChart: () => {
        const ctx = document.getElementById('scheduleChart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (Admin.scheduleChartInstance) Admin.scheduleChartInstance.destroy();

        const timetables = Storage.get(Storage.KEYS.TIMETABLES).length;
        const exams = Storage.get(Storage.KEYS.EXAMS).length;
        const events = Storage.get(Storage.KEYS.EVENTS).length;

        Admin.scheduleChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Class Timetable', 'Exams', 'Events'],
                datasets: [{
                    label: 'Count of Entries',
                    data: [timetables, exams, events],
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.6)', // Purple
                        'rgba(236, 72, 153, 0.6)', // Pink
                        'rgba(59, 130, 246, 0.6)'  // Blue
                    ],
                    borderColor: [
                        'rgb(99, 102, 241)',
                        'rgb(236, 72, 153)',
                        'rgb(59, 130, 246)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },

    handleNewScheduleEntry: () => {
        const view = document.getElementById('schedule-view-selector').value;
        if (view === 'timetable') Admin.openModal('timetable');
        else if (view === 'exams') Admin.openModal('task', { type: 'Exam' });
        else if (view === 'events') Admin.openModal('event');
    },

    openModal: (type, data = null) => {
        const container = document.getElementById('modal-container');
        let modalHtml = '';

        if (type === 'student') {
            modalHtml = Admin.getStudentModalHtml(data);
        } else if (type === 'teacher') {
            modalHtml = Admin.getTeacherModalHtml(data);
        } else if (type === 'class') {
            modalHtml = Admin.getClassModalHtml(data);
        } else if (type === 'subject') {
            modalHtml = Admin.getSubjectModalHtml(data);
        } else if (type === 'task') {
            modalHtml = Admin.getTaskModalHtml(data);
        } else if (type === 'timetable') {
            modalHtml = Admin.getTimetableModalHtml(data);
        } else if (type === 'event') {
            modalHtml = Admin.getEventModalHtml(data);
        }

        container.innerHTML = modalHtml;
        container.style.display = 'flex';

        const form = container.querySelector('form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            Admin.saveEntity(type);
        });
    },

    getStudentModalHtml: (data) => `
        <div class="modal modal-dark animate-slide-up">
            <div class="modal-header">
                <h2>${data ? 'Edit' : 'Add'} Student</h2>
                <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
            </div>
            <form id="studentForm" class="auth-form">
                <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                <div class="form-group mb-1">
                    <label><i class="fas fa-user mr-1"></i> Full Name</label>
                    <input type="text" id="name" value="${data ? data.name : ''}" placeholder="Enter full name" required>
                </div>
                <div class="form-group mb-1">
                    <label><i class="fas fa-envelope mr-1"></i> Email Address</label>
                    <input type="email" id="email" value="${data ? data.email : ''}" placeholder="example@cms.com" required>
                </div>
                <div class="grid-2 mb-1">
                    <div class="form-group">
                        <label><i class="fas fa-school mr-1"></i> Class</label>
                        <input type="text" id="class" value="${data ? data.class : ''}" placeholder="e.g. 10th-A" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-hashtag mr-1"></i> Roll Number</label>
                        <input type="text" id="roll" value="${data ? data.roll : ''}" placeholder="e.g. 101" required>
                    </div>
                </div>
                <div class="form-group mb-2">
                    <label><i class="fas fa-credit-card mr-1"></i> Fee Status</label>
                    <select id="feeStatus" required>
                        <option value="Paid" ${data && data.feeStatus === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Pending" ${data && data.feeStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </div>
                <!-- Hidden placeholders for simplicity in this demo form -->
                <input type="hidden" id="attendance" value="${data ? (data.attendance || '0%') : '0%'}">
                <input type="hidden" id="performance" value="${data ? (data.performance || 'N/A') : 'N/A'}">
                
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-save mr-1"></i> Save Changes
                </button>
            </form>
        </div>
    `,

    getTimetableModalHtml: (data) => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        const subjects = Storage.get(Storage.KEYS.SUBJECTS);
        const teachers = Storage.get(Storage.KEYS.TEACHERS);
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        return `
            <div class="modal modal-dark animate-slide-up">
                <div class="modal-header">
                    <h2>${data ? 'Edit' : 'Add'} Timetable Entry</h2>
                    <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
                </div>
                <form id="timetableForm" class="auth-form">
                    <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                    <div class="grid-2 mb-1">
                        <div class="form-group">
                            <label>Class</label>
                            <select id="class" required>
                                <option value="">Select Class</option>
                                ${[...new Set(classes.map(c => c.name))].map(c => `<option value="${c}" ${data && data.class === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Subject</label>
                            <select id="subject" required>
                                <option value="">Select Subject</option>
                                ${subjects.map(s => `<option value="${s.name}" ${data && data.subject === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="grid-2 mb-1">
                        <div class="form-group">
                            <label>Day</label>
                            <select id="day" required>
                                ${days.map(d => `<option value="${d}" ${data && data.day === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Time</label>
                            <input type="text" id="time" value="${data ? data.time : ''}" placeholder="e.g. 09:00 AM - 10:00 AM" required>
                        </div>
                    </div>
                    <div class="form-group mb-2">
                        <label>Teacher</label>
                        <select id="teacher" required>
                            <option value="">Select Teacher</option>
                            ${teachers.map(t => `<option value="${t.name}" ${data && data.teacher === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-save mr-1"></i> Save Entry
                    </button>
                </form>
            </div>
        `;
    },

    getEventModalHtml: (data) => `
        <div class="modal modal-dark animate-slide-up">
            <div class="modal-header">
                <h2>${data ? 'Edit' : 'Add'} Event</h2>
                <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
            </div>
            <form id="eventForm" class="auth-form">
                <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                <div class="form-group mb-1">
                    <label>Event Name</label>
                    <input type="text" id="name" value="${data ? data.name : ''}" placeholder="e.g. Annual Sports Day" required>
                </div>
                <div class="grid-2 mb-1">
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="date" value="${data ? data.date : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Venue</label>
                        <input type="text" id="venue" value="${data ? data.venue : ''}" placeholder="e.g. School Ground" required>
                    </div>
                </div>
                <div class="form-group mb-2">
                    <label>Description</label>
                    <textarea id="description" placeholder="Short description of the event" required>${data ? data.description : ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-save mr-1"></i> Save Event
                </button>
            </form>
        </div>
    `,

    getTaskModalHtml: (data) => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        return `
            <div class="modal modal-dark animate-slide-up">
                <div class="modal-header">
                    <h2>${data ? 'Edit' : 'Add'} Task</h2>
                    <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
                </div>
                <form id="taskForm" class="auth-form">
                    <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                    <div class="form-group mb-1">
                        <label>Title</label>
                        <input type="text" id="title" value="${data ? data.title : ''}" placeholder="Enter title" required>
                    </div>
                    <div class="grid-2 mb-1">
                        <div class="form-group">
                            <label>Type</label>
                            <select id="task-type" required>
                                <option value="Exam" ${data && data.type === 'Exam' ? 'selected' : ''}>Exam</option>
                                <option value="Assignment" ${data && data.type === 'Assignment' ? 'selected' : ''}>Assignment</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Class</label>
                            <select id="class" required>
                                <option value="">Select Class</option>
                                ${[...new Set(classes.map(c => c.name))].map(c => `<option value="${c}" ${data && data.class === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-group mb-2">
                        <label>Due Date</label>
                        <input type="date" id="dueDate" value="${data ? data.dueDate : ''}" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Save Task</button>
                </form>
            </div>
        `;
    },

    getTeacherModalHtml: (data) => `
        <div class="modal modal-dark animate-slide-up">
            <div class="modal-header">
                <h2>${data ? 'Edit' : 'Add'} Teacher</h2>
                <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
            </div>
            <form id="teacherForm" class="auth-form">
                <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                <div class="form-group mb-1">
                    <label><i class="fas fa-user mr-1"></i> Full Name</label>
                    <input type="text" id="name" value="${data ? data.name : ''}" placeholder="Enter teacher name" required>
                </div>
                <div class="form-group mb-1">
                    <label><i class="fas fa-envelope mr-1"></i> Email Address</label>
                    <input type="email" id="email" value="${data ? data.email : ''}" placeholder="teacher@cms.com" required>
                </div>
                <div class="form-group mb-1">
                    <label><i class="fas fa-book mr-1"></i> Assigned Subject</label>
                    <input type="text" id="subject" value="${data ? data.subject : ''}" placeholder="e.g. Mathematics" required>
                </div>
                <div class="grid-2 mb-2">
                    <div class="form-group">
                        <label><i class="fas fa-chart-line mr-1"></i> Performance (%)</label>
                        <input type="number" id="performance" value="${data ? data.performance : ''}" placeholder="0-100" min="0" max="100">
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-money-bill-wave mr-1"></i> Salary ($)</label>
                        <input type="number" id="salary" value="${data ? data.salary : ''}" placeholder="e.g. 5000">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-save mr-1"></i> Save Teacher Changes
                </button>
            </form>
        </div>
    `,

    getClassModalHtml: (data) => {
        const teachers = Storage.get(Storage.KEYS.TEACHERS);

        return `
            <div class="modal modal-dark animate-slide-up">
                <div class="modal-header">
                    <h2>${data ? 'Edit' : 'Add'} Course/Class</h2>
                    <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
                </div>
                <form id="classForm" class="auth-form">
                    <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                    <div class="grid-2 mb-1">
                        <div class="form-group">
                            <label><i class="fas fa-book mr-1"></i> Course Name</label>
                            <input type="text" id="name" value="${data ? data.name : ''}" placeholder="e.g. Web Development" required>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-layer-group mr-1"></i> Section</label>
                            <input type="text" id="section" value="${data ? data.section : ''}" placeholder="e.g. Batch A" required>
                        </div>
                    </div>
                    
                    <div class="form-group mb-1">
                        <label><i class="fas fa-user-tie mr-1"></i> Assign Teacher</label>
                        <select id="teacher" required>
                            <option value="">Select a Teacher</option>
                            ${teachers.map(t => `<option value="${t.name}" ${data && data.teacher === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="grid-2 mb-1">
                        <div class="form-group">
                            <label><i class="fas fa-clock mr-1"></i> Duration</label>
                            <input type="text" id="duration" value="${data ? (data.duration || '') : ''}" placeholder="e.g. 3 Months">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-calendar-alt mr-1"></i> Schedule</label>
                            <input type="text" id="schedule" value="${data ? (data.schedule || '') : ''}" placeholder="e.g. Mon-Fri 10AM">
                        </div>
                    </div>

                    <div class="form-group mb-2">
                        <label><i class="fas fa-link mr-1"></i> Course Materials URL</label>
                        <input type="url" id="materials" value="${data ? (data.materials || '') : ''}" placeholder="https://drive.google.com/...">
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-save mr-1"></i> Save Course Changes
                    </button>
                </form>
            </div>
        `;
    },

    getSubjectModalHtml: (data) => `
        <div class="modal">
            <div class="modal-header">
                <h2>${data ? 'Edit' : 'Add'} Subject</h2>
                <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
            </div>
            <form id="subjectForm" class="auth-form">
                <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                <div class="form-group">
                    <label>Subject Name</label>
                    <input type="text" id="name" value="${data ? data.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Subject Code</label>
                    <input type="text" id="code" value="${data ? data.code : ''}" required>
                </div>
                <div class="form-group">
                    <label>Assigned Teacher</label>
                    <input type="text" id="teacher" value="${data ? data.teacher : ''}" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Save Subject</button>
            </form>
        </div>
    `,

    saveEntity: (type) => {
        const id = document.getElementById('entity-id').value;
        const keyMap = {
            'student': Storage.KEYS.STUDENTS,
            'teacher': Storage.KEYS.TEACHERS,
            'class': Storage.KEYS.CLASSES,
            'subject': Storage.KEYS.SUBJECTS,
            'task': null, // Handled dynamically below
            'timetable': Storage.KEYS.TIMETABLES,
            'event': Storage.KEYS.EVENTS
        };
        let key = keyMap[type];

        const formData = {};
        const inputs = document.querySelectorAll('#modal-container input, #modal-container select');
        inputs.forEach(input => {
            if (input.id !== 'entity-id') formData[input.id] = input.value;
        });
        formData.id = id || Utils.generateId();

        if (type === 'task') {
            const taskType = document.getElementById('task-type').value;
            key = taskType === 'Exam' ? Storage.KEYS.EXAMS : Storage.KEYS.ASSIGNMENTS;
        }

        if (id) {
            Storage.update(key, id, formData);
            Utils.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`, 'success');
        } else {
            Storage.create(key, formData);
            Utils.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`, 'success');
        }

        Admin.closeModal();
        if (type === 'task' || type === 'timetable' || type === 'event') {
            Admin.renderSchedule();
        } else {
            Admin[`render${type.charAt(0).toUpperCase() + type.slice(1)}s`]();
        }
        Admin.loadStats();
        if (type === 'student') Admin.populateStudentFilters();
    },

    viewStudentReport: (id) => {
        const student = Storage.get(Storage.KEYS.STUDENTS).find(s => s.id === id);
        const container = document.getElementById('modal-container');

        container.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>Report Card: ${student.name}</h2>
                    <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
                </div>
                <div class="report-body">
                    <div class="report-section">
                        <h3>Attendance Overview</h3>
                        <p>Total Presence: <strong>${student.attendance}</strong></p>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${student.attendance}"></div>
                        </div>
                    </div>
                    <div class="report-section mt-1">
                        <h3>Academic Performance</h3>
                        <p>Overall Grade: <span class="badge badge-purple">${student.performance}</span></p>
                    </div>
                    <div class="report-section mt-1">
                        <h3>Finance</h3>
                        <p>Fee Status: <span class="badge ${student.feeStatus === 'Paid' ? 'badge-success' : 'badge-danger'}">${student.feeStatus}</span></p>
                    </div>
                </div>
                <button class="btn btn-primary btn-block mt-1" onclick="Admin.printReport()">
                    <i class="fas fa-print"></i> Print Report
                </button>
            </div>
        `;
        container.style.display = 'flex';
    },

    printReport: () => {
        window.print();
    },

    editStudent: (id) => {
        const student = Storage.get(Storage.KEYS.STUDENTS).find(s => s.id === id);
        if (student) {
            Admin.openModal('student', student);
        }
    },

    editTeacher: (id) => Admin.openModal('teacher', Storage.get(Storage.KEYS.TEACHERS).find(t => t.id === id)),
    editClass: (id) => Admin.openModal('class', Storage.get(Storage.KEYS.CLASSES).find(c => c.id === id)),
    editSubject: (id) => Admin.openModal('subject', Storage.get(Storage.KEYS.SUBJECTS).find(s => s.id === id)),
    editTask: (id, type) => {
        const key = type === 'Exam' ? Storage.KEYS.EXAMS : Storage.KEYS.ASSIGNMENTS;
        const task = Storage.get(key).find(t => t.id === id);
        if (task) Admin.openModal('task', { ...task, type });
    },

    editTimetable: (id) => {
        const entry = Storage.get(Storage.KEYS.TIMETABLES).find(t => t.id === id);
        if (entry) Admin.openModal('timetable', entry);
    },

    editEvent: (id) => {
        const event = Storage.get(Storage.KEYS.EVENTS).find(e => e.id === id);
        if (event) Admin.openModal('event', event);
    },

    deleteStudent: (id) => Admin.showDeleteConfirmation(id, 'Student', () => {
        Admin.deleteEntity(Storage.KEYS.STUDENTS, id, 'Student');
    }),

    deleteTeacher: (id) => Admin.deleteEntity(Storage.KEYS.TEACHERS, id, 'Teacher'),
    deleteClass: (id) => Admin.showDeleteConfirmation(id, 'Class', () => {
        Admin.deleteEntity(Storage.KEYS.CLASSES, id, 'Class');
    }),
    deleteSubject: (id) => Admin.showDeleteConfirmation(id, 'Subject', () => {
        Admin.deleteEntity(Storage.KEYS.SUBJECTS, id, 'Subject');
    }),
    deleteTask: (id, type) => Admin.showDeleteConfirmation(id, type, () => {
        const key = type === 'Exam' ? Storage.KEYS.EXAMS : Storage.KEYS.ASSIGNMENTS;
        Storage.delete(key, id);
        Utils.showToast(`${type} deleted successfully`, 'success');
        Admin.renderSchedule();
        Admin.loadStats();
    }),

    deleteTimetable: (id) => Admin.showDeleteConfirmation(id, 'Timetable Entry', () => {
        Storage.delete(Storage.KEYS.TIMETABLES, id);
        Utils.showToast(`Timetable entry deleted successfully`, 'success');
        Admin.renderSchedule();
        Admin.loadStats();
    }),

    deleteEvent: (id) => Admin.showDeleteConfirmation(id, 'Event', () => {
        Storage.delete(Storage.KEYS.EVENTS, id);
        Utils.showToast(`Event deleted successfully`, 'success');
        Admin.renderSchedule();
        Admin.loadStats();
    }),

    deleteEntity: (key, id, label) => {
        Storage.delete(key, id);
        Utils.showToast(`${label} deleted successfully`, 'success');
        const type = label.toLowerCase();
        Admin[`render${type.charAt(0).toUpperCase() + type.slice(1)}s`]();
        Admin.loadStats();
        if (label === 'Student') Admin.populateStudentFilters();
    },

    showDeleteConfirmation: (id, label, onConfirm) => {
        const container = document.getElementById('modal-container');
        container.innerHTML = `
            <div class="modal modal-confirm animate-slide-up">
                <div class="icon-box">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Are you sure?</h2>
                <p>Do you really want to delete this ${label.toLowerCase()}? This action cannot be undone.</p>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" onclick="Admin.closeModal()">No, Cancel</button>
                    <button class="btn btn-danger" id="confirmDeleteBtn">Yes, Delete</button>
                </div>
            </div>
        `;
        container.style.display = 'flex';

        document.getElementById('confirmDeleteBtn').onclick = () => {
            onConfirm();
            Admin.closeModal();
        };
    },

    populateStudentFilters: () => {
        const students = Storage.get(Storage.KEYS.STUDENTS);
        const classes = [...new Set(students.map(s => s.class))];
        const classSelect = document.getElementById('filter-class');
        if (!classSelect) return;

        classSelect.innerHTML = '<option value="">All Classes</option>' +
            classes.map(c => `<option value="${c}">${c}</option>`).join('');
    },

    closeModal: () => {
        document.getElementById('modal-container').style.display = 'none';
    },

    setupSearch: () => {
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.sidebar-nav li.active').getAttribute('data-tab');
            if (activeTab === 'students') Admin.renderStudents(e.target.value);
            // Add search for other tabs here
        });
    }
};

// Initialize Admin Dashboard
document.addEventListener('DOMContentLoaded', Admin.init);
