document.addEventListener('DOMContentLoaded', function() {
  const userBtn = document.getElementById('user-btn');
  const adminBtn = document.getElementById('admin-btn');
  const userFields = document.getElementById('user-login-fields');
  const adminFields = document.getElementById('admin-login-fields');
  const loginForm = document.getElementById('login-form');
  const sendCodeBtn = document.getElementById('send-code-btn');
  const userCode = document.getElementById('user-code');
  const loginError = document.getElementById('login-error');
  const themeToggle = document.getElementById('theme-toggle');

  let loginMode = 'user';

  userBtn.onclick = () => {
    loginMode = 'user';
    userBtn.classList.add('active');
    adminBtn.classList.remove('active');
    userFields.style.display = '';
    adminFields.style.display = 'none';
  };
  adminBtn.onclick = () => {
    loginMode = 'admin';
    userBtn.classList.remove('active');
    adminBtn.classList.add('active');
    userFields.style.display = 'none';
    adminFields.style.display = '';
  };

  themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
  };

  sendCodeBtn.onclick = async () => {
    const email = document.getElementById('user-email').value;
    if (!email) {
      loginError.textContent = "Enter your email to get code!";
      return;
    }
    loginError.textContent = "Sending code...";
    // Simulate: POST /login/user/request-code (implement backend)
    // await fetch('/login/user/request-code', {method:'POST',body:JSON.stringify({email}),headers:{'Content-Type': 'application/json'}})
    setTimeout(() => {
      userCode.style.display = '';
      loginError.textContent = "Code sent! Check your email.";
    }, 1400);
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    if (loginMode === 'admin') {
      const username = document.getElementById('admin-user').value;
      const password = document.getElementById('admin-pass').value;
      // Simulate: POST /login/admin (implement backend)
      if (username === "admin" && password === "letmein123") {
        window.location.href = '/admin.html';
      } else {
        loginError.textContent = "Invalid admin credentials.";
      }
    } else {
      // User login - check code via backend
      const email = document.getElementById('user-email').value;
      const code = userCode.value;
      // Simulate: POST /login/user/verify-code (implement backend)
      if (email && code === "123456") {
        window.location.href = '/dashboard.html';
      } else {
        loginError.textContent = "Incorrect code.";
      }
    }
  };
});
