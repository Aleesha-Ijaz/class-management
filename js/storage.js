const Storage = {
    KEYS: {
        USERS: 'cms_users',
        STUDENTS: 'cms_students',
        TEACHERS: 'cms_teachers',
        CLASSES: 'cms_classes',
        SUBJECTS: 'cms_subjects',
        ATTENDANCE: 'cms_attendance',
        ASSIGNMENTS: 'cms_assignments',
        GRADES: 'cms_grades',
        EXAMS: 'cms_exams',
        TIMETABLES: 'cms_timetables',
        EVENTS: 'cms_events',
        CURRENT_USER: 'cms_current_user'
    },

    // Generic Get
    get: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    // Generic Save
    save: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // CRUD - Create
    create: (key, item) => {
        const items = Storage.get(key);
        items.push(item);
        Storage.save(key, items);
        return item;
    },

    // CRUD - Update
    update: (key, id, updatedData) => {
        const items = Storage.get(key);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedData };
            Storage.save(key, items);
            return items[index];
        }
        return null;
    },

    // CRUD - Delete
    delete: (key, id) => {
        const items = Storage.get(key);
        const filteredItems = items.filter(item => item.id !== id);
        Storage.save(key, filteredItems);
    },

    // Initialize Default Data
    initDefaults: () => {
        if (!localStorage.getItem(Storage.KEYS.USERS)) {
            // Initial Admin
            Storage.save(Storage.KEYS.USERS, [
                {
                    id: 'admin_1',
                    name: 'Admin User',
                    email: 'admin@cms.com',
                    password: 'admin',
                    role: 'admin'
                }
            ]);
        }

        // Sample Students
        if (Storage.get(Storage.KEYS.STUDENTS).length === 0) {
            Storage.save(Storage.KEYS.STUDENTS, [
                {
                    id: 's1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    class: '10-A',
                    roll: '101',
                    feeStatus: 'Paid',
                    attendance: '95%',
                    performance: 'A'
                },
                {
                    id: 's2',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    class: '10-B',
                    roll: '102',
                    feeStatus: 'Pending',
                    attendance: '88%',
                    performance: 'B+'
                }
            ]);
        }

        // Sample Teachers
        if (Storage.get(Storage.KEYS.TEACHERS).length === 0) {
            Storage.save(Storage.KEYS.TEACHERS, [
                { id: 't1', name: 'Mr. Wilson', email: 'wilson@example.com', subject: 'Mathematics' },
                { id: 't2', name: 'Ms. Davis', email: 'davis@example.com', subject: 'Science' }
            ]);
        }

        // Sample Timetables
        if (Storage.get(Storage.KEYS.TIMETABLES).length === 0) {
            Storage.save(Storage.KEYS.TIMETABLES, [
                { id: 'tt1', class: '10-A', subject: 'Mathematics', day: 'Monday', time: '09:00 AM - 10:00 AM', teacher: 'Mr. Wilson' },
                { id: 'tt2', class: '10-A', subject: 'Science', day: 'Tuesday', time: '10:00 AM - 11:00 AM', teacher: 'Ms. Davis' }
            ]);
        }

        // Sample Events
        if (Storage.get(Storage.KEYS.EVENTS).length === 0) {
            Storage.save(Storage.KEYS.EVENTS, [
                { id: 'e1', name: 'Annual Sports Day', date: '2024-11-20', venue: 'School Ground', description: 'Annual athletic events and competitions.' },
                { id: 'e2', name: 'Science Exhibition', date: '2024-12-15', venue: 'Main Hall', description: 'Showcase of student science projects.' }
            ]);
        }
    },

    // Current User Session
    getCurrentUser: () => {
        const user = localStorage.getItem(Storage.KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    setCurrentUser: (user) => {
        localStorage.setItem(Storage.KEYS.CURRENT_USER, JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem(Storage.KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    }
};

// Initialize defaults
Storage.initDefaults();
