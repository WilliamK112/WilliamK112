// Minimal JS to integrate small accessibility tweaks.
(function optimizeTabOrder() {
  const skip = document.querySelector('.skip-link');
  const hero = document.querySelector('.hero');
  if (skip && hero) hero.tabIndex = -1;
})();

(function setupMessageFormSubmit() {
  const form = document.querySelector('.message-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = 'Sending...';
    status.className = 'form-status';

    const emailInput = document.getElementById('sender-email');
    const messageInput = document.getElementById('sender-message');
    const email = emailInput && 'value' in emailInput ? emailInput.value.trim() : '';
    const message = messageInput && 'value' in messageInput ? messageInput.value.trim() : '';

    if (!email || !message) {
      status.textContent = 'Please enter both your email and message.';
      status.className = 'form-status error';
      return;
    }

    try {
      const response = await fetch('https://formsubmit.co/ajax/ckang53@wisc.edu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
          _subject: 'New portfolio message',
          _captcha: 'false',
          _template: 'table',
        }),
      });

      if (!response.ok) throw new Error('Request failed');

      form.reset();
      status.textContent = 'Message sent. Thank you!';
      status.className = 'form-status success';
    } catch (error) {
      status.textContent = 'Send failed. Please try again in a moment.';
      status.className = 'form-status error';
    }
  });
})();

(function setupFlipCards() {
  const flipCards = document.querySelectorAll('[data-flip-card]');
  if (!flipCards.length) return;

  flipCards.forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) return;
      const isFlipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', isFlipped ? 'true' : 'false');
    });
  });
})();