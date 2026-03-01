/* Readmore helper for BeginGently
   - One "Read more" per card (first paragraph only)
   - applyReadMore(selector, charLimit) for general use
   - applyReadMoreToElement(el, charLimit) for single element
*/
(function () {
  function applyReadMoreToElement(el, charLimit) {
    if (!el || el.dataset.readmore === '1') return;
    const plain = el.textContent.trim();
    if (plain.length <= charLimit) {
      el.dataset.readmore = '1';
      return;
    }

    const preview = plain.slice(0, charLimit).replace(/\s+$/, '');
    const full = el.innerHTML;

    el.dataset.full = full;
    el.dataset.preview = preview;
    el.innerHTML = preview + '\u2026 '; /* ellipsis */

    const btn = document.createElement('button');
    btn.className = 'read-more-btn';
    btn.type = 'button';
    btn.textContent = 'Read more';
    btn.setAttribute('aria-expanded', 'false');

    function expand() {
      el.innerHTML = el.dataset.full + ' ';
      btn.textContent = 'Show less';
      btn.setAttribute('aria-expanded', 'true');
      el.parentNode.appendChild(btn);
    }

    function collapse() {
      el.innerHTML = el.dataset.preview + '\u2026 ';
      btn.textContent = 'Read more';
      btn.setAttribute('aria-expanded', 'false');
      el.parentNode.appendChild(btn);
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (btn.getAttribute('aria-expanded') === 'true') collapse();
      else expand();
    });

    el.parentNode.appendChild(btn);
    el.dataset.readmore = '1';
  }

  function applyReadMore(selector, charLimit) {
    document.querySelectorAll(selector).forEach(function (el) {
      applyReadMoreToElement(el, charLimit);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* One Read more per message-box (first paragraph only) */
    document.querySelectorAll('.message-box').forEach(function (box) {
      var firstP = box.querySelector('p');
      if (firstP) applyReadMoreToElement(firstP, 450);
    });

    /* One Read more per card (first paragraph only) */
    document.querySelectorAll('.card').forEach(function (card) {
      var firstP = card.querySelector('p');
      if (firstP) applyReadMoreToElement(firstP, 320);
    });

    applyReadMore('.faq-answer', 260);
    applyReadMore('.argument-explanation', 360);
    applyReadMore('.proof-card p', 180);
  });

  window.applyReadMore = applyReadMore;
  window.applyReadMoreToElement = applyReadMoreToElement;
})();
