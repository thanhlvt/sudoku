// Picks the page language (saved choice, else the browser's, else English) and swaps the language-specific
// screenshots. Loaded in <head> without `defer` so the right language is set before the first paint.
(function () {
  var LANGS = ['en', 'vi'];

  function detect() {
    try {
      var fromUrl = new URLSearchParams(location.search).get('lang');
      if (LANGS.indexOf(fromUrl) >= 0) return fromUrl;
      var saved = localStorage.getItem('sudoku-landing-lang');
      if (LANGS.indexOf(saved) >= 0) return saved;
    } catch (e) {
      /* storage may be blocked: fall through to the browser language */
    }
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var primary = String(list[i]).toLowerCase().split(/[-_]/)[0];
      if (LANGS.indexOf(primary) >= 0) return primary;
    }
    return 'en';
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    var imgs = document.querySelectorAll('img[data-shot]');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      img.src = 'assets/img/' + img.getAttribute('data-shot') + '-' + lang + '.webp';
      var alt = img.getAttribute('data-alt-' + lang);
      if (alt) img.alt = alt;
    }
    var title = document.documentElement.getAttribute('data-title-' + lang);
    if (title) document.title = title;
  }

  var lang = detect();
  document.documentElement.lang = lang;

  document.addEventListener('DOMContentLoaded', function () {
    apply(lang);
    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function (event) {
        var next = event.currentTarget.getAttribute('data-set-lang');
        apply(next);
        try {
          localStorage.setItem('sudoku-landing-lang', next);
        } catch (e) {
          /* the choice just won't be remembered */
        }
      });
    }
  });
})();
