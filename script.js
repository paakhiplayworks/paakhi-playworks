const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));
const modal = document.getElementById('game-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
function openModal(game) {
  modalTitle.textContent = game === 'More Games' ? 'More fun is on the way!' : `${game} is coming soon!`;
  modalMessage.textContent = game === 'More Games'
    ? 'We’re dreaming up new worlds and playful challenges. Come back soon to see what’s next!'
    : `We’re polishing ${game} to make it extra fun. This card is ready for your game link when you launch.`;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close').focus();
}
function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
}
document.querySelectorAll('[data-game]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.game)));
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.querySelector('.modal-ok').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
