(() => {
  const gate = document.getElementById('pin-gate');
  const form = document.getElementById('pin-form');
  const input = document.getElementById('editor-pin');
  const error = document.getElementById('pin-error');
  const unlocked = sessionStorage.getItem('lsfd-editor-unlocked') === 'yes';
  if (unlocked) { gate.hidden = true; return; }
  document.body.classList.add('pin-locked');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value === LSFD_EDITOR_PIN) {
      sessionStorage.setItem('lsfd-editor-unlocked', 'yes');
      gate.hidden = true;
      document.body.classList.remove('pin-locked');
      input.value = '';
    } else {
      error.textContent = 'Code PIN incorrect. Réessayez.';
      input.value = '';
      input.focus();
    }
  });
})();
