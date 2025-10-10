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
});