document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            const users = Storage.get(Storage.KEYS.USERS);
            const user = users.find(u => u.email === email && u.password === password && u.role === role);

            if (user) {
                Storage.setCurrentUser(user);
                Utils.showToast('Login successful!', 'success');

                setTimeout(() => {
                    const dashboardMap = {
                        'admin': 'admin-dashboard.html',
                        'teacher': 'teacher-dashboard.html',
                        'student': 'student-dashboard.html'
                    };
                    window.location.href = dashboardMap[role];
                }, 1000);
            } else {
                Utils.showToast('Invalid credentials or role', 'error');
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const role = document.getElementById('role').value;

            if (password !== confirmPassword) {
                Utils.showToast('Passwords do not match', 'error');
                return;
            }

            const users = Storage.get(Storage.KEYS.USERS);
            if (users.some(u => u.email === email)) {
                Utils.showToast('Email already registered', 'error');
                return;
            }

            const newUser = {
                id: Utils.generateId(),
                name,
                email,
                password,
                role
            };

            Storage.create(Storage.KEYS.USERS, newUser);
            Utils.showToast('Account created successfully!', 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        });
    }
});
