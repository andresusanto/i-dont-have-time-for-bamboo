let lastSavedEntry: string | null = null;
let lastSavedURL: string | null = null;
let csrfToken: string | null | undefined = null;

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (!csrfToken) {
      const csrfTokenHeader = details.requestHeaders!.find(x => x.name === 'X-CSRF-TOKEN')
      csrfToken = csrfTokenHeader?.value
    }
  },
  { urls: ["*://*.bamboohr.com/timesheet/clock/entries"] },
  ["requestHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!details.requestBody || !details.requestBody.raw) {
      console.log("request doesn't contain body");
      return;
    }
    const elm = details.requestBody.raw[0].bytes;
    if (!elm) {
      console.log("request doesn't contain data");
      return;
    }

    const enc = new TextDecoder("utf-8");
    const raw = enc.decode(elm);
    console.log("got entry:", raw);

    lastSavedEntry = raw;
    lastSavedURL = details.url;

    chrome.runtime.sendMessage({ type: "DATA_READY", data: raw });
  },
  { urls: ["*://*.bamboohr.com/timesheet/clock/entries"] },
  ["requestBody"]
);

chrome.runtime.onMessage.addListener(function (request, _, responder) {
  switch (request.type) {
    case "CHECK_DATA":
      chrome.runtime.sendMessage({ type: "DATA_READY", data: lastSavedEntry });
      break;
    case "PROCESS_REQUEST":
      if (!lastSavedEntry) {
        responder({ type: "NOT_READY" });
        return;
      }
      responder({ type: "OK", data: lastSavedEntry, url: lastSavedURL, csrfToken: csrfToken });
      break;
  }
});
