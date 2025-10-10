document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle
  document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark');
  };

  // Logout
  document.getElementById('logout-btn').onclick = () => {
    window.location.href = '/';
  };

  const paymentsList = document.getElementById('admin-payments-list');
  const createPaymentForm = document.getElementById('create-payment-form');

  async function fetchAdminPayments() {
    try {
      const response = await fetch('/payments');
      const data = await response.json();
      if (data.success) {
        renderAdminPayments(data.payments);
      } else {
        paymentsList.innerHTML = `<p>Could not load payments.</p>`;
      }
    } catch (error) {
      console.error('Error fetching admin payments:', error);
      paymentsList.innerHTML = `<p>Error loading payments.</p>`;
    }
  }

  function renderAdminPayments(payments) {
    paymentsList.innerHTML = "";
    if (payments.length === 0) {
        paymentsList.innerHTML = "<p>No payments have been created yet.</p>";
        return;
    }
    payments.forEach(p => {
      const row = document.createElement('div');
      row.className = p.status === 'paid' ? 'payment-row status-paid' : 'payment-row status-due';
      row.innerHTML = `
        <span><b>${p.email}</b>: ${p.desc} — ₹${p.amount}</span>
        <span class="badge">${p.status.toUpperCase()}</span>
      `;
      paymentsList.appendChild(row);
    });
  }

  createPaymentForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('student-email').value;
    const desc = document.getElementById('fee-desc').value;
    const amount = document.getElementById('fee-amount').value;
    try {
        const response = await fetch('/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, desc, amount })
        });
        const data = await response.json();
        if (data.success) {
            alert('Payment created successfully!');
            createPaymentForm.reset();
            fetchAdminPayments();
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        alert('A network error occurred.');
    }
  };
  
  // --- CHATBOT LOGIC ---
  const chatWindow = document.getElementById('chat-window-admin');
  const chatInput = document.getElementById('chat-input-admin');
  const chatSendBtn = document.getElementById('chat-send-admin');

  const handleSendMessage = async () => {
    const message = chatInput.value.trim();
    if (!message) return;

    displayMessage(message, 'user-message');
    chatInput.value = '';

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message })
      });
      const data = await res.json();
      displayMessage(data.response, 'bot-message');
    } catch (error) {
      displayMessage('Sorry, there was an error connecting to the bot.', 'bot-message');
    }
  };

  function displayMessage(message, className) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = message;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  chatSendBtn.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
  });

  // Initial load
  fetchAdminPayments();
});