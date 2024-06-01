document.addEventListener('DOMContentLoaded', function () {
    const startDownloadButton = document.getElementById('startDownload');
    const statusLabel = document.getElementById('statusLabel');
    const progressBar = document.getElementById('progressBar');
    const hostTypeLabel = document.getElementById('hostType');
  
    let currentHostType = '';
    let downloadUrl = '';
    let isDownloading = false; // Флаг, указывающий, идет ли в данный момент процесс загрузки
  
    // Detect the active tab and determine the host type
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const url = new URL(tabs[0].url);
      if (url.host.includes('2ch.hk')) {
        currentHostType = '2ch';
        downloadUrl = tabs[0].url;
      } else if (url.host.includes('arhivach.top')) {
        currentHostType = 'arhivach';
        downloadUrl = tabs[0].url;
      } else {
        statusLabel.textContent = 'This extension only works on 2ch.hk or arhivach.top';
        startDownloadButton.disabled = true;
      }
      hostTypeLabel.textContent = `Host Type: ${currentHostType}`;
    });
  
    // Handle the start download button click
    startDownloadButton.addEventListener('click', async function () {
      if (!isDownloading) {
        // Если не выполняется загрузка, начинаем ее
        startDownload();
      } else {
        // Если идет загрузка, останавливаем ее
        stopDownload();
      }
    });
  
    // Функция начала загрузки
    function startDownload() {
      if (!downloadUrl) {
        statusLabel.textContent = 'No valid URL detected.';
        return;
      }
  
      // Изменяем текст кнопки на "Stop"
      startDownloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
        </svg> Stop Download`;
  
      // Устанавливаем флаг загрузки в true
      isDownloading = true;
  
      // Отправляем сообщение в background.js о начале загрузки
      chrome.runtime.sendMessage({ action: 'startDownload', url: downloadUrl, hostType: currentHostType }, function (response) {
        if (response.status === 'started') {
          statusLabel.textContent = 'Download started in the background.';
        } else {
          statusLabel.textContent = 'Failed to start download.';
        }
      });
  
      // Сохраняем данные о начале загрузки в локальное хранилище
      chrome.storage.local.set({ downloadUrl: downloadUrl, currentHostType: currentHostType });
    }
  
    // Функция остановки загрузки
    function stopDownload() {
      // Изменяем текст кнопки на "Start Download"
      startDownloadButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
        </svg> Start Download`;
  
      // Устанавливаем флаг загрузки в false
      isDownloading = false;
  
      // Отправляем сообщение в background.js о прекращении загрузки
      chrome.runtime.sendMessage({ action: 'stopDownload' }, function (response) {
        if (response.status === 'stopped') {
          statusLabel.textContent = 'Download stopped.';
        } else {
          statusLabel.textContent = 'Failed to stop download.';
        }
      });
  
      // Удаляем данные о загрузке из локального хранилища
      chrome.storage.local.remove(['downloadUrl', 'currentHostType']);
    }
  
    // Предупреждение при попытке закрытия расширения
    window.addEventListener('beforeunload', function (e) {
      chrome.storage.local.get(['downloadUrl'], function (result) {
        if (result.downloadUrl) {
          const confirmationMessage = 'You are currently downloading files. Are you sure you want to leave?';
          e.returnValue = confirmationMessage;
          return confirmationMessage;
        }
      });
    });
  });
  