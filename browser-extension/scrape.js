// Helper function to extract query parameters.
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\\[\\]]/g, '\\$&');
  const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Function to start the scraping process.
// The second parameter, autoStart, indicates if this was auto-started via a query parameter.
function startScrape(url, autoStart = false) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Starting scrape for: ' + url;
  chrome.runtime.sendMessage({ action: 'scrape', url: url }, (response) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
    } else if (response.error) {
      if (response.error.indexOf("Database path is not set") !== -1) {
        statusDiv.innerHTML =
          'Error: ' + response.error + ' <a href="#" id="openOptions">Set Options</a>';
        document.getElementById("openOptions").addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
        });
      } else {
        statusDiv.textContent = 'Error: ' + response.error;
      }
    } else {
      statusDiv.textContent = 'Native host response: ' + JSON.stringify(response);
      // If auto-started and there is no error, close the window.
      if (autoStart) {
        window.close();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const scrapeBtn = document.getElementById('scrapeBtn');
  const statusDiv = document.getElementById('status');

  // Check for an optional ?url= query parameter.
  const queryUrl = getParameterByName('url');
  if (queryUrl) {
    urlInput.value = queryUrl;
    // Auto-start scrape and pass true as the second argument.
    startScrape(queryUrl, true);
  }

  scrapeBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (!url) {
      statusDiv.textContent = 'Please enter a URL.';
      return;
    }
    startScrape(url);
  });
});