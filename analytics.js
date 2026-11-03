/* Paakhi Playworks analytics (Google Analytics 4)
   1. Replace GA_ID below with your Measurement ID (looks like G-ABC123XYZ).
   2. To test: open any page with ?debug_analytics=1 at the end of the URL and watch the browser console. */
(function () {
  'use strict';
  var GA_ID = 'G-WJXLE9R7YM';            // <-- REPLACE with your GA4 Measurement ID
  var BLOG_READ_SECONDS = 60;            // active time needed to count as a "read"
  var BLOG_READ_SCROLL = 75;             // % of the article that must be scrolled to count as a "read"

  var DEBUG = /[?&]debug_analytics=1/.test(location.search);
  var configured = GA_ID.indexOf('XXXX') === -1;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (configured) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA_ID, { debug_mode: DEBUG });
  }

  // ---- page type ----
  var path = location.pathname.replace(/index\.html$/, '');
  var pageType = path === '/' ? 'home'
    : path.indexOf('/next-up') === 0 ? 'next_up'
    : path === '/blog/' ? 'blog_index'
    : path.indexOf('/blog/') === 0 ? 'blog_post' : 'other';

  function track(name, params) {
    params = params || {};
    params.page_type = pageType;
    params.transport_type = 'beacon';
    if (DEBUG) console.log('[analytics]', name, params);
    if (configured) gtag('event', name, params);
  }

  // ---- where on the page did something happen ----
  var AREAS = [
    ['.topbar', 'header'], ['.breadcrumb', 'breadcrumb'], ['.hero', 'hero'],
    ['.studio-line', 'studio_line'], ['.featured-card', 'home_live_card'],
    ['.game-grid.soon', 'home_coming_soon'], ['.promise-section', 'about'],
    ['.adventure', 'home_bottom_cta'], ['.product-hero', 'next_up_hero'],
    ['.facts', 'next_up_facts'], ['.block', 'next_up_body'], ['.post-card', 'blog_list'],
    ['.article', 'blog_post_body'], ['footer', 'footer']
  ];
  function areaOf(el) {
    for (var i = 0; i < AREAS.length; i++) if (el.closest(AREAS[i][0])) return AREAS[i][1];
    return 'other';
  }
  function scrollPct() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    return h > 0 ? Math.min(100, Math.round(window.scrollY / h * 100)) : 100;
  }

  // ---- tag Google Play links so installs can be traced to a page + spot (shows in Play Console) ----
  function tagPlayLinks() {
    document.querySelectorAll('a[href*="play.google.com/store/apps/details"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        u.searchParams.set('referrer', 'utm_source=website&utm_medium=' + pageType + '&utm_campaign=' + areaOf(a));
        a.href = u.toString();
      } catch (e) {}
    });
  }

  // ---- clicks ----
  document.addEventListener('click', function (e) {
    var game = e.target.closest('[data-game]');
    if (game) { track('coming_soon_click', { game_name: game.getAttribute('data-game'), link_location: areaOf(game) }); return; }
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var where = areaOf(a);
    var text = (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (href.indexOf('play.google.com/store/apps/details') > -1) {
      track('play_store_click', { link_location: where, link_text: text, scroll_percent: scrollPct() });
    } else if (href.indexOf('play.google.com/store/apps/developer') > -1) {
      track('developer_page_click', { link_location: where, link_text: text });
    } else if (href.indexOf('mailto:') === 0) {
      track('email_click', { link_location: where });
    } else if (href.charAt(0) === '/' || href.charAt(0) === '#') {
      track('internal_click', { link_location: where, link_text: text, destination: href });
    }
  });

  // ---- which sections people actually scroll to (once per page view) ----
  function watchSections() {
    if (!('IntersectionObserver' in window)) return;
    var targets = [
      ['#games', 'games', 0.2], ['.featured-card', 'live_card', 0.5], ['.game-grid.soon', 'coming_soon', 0.3],
      ['#about', 'about', 0.3], ['#contact', 'bottom_cta', 0.4], ['.product-hero', 'next_up_hero', 0.5],
      ['.shots', 'screenshots', 0.3]
    ];
    var seen = {};
    targets.forEach(function (t) {
      var el = document.querySelector(t[0]);
      if (!el) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !seen[t[1]]) {
            seen[t[1]] = true;
            track('section_view', { section_name: t[1] });
            io.disconnect();
          }
        });
      }, { threshold: t[2] });
      io.observe(el);
    });
  }

  // ---- blog: scroll depth + "read" (enough time AND enough scroll) ----
  function watchBlog() {
    var article = document.querySelector('.article');
    if (pageType !== 'blog_post' || !article) return;
    var marks = [25, 50, 75, 100], fired = {}, maxPct = 0, active = 0, readFired = false, ticking = false;
    function articlePct() {
      var r = article.getBoundingClientRect();
      if (!r.height) return 0;
      var top = r.top + window.scrollY;
      return Math.max(0, Math.min(100, Math.round((window.scrollY + window.innerHeight - top) / r.height * 100)));
    }
    function checkRead() {
      if (!readFired && active >= BLOG_READ_SECONDS && maxPct >= BLOG_READ_SCROLL) {
        readFired = true;
        track('blog_read', { active_seconds: active, percent_scrolled: maxPct });
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        maxPct = Math.max(maxPct, articlePct());
        marks.forEach(function (m) {
          if (!fired[m] && maxPct >= m) { fired[m] = true; track('blog_scroll', { percent_scrolled: m }); }
        });
        checkRead();
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    setInterval(function () {                       // counts only while the tab is visible
      if (document.visibilityState === 'visible') { active++; checkRead(); }
    }, 1000);
    onScroll();
  }

  function init() { tagPlayLinks(); watchSections(); watchBlog(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
