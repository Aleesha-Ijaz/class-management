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
                <td>${t.subject || 'N/A'}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="Admin.editTeacher('${t.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="Admin.deleteTeacher('${t.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    deleteTeacher: (id) => {
        if (confirm('Are you sure you want to delete this teacher?')) {
            Storage.delete(Storage.KEYS.TEACHERS, id);
            Utils.showToast('Teacher deleted successfully', 'success');
            Admin.renderTeachers();
            Admin.loadStats();
        }
    },

    // Classes CRUD
    renderClasses: (filter = '') => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        const tbody = document.querySelector('#classes-table tbody');
        if (!tbody) return;

        tbody.innerHTML = classes.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>${c.section}</td>
                <td>${c.teacher || 'Unassigned'}</td>
                <td class="actions">
                    <button class="btn-icon btn-edit" onclick="Admin.editClass('${c.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="Admin.deleteClass('${c.id}')">
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
                    <button class="btn-icon btn-edit" onclick="Admin.editSubject('${s.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="Admin.deleteSubject('${s.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
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

    getTeacherModalHtml: (data) => `
        <div class="modal">
            <div class="modal-header">
                <h2>${data ? 'Edit' : 'Add'} Teacher</h2>
                <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
            </div>
            <form id="teacherForm" class="auth-form">
                <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                <div class="form-group">
                    <label>Full Name</label>
                    <input type="text" id="name" value="${data ? data.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" value="${data ? data.email : ''}" required>
                </div>
                <div class="form-group">
                    <label>Subject</label>
                    <input type="text" id="subject" value="${data ? data.subject : ''}" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Save Teacher</button>
            </form>
        </div>
    `,

    getClassModalHtml: (data) => `
        <div class="modal">
            <div class="modal-header">
                <h2>${data ? 'Edit' : 'Add'} Class</h2>
                <button class="btn-close" onclick="Admin.closeModal()">&times;</button>
            </div>
            <form id="classForm" class="auth-form">
                <input type="hidden" id="entity-id" value="${data ? data.id : ''}">
                <div class="form-group">
                    <label>Class Name</label>
                    <input type="text" id="name" value="${data ? data.name : ''}" required>
                </div>
                <div class="form-group">
                    <label>Section</label>
                    <input type="text" id="section" value="${data ? data.section : ''}" required>
                </div>
                <div class="form-group">
                    <label>Class Teacher</label>
                    <input type="text" id="teacher" value="${data ? data.teacher : ''}" required>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Save Class</button>
            </form>
        </div>
    `,

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
            'subject': Storage.KEYS.SUBJECTS
        };
        const key = keyMap[type];

        const formData = {};
        const inputs = document.querySelectorAll('#modal-container input, #modal-container select');
        inputs.forEach(input => {
            if (input.id !== 'entity-id') formData[input.id] = input.value;
        });
        formData.id = id || Utils.generateId();

        if (id) {
            Storage.update(key, id, formData);
            Utils.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`, 'success');
        } else {
            Storage.create(key, formData);
            Utils.showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully`, 'success');
        }

        Admin.closeModal();
        Admin[`render${type.charAt(0).toUpperCase() + type.slice(1)}s`]();
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

    deleteStudent: (id) => Admin.showDeleteConfirmation(id, 'Student', () => {
        Admin.deleteEntity(Storage.KEYS.STUDENTS, id, 'Student');
    }),

    deleteTeacher: (id) => Admin.deleteEntity(Storage.KEYS.TEACHERS, id, 'Teacher'),
    deleteClass: (id) => Admin.deleteEntity(Storage.KEYS.CLASSES, id, 'Class'),
    deleteSubject: (id) => Admin.deleteEntity(Storage.KEYS.SUBJECTS, id, 'Subject'),

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
