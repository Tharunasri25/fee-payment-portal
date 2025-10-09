document.addEventListener('DOMContentLoaded', function() {
  // Theme toggle
  document.getElementById('theme-toggle').onclick = () => {
    document.body.classList.toggle('dark');
  };

  // Logout
  document.getElementById('logout-btn').onclick = () => {
    // Invalidate session eventually
    window.location.href = '/';
  };

  // Payment list mock (replace with fetch; backend in next steps)
  const mockPayments = [
    { id: 1, desc: "Semester 1 Tuition Fee", amount: 50000, status: "due" },
    { id: 2, desc: "Hostel Fee", amount: 20000, status: "paid" }
  ];

  function renderPayments() {
    const paymentsList = document.getElementById('payments-list');
    paymentsList.innerHTML = "";
    mockPayments.forEach(p => {
      const div = document.createElement('div');
      div.className = `payment-row ${p.status}`;
      div.innerHTML = `
        <span><b>${p.desc}</b> - ₹${p.amount}</span>
        <span class="badge ${p.status}">${p.status.toUpperCase()}</span>
        ${p.status === "due" ? `<button onclick="alert('Payment flow soon')">Pay</button>` : ""}
      `;
      paymentsList.appendChild(div);
    });
  }
  renderPayments();

  // Chatbot (simple echo/placeholder)
  const chatWindow = document.getElementById('chat-window');
  document.getElementById('chat-send').onclick = () => {
    const userMsg = document.getElementById('chat-input').value;
    if (userMsg) {
      chatWindow.innerHTML += `<div class="chat-bubble user">You: ${userMsg}</div>`;
      chatWindow.innerHTML += `<div class="chat-bubble bot">Support: (bot) You said "${userMsg}"</div>`;
      document.getElementById('chat-input').value = "";
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  };
});
