// Ajusta cada linha .fit para ocupar a largura do bloco (até o data-max, em px).
(function () {
  if (new URLSearchParams(location.search).get('f') === '916') document.body.classList.add('f916');
  function fit() {
    document.querySelectorAll('.fit').forEach(function (el) {
      var max = parseFloat(el.dataset.max || 400);
      var w = el.parentElement.clientWidth;
      el.style.fontSize = '100px';
      var size = Math.min(max, 100 * w / el.scrollWidth);
      el.style.fontSize = size.toFixed(1) + 'px';
    });
    document.body.dataset.ready = '1';
  }
  document.fonts.ready.then(fit);
})();
