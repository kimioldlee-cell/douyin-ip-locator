/**
 * IP Helper - fast iframe mode
 */
(function () {
  'use strict';
  var CACHE={},FETCHING={},LAST_UID='',FLT=null,IFR=null;
  function log(){var a=['[IP]'];for(var i=0;i<arguments.length;i++)a.push(arguments[i]);console.log.apply(console,a);}
  function ef(){if(!document.body)return;if(!FLT){FLT=document.createElement('div');FLT.id='dy-ip-f';FLT.style.cssText='position:fixed;z-index:2147483647;padding:4px 12px;font-size:13px;font-weight:500;color:#fff;border-radius:14px;font-family:sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.2);white-space:nowrap';document.body.appendChild(FLT)}}
  function reEscape(s){return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,'\\$&')}
  var T=new RegExp(reEscape('刚刚')+'|\\d+'+reEscape('分钟前')+'|\\d+'+reEscape('小时前')+'|\\d+'+reEscape('天前')+'|\\d+-\\d+-\\d+|\\d+'+reEscape('月')+'\\d+'+reEscape('日')+'|\\d+'+reEscape('年前'));
  function sf(ip){ef();if(!FLT)return;var l=20,t=120;var es=document.querySelectorAll('span,div,p,a');for(var i=0;i<es.length;i++){var txt=(es[i].textContent||'').trim();if(txt.length<40&&txt.indexOf('\xb7')===0&&T.test(txt)){var r=es[i].getBoundingClientRect();if(r.top>0&&r.top<window.innerHeight&&r.x<window.innerWidth*0.6){l=r.right+8;t=r.top+(r.height-26)/2;break}}}FLT.style.left=l+'px';FLT.style.top=t+'px';FLT.style.display='';if(ip){FLT.innerHTML='IP: '+ip;FLT.style.background='rgba(106,90,205,0.9)'}else{FLT.innerHTML='IP: ...';FLT.style.background='rgba(80,80,80,0.85)'}}
  function fu(){var ls=document.querySelectorAll('a[href*="/user/"]');var b=null,by=Infinity;for(var i=0;i<ls.length;i++){if(!ls[i].offsetParent)continue;var m=ls[i].getAttribute('href').match(/\/user\/([^/?]+)/);if(!m||!m[1]||m[1].length<10)continue;var r=ls[i].getBoundingClientRect();if(r.x>window.innerWidth*0.5&&r.top>0&&r.top<window.innerHeight){if(r.top<by){by=r.top;b=m[1]}}}if(!b)for(var i=0;i<ls.length;i++){if(!ls[i].offsetParent)continue;var m=ls[i].getAttribute('href').match(/\/user\/([^/?]+)/);if(m&&m[1]&&m[1].length>10&&ls[i].getBoundingClientRect().x>window.innerWidth*0.5){b=m[1];break}}if(!b)for(var i=0;i<ls.length;i++){if(!ls[i].offsetParent)continue;var m=ls[i].getAttribute('href').match(/\/user\/([^/?]+)/);if(m&&m[1]&&m[1].length>10){b=m[1];break}}return b}
  function ensureIframe(){if(IFR)return;IFR=document.createElement('iframe');IFR.id='dy-ip-iframe';IFR.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;opacity:0;pointer-events:none';document.body.appendChild(IFR)}
  function fbi(uid){if(!uid||FETCHING[uid])return;FETCHING[uid]=true;ensureIframe();
    var done=false,att=0;function cl(){FETCHING[uid]=false}
    function p(){if(done)return;att++;try{var doc=IFR.contentDocument||(IFR.contentWindow&&IFR.contentWindow.document);if(!doc||!doc.body){if(att<60){setTimeout(p,100);return}cl();return}var txt=doc.body.innerText||'';var m=txt.match(/IP\u5c5e\u5730[\uff1a:]\s*([^\s\n]{2,20})/);if(m&&m[1]){done=true;CACHE[uid]=m[1];sf(m[1]);log('OK',m[1]);cl();return}if(uid!==LAST_UID){cl();return}if(att>=60)cl();else setTimeout(p,100)}catch(e){if(att>=60)cl();else setTimeout(p,100)}}
    IFR.onload=function(){setTimeout(p,200)};
    if(IFR.src.indexOf(uid)!==-1){IFR.onload()}else{IFR.src='https://www.douyin.com/user/'+uid}}
  function sip(o,depth){if(!o||typeof o!=='object'||depth>15)return null;if(Array.isArray(o)){for(var i=0;i<o.length;i++){var r=sip(o[i],depth+1);if(r)return r}return null}if(typeof o.ip_location==='string'&&o.ip_location.indexOf('IP')!==-1)return o.ip_location.replace(/^IP.*?[:：]\s*/,'').trim();var k=Object.keys(o);for(var i=0;i<k.length;i++){if(k[i]==='_location'||k[i]==='app')continue;if(o[k[i]]&&typeof o[k[i]]==='object'){var r=sip(o[k[i]],depth+1);if(r)return r}}return null}
  function check(){ef();if(!FLT)return;var uid=fu();if(!uid){sf(null);return}if(uid!==LAST_UID){log('sw',(LAST_UID||'(e)').substring(0,8),'->',uid.substring(0,8));LAST_UID=uid;CACHE[uid]?sf(CACHE[uid]):fbi(uid)}else if(CACHE[uid])sf(CACHE[uid])}
  chrome.runtime.onMessage.addListener(function(m,s,r){if(m.action==='getIpCache'){r(CACHE);return true}});
  new MutationObserver(function(){if(FLT){var uid=fu();if(uid&&uid!==LAST_UID)check()}}).observe(document.documentElement,{childList:true,subtree:true});
  log('fast iframe');setInterval(check,500);if(document.body)check();else document.addEventListener('DOMContentLoaded',check);setTimeout(check,300);setTimeout(check,800);
})();
