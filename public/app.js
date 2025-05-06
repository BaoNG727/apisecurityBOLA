// DOM Elements
const loginSection = document.getElementById('loginSection');
const profileSection = document.getElementById('profileSection');
const gradesSection = document.getElementById('gradesSection');
const userInfo = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const alertBox = document.getElementById('alertBox');
const adminGradeControls = document.getElementById('adminGradeControls');
const updateGradeForm = document.getElementById('updateGradeForm');

// API Configuration
let currentServer = {
    url: 'http://localhost:3000', // Default to vulnerable server
    name: 'Vulnerable'
};

// User data
let currentUser = null;
let authToken = null;

// Server Switch Buttons
document.getElementById('vulnerableServerBtn').addEventListener('click', () => {
    currentServer = {
        url: 'http://localhost:3000',
        name: 'Vulnerable'
    };
    document.getElementById('vulnerableServerBtn').classList.add('active-server');
    document.getElementById('secureServerBtn').classList.remove('active-server');
    logout(); // Logout when switching servers
    showAlert(`Switched to ${currentServer.name} Server`, 'success');
});

document.getElementById('secureServerBtn').addEventListener('click', () => {
    currentServer = {
        url: 'http://localhost:3001',
        name: 'Secure'
    };
    document.getElementById('secureServerBtn').classList.add('active-server');
    document.getElementById('vulnerableServerBtn').classList.remove('active-server');
    logout(); // Logout when switching servers
    showAlert(`Switched to ${currentServer.name} Server`, 'success');
});

// Login Functionality
document.getElementById('loginBtn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showAlert('Please enter username and password');
        return;
    }
    
    try {
        const response = await fetch(`${currentServer.url}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        authToken = data.token;
        currentUser = data.user;
        
        // Update UI
        userInfo.textContent = `Logged in as: ${currentUser.name} (${currentUser.role})`;
        userInfo.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loginSection.classList.add('hidden');
        profileSection.classList.remove('hidden');
        gradesSection.classList.remove('hidden');
        
        // Show admin controls if user is admin
        if (currentUser.role === 'admin') {
            adminGradeControls.classList.remove('hidden');
            updateGradeForm.classList.remove('hidden');
        } else {
            adminGradeControls.classList.add('hidden');
            updateGradeForm.classList.add('hidden');
        }
        
        // Load user profile
        loadProfile(currentUser.id);
        
        showAlert(`Logged in successfully on ${currentServer.name} Server`, 'success');
    } catch (error) {
        showAlert(error.message);
    }
});

// Logout Functionality
logoutBtn.addEventListener('click', () => {
    logout();
    showAlert('Logged out successfully', 'success');
});

function logout() {
    currentUser = null;
    authToken = null;
    
    // Reset UI
    userInfo.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    loginSection.classList.remove('hidden');
    profileSection.classList.add('hidden');
    gradesSection.classList.add('hidden');
    
    // Clear form fields
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('updateName').value = '';
    document.getElementById('viewUserId').value = '';
    document.getElementById('viewGradesUserId').value = '';
    document.getElementById('gradesTableBody').innerHTML = '';
    document.getElementById('gradeId').value = '';
    document.getElementById('newGrade').value = '';
}

// Profile Management
async function loadProfile(userId) {
    try {
        const response = await fetch(`${currentServer.url}/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load profile');
        }
        
        // Update UI
        document.getElementById('profileName').textContent = data.name;
        document.getElementById('profileUsername').textContent = data.username;
        document.getElementById('profileRole').textContent = data.role;
        document.getElementById('updateName').value = data.name;
        
        showAlert(`Profile loaded successfully on ${currentServer.name} Server`, 'success');
    } catch (error) {
        showAlert(error.message);
    }
}

// Update Profile
document.getElementById('updateProfileBtn').addEventListener('click', async () => {
    const name = document.getElementById('updateName').value;
    
    if (!name) {
        showAlert('Please enter a name');
        return;
    }
    
    try {
        const response = await fetch(`${currentServer.url}/api/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }
        
        // Update UI
        document.getElementById('profileName').textContent = data.user.name;
        userInfo.textContent = `Logged in as: ${data.user.name} (${data.user.role})`;
        
        showAlert(`Profile updated successfully on ${currentServer.name} Server`, 'success');
    } catch (error) {
        showAlert(error.message);
    }
});

// View Other User's Profile (for BOLA testing)
document.getElementById('viewProfileBtn').addEventListener('click', async () => {
    const userId = document.getElementById('viewUserId').value;
    
    if (!userId) {
        showAlert('Please enter a user ID');
        return;
    }
    
    try {
        const response = await fetch(`${currentServer.url}/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load profile');
        }
        
        // Update UI
        document.getElementById('profileName').textContent = data.name;
        document.getElementById('profileUsername').textContent = data.username;
        document.getElementById('profileRole').textContent = data.role;
        
        showAlert(`Viewed profile of user ${userId} on ${currentServer.name} Server`, 'success');
    } catch (error) {
        showAlert(`Failed to view profile: ${error.message}`, 'error');
    }
});

// Grades Management
document.getElementById('viewMyGradesBtn').addEventListener('click', async () => {
    loadGrades(currentUser.id);
});

document.getElementById('viewGradesBtn').addEventListener('click', async () => {
    const userId = document.getElementById('viewGradesUserId').value;
    
    if (!userId) {
        showAlert('Please enter a user ID');
        return;
    }
    
    loadGrades(userId);
});

async function loadGrades(userId) {
    try {
        const response = await fetch(`${currentServer.url}/api/grades/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load grades');
        }
        
        // Update UI
        const gradesTableBody = document.getElementById('gradesTableBody');
        gradesTableBody.innerHTML = '';
        
        data.forEach(grade => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${grade.id}</td>
                <td>${grade.course}</td>
                <td>${grade.grade}</td>
                <td>${currentUser.role === 'admin' ? `<button onclick="prepareGradeUpdate(${grade.id}, ${grade.grade})">Edit</button>` : ''}</td>
            `;
            gradesTableBody.appendChild(row);
        });
        
        showAlert(`Grades loaded successfully for user ${userId} on ${currentServer.name} Server`, 'success');
    } catch (error) {
        showAlert(`Failed to load grades: ${error.message}`, 'error');
    }
}

// Prepare grade update form
window.prepareGradeUpdate = function(gradeId, currentGrade) {
    document.getElementById('gradeId').value = gradeId;
    document.getElementById('newGrade').value = currentGrade;
    updateGradeForm.classList.remove('hidden');
};

// Update grade
document.getElementById('submitGradeBtn').addEventListener('click', async () => {
    const gradeId = document.getElementById('gradeId').value;
    const newGrade = document.getElementById('newGrade').value;
    
    if (!gradeId || !newGrade) {
        showAlert('Please select a grade to update');
        return;
    }
    
    try {
        const response = await fetch(`${currentServer.url}/api/grades/${gradeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ grade: parseInt(newGrade) })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update grade');
        }
        
        // Reload current grades
        if (document.getElementById('viewGradesUserId').value) {
            loadGrades(document.getElementById('viewGradesUserId').value);
        } else {
            loadGrades(currentUser.id);
        }
        
        showAlert(`Grade updated successfully on ${currentServer.name} Server`, 'success');
        updateGradeForm.classList.add('hidden');
    } catch (error) {
        showAlert(`Failed to update grade: ${error.message}`, 'error');
    }
});

// Helper function to show alerts
function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');
    
    if (type === 'success') {
        alertBox.classList.add('success');
    } else {
        alertBox.classList.remove('success');
    }
    
    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 5000);
}