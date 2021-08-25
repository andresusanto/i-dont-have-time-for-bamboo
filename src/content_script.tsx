import axios from "axios";

function readCSRF() {
  const j = document.createElement("script"),
    f = document.getElementsByTagName("script")[0];
  j.textContent = "document.body.setAttribute('data-csrf', CSRF_TOKEN)";
  f.parentNode && f.parentNode.insertBefore(j, f);
  f.parentNode && f.parentNode.removeChild(j);
}

function processDate(date: string, btn: HTMLButtonElement) {
  chrome.runtime.sendMessage({ type: "PROCESS_REQUEST" }, async (payload) => {
    if (payload.type === "NOT_READY") {
      btn.innerHTML = `AUTOFILL ${date}`;
      btn.disabled = false;
      alert("please fill in one entry manually to be used as template.");
      return;
    } else {
      const data = JSON.parse(payload.data);
      const url = payload.url;
      for (let i = 0; i < data.entries.length; i++) {
        data.entries[i].date = date;
      }
      try {
        const res = await axios.post(url, data, {
          headers: {
            "x-csrf-token": document.body.getAttribute("data-csrf"),
          },
        });
        console.log(res);
        btn.innerHTML =
          "Success!! You can fill other entries and refresh this page later.";
      } catch (e) {
        const body =
          e.response && e.response.data
            ? `\n\n${JSON.stringify(e.response.data)}`
            : "";
        btn.innerHTML = `ERROR! ${e.message}${body}`;
      }
    }
  });
}

window.addEventListener("load", function () {
  readCSRF();
  const data = document.getElementById("js-timesheet-data");
  if (!data) {
    alert("helo");
    return;
  }
  const payload = JSON.parse(data.textContent as string);
  const entries = document.getElementsByClassName(
    "TimesheetSlat__multipleContent"
  );
  const dailyDetails = Object.keys(payload.timesheet.dailyDetails);

  for (let i = 0; i < dailyDetails.length; i++) {
    const item = entries.item(i);
    if (!item) continue;

    const elm = document.createElement("button");
    elm.innerHTML = `AUTOFILL ${dailyDetails[i]}`;
    elm.type = "button";
    elm.style.marginTop = "35px";
    elm.onclick = () => {
      elm.disabled = true;
      elm.innerHTML = "Please wait ...";
      processDate(dailyDetails[i], elm);
    };
    item.appendChild(elm);
  }
});
