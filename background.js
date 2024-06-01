let downloading = false;
let currentDownloadUrl = '';
let currentHostType = '';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startDownload') {
    currentDownloadUrl = message.url;
    currentHostType = message.hostType;
    downloading = true;
    startDownloadProcess(currentDownloadUrl, currentHostType);
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopDownload') {
    downloading = false;
    currentDownloadUrl = '';
    currentHostType = '';
    sendResponse({ status: 'stopped' });
  }
  return true;
});

function startDownloadProcess(downloadUrl, hostType) {
  const FOLDER_NAME_FROM_LINK_PATTERN = /\/(\d+)(\.html)?(#.*)?\/?$/;
  const DVACH = 'https://2ch.hk';
  const ARCHIVACH = 'https://arhivach.top';
  const IMAGE_EXT = ['.jpg', '.png', '.gif'];
  const VIDEO_EXT = ['.mp4', '.webm'];

  let totalFiles = 0;
  let downloadedFiles = 0;
  const downloadedFilesSet = new Set();

  const match = downloadUrl.match(FOLDER_NAME_FROM_LINK_PATTERN);
  if (!match) {
    console.error(`Incorrect link: ${downloadUrl}`);
    return;
  }

  fetch(downloadUrl)
    .then(response => response.text())
    .then(async html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a')).filter(link =>
        IMAGE_EXT.some(ext => link.href.endsWith(ext)) || VIDEO_EXT.some(ext => link.href.endsWith(ext))
      );

      totalFiles = links.length;

      for (const link of links) {
        if (!downloading) break; // Check if downloading is stopped
        const fileUrl = (hostType === '2ch' ? DVACH : ARCHIVACH) + link.getAttribute('href');
        const fileName = fileUrl.split('/').pop();

        if (!downloadedFilesSet.has(fileName)) {
          downloadedFilesSet.add(fileName);

          chrome.downloads.download({
            url: fileUrl,
            filename: fileName
          }, () => {
            downloadedFiles++;
            console.log(`Downloaded ${downloadedFiles} of ${totalFiles} files.`);
          });

          // Add a delay of 1 second between each download
          await delay(1000);
        }
      }
    })
    .catch(error => {
      console.error(`Failed to download from ${downloadUrl}: ${error}`);
    });
}

// Utility function to delay execution
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
