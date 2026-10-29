import { decryptName } from './crypto.js';

const $ = (id) => document.getElementById(id);
const views = ['view-unlock', 'view-working', 'view-result', 'view-empty'];

function show(id) {
  for (const v of views) $(v).classList.toggle('hidden', v !== id);
}

function message(text, kind = 'error') {
  $('unlock-msg').innerHTML = text ? `<div class="msg ${kind}">${text}</div>` : '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let entries = [];

async function init() {
  let data;
  try {
    // Cache-bust so a freshly pushed draw is never served from a stale cache.
    const res = await fetch(`assignments.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(String(res.status));
    data = await res.json();
  } catch {
    show('view-empty');
    return;
  }

  entries = data.entries ?? [];
  if (entries.length === 0) {
    show('view-empty');
    return;
  }

  $('name').innerHTML =
    '<option value="">Choose your name…</option>' +
    entries.map((e) => `<option value="${escapeHtml(e.name)}">${escapeHtml(e.name)}</option>`).join('');

  if (data.generated) {
    const when = new Date(data.generated).toLocaleDateString(undefined, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    $('footer').textContent = `Names drawn ${when}`;
  }

  show('view-unlock');
}

$('unlock-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  message('');

  const entry = entries.find((x) => x.name === $('name').value);
  if (!entry) {
    message('Pick your name from the list first.');
    return;
  }

  show('view-working');

  // Key stretching is deliberately slow, so hand the browser a frame to paint
  // the "Unwrapping…" card before it locks up doing the work.
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 30)));

  const started = Date.now();
  const recipient = await decryptName(entry, $('passphrase').value);

  // Keep the suspense beat even on a fast machine.
  const elapsed = Date.now() - started;
  if (elapsed < 1200) await new Promise((r) => setTimeout(r, 1200 - elapsed));

  if (recipient === null) {
    show('view-unlock');
    message('That passphrase does not match. Check for typos, or ask the organiser.');
    return;
  }

  $('recipient').textContent = recipient;
  show('view-result');
  window.celebrate?.();
});

$('again-btn').addEventListener('click', () => {
  $('passphrase').value = '';
  $('name').value = '';
  message('');
  show('view-unlock');
});

init();
