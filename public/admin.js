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

  // Function to fetch and display all payments for the admin
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
    paymentsList.innerHTML = ""; // Clear the list
    if (payments.length === 0) {
        paymentsList.innerHTML = "<p>No payments have been created yet.</p>";
        return;
    }
    payments.forEach(p => {
      const color = p.status === "paid" ? "#d4edda" : "#f8d7da"; // Light green for paid, light red for due
      const statusColor = p.status === "paid" ? "#155724" : "#721c24"; // Darker text color for status
      
      paymentsList.innerHTML += `
        <div class="admin-row" style="background:${color}; color:${statusColor}; margin:1em 0; padding:1em; border-radius:8px;">
          <b>${p.email}</b>: ${p.desc} — ₹${p.amount}
          <span class="badge" style="float: right; font-weight: bold;">${p.status.toUpperCase()}</span>
        </div>
      `;
    });
  }

  // Handle the form submission to create a new payment
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
            createPaymentForm.reset(); // Clear the form fields
            fetchAdminPayments(); // Refresh the list of payments
        } else {
            alert(`Error: ${data.message}`);
        }
    } catch (error) {
        console.error('Error creating payment:', error);
        alert('A network error occurred. Please try again.');
    }
  };

  // Initial load of payments when the page loads
  fetchAdminPayments();
});