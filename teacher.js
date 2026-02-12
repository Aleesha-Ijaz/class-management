const Teacher = {
    init: () => {
        Teacher.checkAuth();
        Teacher.setupTabNavigation();
        Teacher.loadOverviewStats();
        Teacher.populateClassSelects();
    },

    checkAuth: () => {
        const user = Storage.getCurrentUser();
        if (!user || user.role !== 'teacher') {
            window.location.href = 'index.html';
        }
        document.getElementById('teacher-name').textContent = user.name;
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

                if (target === 'assignments') Teacher.renderAssignments();
                if (target === 'overview') Teacher.loadOverviewStats();
            });
        });
    },

    loadOverviewStats: () => {
        const students = Storage.get(Storage.KEYS.STUDENTS).length;
        const assignments = Storage.get(Storage.KEYS.ASSIGNMENTS).length;

        document.getElementById('stat-total-students').textContent = students;
        document.getElementById('stat-pending-assignments').textContent = assignments;
        document.getElementById('stat-avg-attendance').textContent = '85%'; // Mock
    },

    populateClassSelects: () => {
        const classes = Storage.get(Storage.KEYS.CLASSES);
        const selects = ['attendance-class-select', 'grades-class-select'];

        selects.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Select Class</option>' +
                classes.map(c => `<option value="${c.name}">${c.name} - ${c.section}</option>`).join('');
        });
    },

    // Attendance
    loadAttendanceList: () => {
        const className = document.getElementById('attendance-class-select').value;
        if (!className) return Utils.showToast('Please select a class', 'warning');

        const students = Storage.get(Storage.KEYS.STUDENTS).filter(s => s.class === className);
        const tbody = document.querySelector('#attendance-table tbody');

        tbody.innerHTML = students.map(s => `
            <tr>
                <td>${s.roll}</td>
                <td>${s.name}</td>
                <td>
                    <div class="attendance-status">
                        <button class="status-btn present" onclick="Teacher.toggleAttendance(this, 'P')">P</button>
                        <button class="status-btn absent" onclick="Teacher.toggleAttendance(this, 'A')">A</button>
                    </div>
                </td>
                <td><input type="text" placeholder="Note..." class="grade-input" style="width: 150px"></td>
            </tr>
        `).join('');
    },

    toggleAttendance: (btn, status) => {
        const parent = btn.parentElement;
        parent.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    saveAttendance: () => {
        Utils.showToast('Attendance saved successfully', 'success');
    },

    // Assignments
    renderAssignments: () => {
        const assignments = Storage.get(Storage.KEYS.ASSIGNMENTS);
        const container = document.getElementById('assignments-list');

        container.innerHTML = assignments.map(a => `
            <div class="assignment-card animate-slide-up">
                <div class="assignment-header">
                    <h3>${a.title}</h3>
                    <span class="assignment-badge badge-blue">${a.class}</span>
                </div>
                <p class="text-muted">${a.description}</p>
                <div class="assignment-footer">
                    <span><i class="far fa-calendar-alt"></i> ${a.dueDate}</span>
                    <div class="actions">
                        <button class="btn-icon btn-edit" onclick="Teacher.editAssignment('${a.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon btn-delete" onclick="Teacher.deleteAssignment('${a.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    openAssignmentModal: (data = null) => {
        const container = document.getElementById('modal-container');
        const classes = Storage.get(Storage.KEYS.CLASSES);

        container.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${data ? 'Edit' : 'Create'} Assignment</h2>
                    <button class="btn-close" onclick="Teacher.closeModal()">&times;</button>
                </div>
                <form id="assignmentForm" class="auth-form">
                    <input type="hidden" id="assignment-id" value="${data ? data.id : ''}">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" id="title" value="${data ? data.title : ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="description" rows="3" required>${data ? data.description : ''}</textarea>
                    </div>
                    <div class="grid-2">
                        <div class="form-group">
                            <label>Class</label>
                            <select id="class-select" required>
                                ${classes.map(c => `<option value="${c.name}" ${data && data.class === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Due Date</label>
                            <input type="date" id="dueDate" value="${data ? data.dueDate : ''}" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Save Assignment</button>
                </form>
            </div>
        `;
        container.style.display = 'flex';

        container.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            Teacher.saveAssignment();
        });
    },

    saveAssignment: () => {
        const id = document.getElementById('assignment-id').value;
        const assignmentData = {
            id: id || Utils.generateId(),
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            class: document.getElementById('class-select').value,
            dueDate: document.getElementById('dueDate').value
        };

        if (id) {
            Storage.update(Storage.KEYS.ASSIGNMENTS, id, assignmentData);
            Utils.showToast('Assignment updated', 'success');
        } else {
            Storage.create(Storage.KEYS.ASSIGNMENTS, assignmentData);
            Utils.showToast('Assignment created', 'success');
        }

        Teacher.closeModal();
        Teacher.renderAssignments();
        Teacher.loadOverviewStats();
    },

    deleteAssignment: (id) => {
        if (confirm('Delete this assignment?')) {
            Storage.delete(Storage.KEYS.ASSIGNMENTS, id);
            Teacher.renderAssignments();
            Teacher.loadOverviewStats();
        }
    },

    closeModal: () => {
        document.getElementById('modal-container').style.display = 'none';
    }
};

document.addEventListener('DOMContentLoaded', Teacher.init);
