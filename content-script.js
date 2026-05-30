/**
 * 抖音IP属地助手 - 位置定位版
 */
(function () {
  'use strict';

  var CACHE = {};
  var FETCHING = {};
  var LAST_UID = '';
  var FLT = null;

  function log() {
    var a = ['[IP助手]']; for (var i=0; i<arguments.length; i++) a.push(arguments[i]);
    console.log.apply(console, a);
  }

  var TIME_RE = /(刚刚|\d+分钟前|\d+小时前|\d+天前|\d+-\d+-\d+|\d+月\d+日|\d+年前)/;

  function showFloat(ip) {
    if (!document.body) return;
    if (!FLT) {
      FLT = document.createElement('div');
      FLT.id = 'dy-ip-float';
      FLT.style.cssText = 'position:fixed;z-index:2147483647;padding:4px 12px;font-size:13px;font-weight:500;color:#fff;border-radius:14px;cursor:default;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.2);transition:all 0.3s;white-space:nowrap';
      document.body.appendChild(FLT);
    }

    // 找发布时间元素来定位
    var left = 20, top = 120;
    var els = document.querySelectorAll('span, div, p, a');
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || '').trim();
      if (t.length < 40 && t.indexOf('·') === 0 && TIME_RE.test(t)) {
        var r = els[i].getBoundingClientRect();
        if (r.top > 0 && r.top < window.innerHeight && r.x < window.innerWidth * 0.6) {
          left = r.right + 8;
          top = r.top + (r.height - 26) / 2;
          break;
        }
      }
    }

    FLT.style.left = left + 'px';
    FLT.style.top = top + 'px';

    if (ip) { FLT.innerHTML = '🌍 ' + ip; FLT.style.background = 'rgba(106,90,205,0.9)'; }
    else { FLT.innerHTML = '🌍 获取中...'; FLT.style.background = 'rgba(80,80,80,0.85)'; }
  }

  // ====== 纯位置定位：右侧面板中第一个可见链接 ======
  function findUid() {
    var links = document.querySelectorAll('a[href*="/user/"]');
    var best = null, bestY = Infinity, right = 0;
    for (var i = 0; i < links.length; i++) {
      if (!links[i].offsetParent) continue;
      var m = links[i].getAttribute('href').match(/\/user\/([^/?]+)/);
      if (!m || !m[1] || m[1].length < 10) continue;
      var r = links[i].getBoundingClientRect();
      if (r.x > window.innerWidth * 0.5 && r.top > 0 && r.top < window.innerHeight) {
        right++;
        if (r.top < bestY) { bestY = r.top; best = m[1]; }
      }
    }
    if (!best) {
      for (var i = 0; i < links.length; i++) {
        if (!links[i].offsetParent) continue;
        var m = links[i].getAttribute('href').match(/\/user\/([^/?]+)/);
        if (!m || !m[1] || m[1].length < 10) continue;
        if (links[i].getBoundingClientRect().x > window.innerWidth * 0.5) { best = m[1]; break; }
      }
    }
    if (!best) {
      for (var i = 0; i < links.length; i++) {
        if (!links[i].offsetParent) continue;
        var m = links[i].getAttribute('href').match(/\/user\/([^/?]+)/);
        if (m && m[1] && m[1].length > 10) { best = m[1]; break; }
      }
    }
    log('uid: right=' + right + (best ? ' → ' + best.substring(0,10) : ' → null'));
    return best;
  }

  // ====== 爬主页 ======
  function fetchProfile(uid) {
    if (!uid || FETCHING[uid]) return;
    FETCHING[uid] = true;
    var x = new XMLHttpRequest();
    x.open('GET', 'https://www.douyin.com/user/' + uid, true);
    x.withCredentials = true;
    x.onload = function() {
      FETCHING[uid] = false;
      if (x.status !== 200) return;
      try {
        var ip = findIp(x.responseText);
        if (ip) { CACHE[uid] = ip; showFloat(ip); log('✅', ip); }
      } catch(e) {}
    };
    x.onerror = function() { FETCHING[uid] = false; };
    x.send();
  }

  function findIp(html) {
    var r = html.match(/<script[^>]*id="RENDER_DATA"[^>]*>([\s\S]*?)<\/script>/);
    if (r) { try { var d = JSON.parse(decodeURIComponent(r[1])); var ip = scan(d, 0); if (ip) return ip; } catch(e) {} }
    var m = html.match(/IP属地[：:]\s*([^\s<",{}\[\]\\]+)/);
    if (m && m[1] && m[1].length < 20) return m[1];
    return null;
  }

  function scan(o, depth) {
    if (!o || typeof o !== 'object' || depth > 15) return null;
    if (Array.isArray(o)) { for (var i=0;i<o.length;i++) { var r=scan(o[i],depth+1); if(r) return r; } return null; }
    if (typeof o.ip_location === 'string' && o.ip_location.indexOf('IP属地') !== -1) return o.ip_location.replace(/^IP属地[：:]\s*/, '').trim();
    var k = Object.keys(o);
    for (var i=0;i<k.length;i++) { if (k[i]==='_location'||k[i]==='app') continue; if (o[k[i]]&&typeof o[k[i]]==='object') { var r=scan(o[k[i]],depth+1); if(r) return r; } }
    return null;
  }

  // ====== 主循环 ======
  function tick() {
    if (!document.body) return;
    showFloat(null);
    var uid = findUid();
    if (!uid) return;
    if (uid !== LAST_UID) {
      log('切换:', LAST_UID.substring(0,8) + '→' + uid.substring(0,8));
      LAST_UID = uid;
      CACHE[uid] ? showFloat(CACHE[uid]) : fetchProfile(uid);
    } else if (CACHE[uid]) {
      showFloat(CACHE[uid]);
    }
  }

  chrome.runtime.onMessage.addListener(function(m,s,r) { if (m.action==='getIpCache') { r(CACHE); return true; } });

  log('🚀 位置版启动');
  setInterval(tick, 2000);
  if (document.body) tick();
  else document.addEventListener('DOMContentLoaded', tick);
  setTimeout(tick, 1000);
})();
