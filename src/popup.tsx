import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const Popup = () => {
  const [entries, setEntries] = useState<null | string>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "CHECK_DATA" });
    chrome.runtime.onMessage.addListener(function (request) {
      if (request.type === "DATA_READY") {
        setEntries(request.data);
      }
    });
  }, []);

  return (
    <>
      <h1>{entries ? "READY" : "NOT READY"}</h1>
      {entries && "Will use the following data:"}
      <pre>{entries || "Please fill in one entry manually to start"}</pre>
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById("root")
);
