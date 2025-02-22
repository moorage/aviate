// Global variable to hold the native messaging port.
let nativePort = null;

/**
 * Initialize the native messaging port if it isn't open.
 */
function initNativePort() {
  if (!nativePort) {
    nativePort = chrome.runtime.connectNative("org.aviate.aviate_native");
    nativePort.onMessage.addListener((msg) => {
      console.log("Received message from native host:", msg);
      // Global messages can be handled or logged here.
    });
    nativePort.onDisconnect.addListener(() => {
      console.error("Native messaging port disconnected");
      nativePort = null;
    });
  }
}

// Listen for messages from other parts of the extension.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "scrape") {
    // First, retrieve the saved dbPath.
    chrome.storage.sync.get("dbPath", (data) => {
      const dbPath = data.dbPath ? data.dbPath.trim() : "";
      if (!dbPath) {
        sendResponse({ error: "Database path is not set. Please configure it in the options page." });
        return;
      }
      
      const url = msg.url;
      // Open the URL in a new inactive tab.
      chrome.tabs.create({ url: url, active: false }, (tab) => {
        const tabId = tab.id;
        // Listen for tab updates until the page is fully loaded.
        const listener = (updatedTabId, changeInfo, updatedTab) => {
          if (updatedTabId === tabId && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            // Inject a script to extract the full HTML of the page.
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => document.documentElement.outerHTML
            }, (results) => {
              if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
              } else {
                // Close the tab after scraping.
                chrome.tabs.remove(tabId);
                // Prepare the message for the native host.
                const nativeMsg = { url: url, html: results[0].result, db_path: dbPath };
                // Ensure we have an active native messaging port.
                initNativePort();
                if (nativePort) {
                  // Use a one-time listener to catch the native host's reply.
                  const responseHandler = (response) => {
                    nativePort.onMessage.removeListener(responseHandler);
                    sendResponse(response);
                  };
                  nativePort.onMessage.addListener(responseHandler);
                  nativePort.postMessage(nativeMsg);
                } else {
                  sendResponse({ error: "Native port not available" });
                }
              }
            });
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
    });
    // Return true to indicate that the response will be sent asynchronously.
    return true;
  }
});