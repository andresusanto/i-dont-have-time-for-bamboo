import axios from "axios";

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
            "x-csrf-token": payload.csrfToken,
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
  const data = document.getElementById("js-timesheet-data");
  if (!data) {
    alert("helo");
    return;
  }
  const payload = JSON.parse(data.textContent as string);

  // Remove all timesheet item elements that are before "Pay Period Begins", otherwise buttons have wrong dates as the payload data doesn't include previous pay period elements
  let entriesFormContainer = document.getElementsByClassName("TimesheetEntries").item(0)!.firstElementChild as Element;
  if (entriesFormContainer.children.length === 0) {
    console.error('no timesheet entry elements were found, Bamboo devs screwed us?');
    return;
  }

  let entries = Array.from(document.getElementsByClassName(
    "TimesheetSlat__multipleContent"
  ));
  const payPeriodBeginsIndex = Array.from(entriesFormContainer.children).findIndex(x => x.getAttribute("data-text") === "Pay Period Begins");
  if (payPeriodBeginsIndex > -1) {
    entries = entries.slice(payPeriodBeginsIndex);
  }

  const dailyDetails = Object.keys(payload.timesheet.dailyDetails);

  for (let i = 0; i < dailyDetails.length; i++) {
    const item = entries[i];
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
