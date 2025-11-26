document.addEventListener('DOMContentLoaded', () => {
    // --- Login Logic ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');

    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            document.getElementById('welcome-msg').innerText = `Welcome, ${data.user.FullName}`;
        } else {
            alert(data.message);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        location.reload();
    });

    // --- Payment Logic ---
    document.getElementById('pay-btn').addEventListener('click', async () => {
        const amount = document.getElementById('amount').value;
        if (!amount) return alert("Enter amount");

        const res = await fetch('/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const order = await res.json();

        const options = {
            "key": "rzp_test_RjtOijK4mcGPH5", // <--- PASTE YOUR RAZORPAY KEY ID HERE
            "amount": order.amount,
            "currency": "INR",
            "order_id": order.id,
            "handler": function (response){
                alert("Payment Successful! ID: " + response.razorpay_payment_id);
            }
        };
        new Razorpay(options).open();
    });

    // --- Upload Logic (Azure Blob) ---
    document.getElementById('upload-btn').addEventListener('click', async () => {
        const fileInput = document.getElementById('receipt-file');
        if (fileInput.files.length === 0) return alert("Select a file");

        const formData = new FormData();
        formData.append('receipt', fileInput.files[0]);

        document.getElementById('upload-status').innerText = "Uploading...";
        
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            document.getElementById('upload-status').innerHTML = `Success! <a href="${data.url}" target="_blank">View Receipt</a>`;
        } else {
            document.getElementById('upload-status').innerText = "Upload Failed";
        }
    });

    // --- Chat Logic ---
    const chatBox = document.getElementById('chat-box');
    document.getElementById('send-btn').addEventListener('click', async () => {
        const text = document.getElementById('user-input').value;
        chatBox.innerHTML += `<div>User: ${text}</div>`;
        
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        chatBox.innerHTML += `<div>Bot: ${data.response}</div>`;
    });
});