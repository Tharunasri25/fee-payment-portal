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

  // Mock payments dashboard data (to be replaced with backend data)
  const adminPayments = [
    { id: 1, email: "user1@email.com", desc: "Semester 1 Tuition Fee", amount: 50000, status: "due" },
    { id: 2, email: "user2@email.com", desc: "Hostel Fee", amount: 20000, status: "paid" }
  ];

  function renderAdminPayments() {
    const list = document.getElementById('admin-payments-list');
    list.innerHTML = "";
    adminPayments.forEach(p => {
      const color = p.status === "paid" ? "#96e072" : "#ff9a8b";
      list.innerHTML += `
        <div class="admin-row" style="background:${color};margin:1em 0;padding:0.7em;border-radius:8px;">
          <b>${p.email}</b>: ${p.desc} — ₹${p.amount}
          <span class="badge">${p.status.toUpperCase()}</span>
          ${p.status === "due" ? `<button onclick="alert('Pay feature soon')">Mark Paid</button>` : ""}
        </div>
      `;
    });
  }
  renderAdminPayments();

  // Create Payment form (mock, next step: call backend)
  document.getElementById('create-payment-form').onsubmit = (e) => {
    e.preventDefault();
    // Demo-only. Implement real submission with backend later!
    alert('Payment created (mock only, to be connected to backend)');
  };

  // Chatbot echo placeholder
  const chatWindow = document.getElementById('chat-window-admin');
  document.getElementById('chat-send-admin').onclick = () => {
    const msg = document.getElementById('chat-input-admin').value;
    if (msg) {
      chatWindow.innerHTML += `<div class="chat-bubble user">You: ${msg}</div>`;
      chatWindow.innerHTML += `<div class="chat-bubble bot">Support: (bot) You said "${msg}"</div>`;
      document.getElementById('chat-input-admin').value = "";
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  };
});
