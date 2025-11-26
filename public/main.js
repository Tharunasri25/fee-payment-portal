document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN PAGE LOGIC ---
    const loginBtn = document.getElementById('login-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('error-msg');

            // 1. Client-side validation
            if (!email || !password) {
                alert("Please enter both email and password.");
                return;
            }

            try {
                // 2. Send data to your Backend (/login endpoint)
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                // 3. Handle the response
                if (data.success) {
                    // Login Success!
                    // Save user info safely in browser storage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect to the Dashboard
                    window.location.href = 'dashboard.html'; 
                } else {
                    // Login Failed (Show error message from server)
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                        errorMsg.innerText = data.message;
                    } else {
                        alert(data.message);
                    }
                }
            } catch (err) {
                console.error("Login Error:", err);
                alert("Something went wrong. Please try again.");
            }
        });
    }
});