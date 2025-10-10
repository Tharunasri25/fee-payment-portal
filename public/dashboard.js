document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle
  document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark');
  };

  // Logout
  document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('userEmail'); // Clear the stored email on logout
    window.location.href = '/';
  };

  const paymentsList = document.getElementById('payments-list');
  const loggedInUserEmail = localStorage.getItem('userEmail'); // Get user email from login

  // Function to fetch payments for the specific user
  async function fetchUserPayments() {
    if (!loggedInUserEmail) {
        paymentsList.innerHTML = "<p>Could not identify user. Please log in again.</p>";
        return;
    }
    try {
        // Call the backend endpoint to get payments for this user
        const response = await fetch(`/payments/user?email=${loggedInUserEmail}`);
        const data = await response.json();
        if (data.success) {
            renderUserPayments(data.payments);
        } else {
            paymentsList.innerHTML = `<p>Could not load your payments.</p>`;
        }
    } catch (error) {
        console.error('Error fetching user payments:', error);
        paymentsList.innerHTML = `<p>Error loading your payments.</p>`;
    }
  }

  // Function to display the payments on the page
  function renderUserPayments(payments) {
    paymentsList.innerHTML = "";
    if (payments.length === 0) {
        paymentsList.innerHTML = "<p>The admin has not assigned any payments to you yet.</p>";
        return;
    }
    payments.forEach(p => {
        const row = document.createElement('div');
        row.className = p.status === 'paid' ? 'payment-row status-paid' : 'payment-row status-due';
        row.innerHTML = `
            <span><b>${p.desc}</b> — ₹${p.amount}</span>
            <span class="badge">${p.status.toUpperCase()}</span>
        `;
        paymentsList.appendChild(row);
    });
  }


  // --- CHATBOT LOGIC ---
  const chatWindow = document.getElementById('chat-window');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send');

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
  
  // Initial load of data for the page
  fetchUserPayments();
});