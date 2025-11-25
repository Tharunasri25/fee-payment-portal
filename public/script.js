document.addEventListener('DOMContentLoaded', () => {
    
    // --- Chatbot Logic ---
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());

    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === '') return;
        displayMessage(messageText, 'user-message');
        userInput.value = '';
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageText })
            });
            const data = await response.json();
            displayMessage(data.response, 'bot-message');
        } catch (error) {
            displayMessage('Sorry, I am having trouble connecting.', 'bot-message');
        }
    }

    function displayMessage(text, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = className;
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- Payment Logic ---
    const paymentForm = document.getElementById('payment-form');
    
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const amount = document.getElementById('amount').value;
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;

        // 1. Create Order on Backend
        const orderResponse = await fetch('/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount })
        });
        const order = await orderResponse.json();

        // 2. Open Razorpay Checkout
        const options = {
            "key": "rzp_test_RjtOijK4mcGPH5", // <--- PASTE YOUR KEY ID HERE
            "amount": order.amount,
            "currency": order.currency,
            "name": "College Fee Payment",
            "description": "Test Transaction",
            "order_id": order.id,
            "handler": function (response){
                alert("Payment Successful! Payment ID: " + response.razorpay_payment_id);
            },
            "prefill": {
                "name": name,
                "email": email,
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        const rzp1 = new Razorpay(options);
        rzp1.open();
    });
});