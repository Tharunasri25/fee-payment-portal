document.addEventListener('DOMContentLoaded', function() {
  const userBtn = document.getElementById('user-btn');
  const adminBtn = document.getElementById('admin-btn');
  const userFields = document.getElementById('user-login-fields');
  const adminFields = document.getElementById('admin-login-fields');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const themeToggle = document.getElementById('theme-toggle');
  const forgotBtn = document.getElementById('forgot-btn');

  // Get references to the input fields
  const userEmailInput = document.getElementById('user-email');
  const userPasswordInput = document.getElementById('user-password');

  let loginMode = 'user';

  userBtn.onclick = () => {
    loginMode = 'user';
    userBtn.classList.add('active');
    adminBtn.classList.remove('active');
    userFields.style.display = 'block';
    adminFields.style.display = 'none';
    loginError.textContent = "";

    // Make user fields required
    userEmailInput.required = true;
    userPasswordInput.required = true;
  };

  adminBtn.onclick = () => {
    loginMode = 'admin';
    userBtn.classList.remove('active');
    adminBtn.classList.add('active');
    userFields.style.display = 'none';
    adminFields.style.display = 'block';
    loginError.textContent = "";

    // Make user fields NOT required
    userEmailInput.required = false;
    userPasswordInput.required = false;
  };

  themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
  };

  forgotBtn.onclick = async () => {
    const email = userEmailInput.value;
    if (!email) {
      loginError.textContent = "Please enter your email to reset password.";
      return;
    }
    loginError.textContent = "Sending reset instructions...";
    // Simulated: implement full backend later
    setTimeout(() => {
      loginError.textContent = "Password reset instructions sent to your email (simulated)";
    }, 1300);
  };

  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    if (loginMode === 'admin') {
      const username = document.getElementById('admin-user').value;
      const password = document.getElementById('admin-pass').value;
      try {
        const res = await fetch('/login/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          window.location.href = '/admin.html';
        } else {
          loginError.textContent = data.message || 'Invalid admin credentials.';
        }
      } catch (err) {
        loginError.textContent = 'Error contacting server.';
      }
    } else {
      const email = userEmailInput.value;
      const password = userPasswordInput.value;
      if (email && password) {
          localStorage.setItem('userEmail', email);
          window.location.href = '/dashboard.html';
      } else {
          loginError.textContent = 'Please enter email and password.';
      }
    }
  };
});