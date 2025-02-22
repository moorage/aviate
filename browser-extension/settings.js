document.addEventListener('DOMContentLoaded', () => {
  const dbPathInput = document.getElementById('dbPath');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load the saved dbPath from storage.
  chrome.storage.sync.get("dbPath", (data) => {
    if (data.dbPath) {
      dbPathInput.value = data.dbPath;
    }
  });

  saveBtn.addEventListener('click', () => {
    const dbPath = dbPathInput.value.trim();
    chrome.storage.sync.set({ dbPath: dbPath }, () => {
      statusDiv.textContent = 'Saved database path: ' + dbPath;
    });
  });
});