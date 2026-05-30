/**
 * 抖音IP属地助手 - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const ipDisplay = document.getElementById('ipDisplay');
  const cachedItems = document.getElementById('cachedItems');
  const cachedList = document.getElementById('cachedList');
  const statusDot = document.getElementById('statusDot');

  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url?.includes('douyin.com')) {
      ipDisplay.textContent = '请打开抖音网页版';
      ipDisplay.className = 'value no-data';
      statusDot.style.background = '#ccc';
      return;
    }

    // 向content script请求IP数据
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getIpCache' });

    if (response && Object.keys(response).length > 0) {
      statusDot.style.background = '#4caf50';

      // 显示第一个IP信息（通常是当前视频的作者）
      const entries = Object.entries(response);
      const [uid, info] = entries[0];

      ipDisplay.innerHTML = `
        <div class="ip-display">
          <span class="ip-province">${info.province || '未知'}</span>
          ${info.city ? `<span class="ip-city">· ${info.city}</span>` : ''}
        </div>
      `;
      ipDisplay.className = 'value';

      // 显示缓存列表
      if (entries.length > 0) {
        cachedList.style.display = 'block';
        cachedItems.innerHTML = entries.slice(0, 10).map(([uid, info]) => `
          <div class="cached-item">
            <span class="name">${info.nickname || '未知用户'}</span>
            <span class="location">${info.detail || info.province || ''}</span>
          </div>
        `).join('');
      }
    } else {
      ipDisplay.textContent = '尚未获取到IP信息，请浏览视频页面';
      ipDisplay.className = 'value no-data';
      statusDot.style.background = '#ffc107';
    }
  } catch (err) {
    ipDisplay.textContent = '请刷新抖音页面后重试';
    ipDisplay.className = 'value no-data';
    statusDot.style.background = '#f44336';
    console.debug('Popup error:', err.message);
  }
});
