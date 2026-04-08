// Mobile Drawer Toggle
const menuToggle = document.getElementById('menuToggle');
const mobileDrawer = document.getElementById('mobileDrawer');

menuToggle?.addEventListener('click', () => {
  mobileDrawer.classList.toggle('active');
  const isOpen = mobileDrawer.classList.contains('active');
  menuToggle.setAttribute('aria-expanded', isOpen);
  menuToggle.textContent = isOpen ? '×' : '☰';
});

// Modal Functionality
const joinModal = document.getElementById('joinModal');
const openModalBtns = document.querySelectorAll('[data-open-modal]');
const closeModalBtns = document.querySelectorAll('[data-close-modal]');

function openModal() {
  joinModal?.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Focus trap for accessibility
  const focusable = joinModal.querySelectorAll('button, a[href]');
  if (focusable.length) focusable[0].focus();
}

function closeModal() {
  joinModal?.classList.remove('active');
  document.body.style.overflow = '';
}

openModalBtns.forEach(btn => {
  btn.addEventListener('click', openModal);
});

closeModalBtns.forEach(btn => {
  btn.addEventListener('click', closeModal);
});

// Close modal on backdrop click
joinModal?.addEventListener('click', (e) => {
  if (e.target === joinModal) {
    closeModal();
  }
});

// Copy to Clipboard Functionality
const copyBtn = document.getElementById('copyBtn');
const appTemplate = document.getElementById('appTemplate');

copyBtn?.addEventListener('click', async () => {
  const text = appTemplate?.textContent || '';
  try {
    await navigator.clipboard.writeText(text);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied';
    copyBtn.style.backgroundColor = '#2d5a27';
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '';
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copyBtn.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.textContent = 'Copy Template';
    }, 2000);
  }
});

// Escape Key Handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    if (mobileDrawer?.classList.contains('active')) {
      mobileDrawer.classList.remove('active');
      menuToggle.textContent = '☰';
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  }
});

// Close mobile drawer when clicking a link
document.querySelectorAll('.mobile-drawer a').forEach(link => {
  link.addEventListener('click', () => {
    mobileDrawer?.classList.remove('active');
    menuToggle.textContent = '☰';
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

// Close mobile drawer on window resize above breakpoint
window.addEventListener('resize', () => {
  if (window.innerWidth > 720 && mobileDrawer?.classList.contains('active')) {
    mobileDrawer.classList.remove('active');
    menuToggle.textContent = '☰';
    menuToggle.setAttribute('aria-expanded', 'false');
  }
});