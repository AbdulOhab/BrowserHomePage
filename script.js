// clock
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const timeString = `${hours}:${minutes}:${seconds}`;
  document.getElementById("clock").innerText = timeString;
}

function updateCalendar() {
  const now = new Date();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const year = now.getFullYear();
  const dateString = `${day}/${month}/${year}`;
  document.getElementById("calendar").innerText = dateString;
}

function updateClockAndCalendar() {
  updateClock();
  updateCalendar();
}

// Update every second
setInterval(updateClockAndCalendar, 1000);

// Initial update
updateClockAndCalendar();

// editor code
document.addEventListener("DOMContentLoaded", function () {
  const boldButton = document.getElementById("bold");
  const underlineButton = document.getElementById("underline");
  const italicButton = document.getElementById("italic");
  const strikethroughButton = document.getElementById("strikethrough");
  const justifyRightButton = document.getElementById("justifyRight");
  const justifyLeftButton = document.getElementById("justifyLeft");
  const justifyCenterButton = document.getElementById("justifyCenter");
  const justifyFullButton = document.getElementById("justifyFull");
  const unorderedListButton = document.getElementById("unorderedList");
  const increaseFontSizeButton = document.getElementById("increaseFontSize");
  const decreaseFontSizeButton = document.getElementById("decreaseFontSize");
  const copyButton = document.getElementById("copyBtn");
  const resetButton = document.getElementById("resetBtn");

  boldButton.addEventListener("click", function () {
    document.execCommand("bold", false, null);
  });

  italicButton.addEventListener("click", function () {
    document.execCommand("italic", false, null);
  });

  underlineButton.addEventListener("click", function () {
    document.execCommand("underline", false, null);
  });

  strikethroughButton.addEventListener("click", function () {
    document.execCommand("strikethrough", false, null);
  });

  justifyRightButton.addEventListener("click", function () {
    document.execCommand("justifyRight", false, null);
  });

  justifyLeftButton.addEventListener("click", function () {
    document.execCommand("justifyLeft", false, null);
  });

  justifyCenterButton.addEventListener("click", function () {
    document.execCommand("justifyCenter", false, null);
  });

  justifyFullButton.addEventListener("click", function () {
    document.execCommand("justifyFull", false, null);
  });

  unorderedListButton.addEventListener("click", function () {
    document.execCommand("insertUnorderedList", false, null);
  });

  increaseFontSizeButton.addEventListener("click", function () {
    const currentSize = parseInt(getComputedStyle(text).fontSize, 10);
    text.style.fontSize = currentSize + 1 + "px";
  });

  decreaseFontSizeButton.addEventListener("click", function () {
    const currentSize = parseInt(getComputedStyle(text).fontSize, 10);
    text.style.fontSize = currentSize - 1 + "px";
  });

  copyButton.addEventListener("click", function () {
    const allText = text.innerText;
    if (allText) {
      navigator.clipboard.writeText(allText);
    }
  });

  resetButton.addEventListener("click", function () {
    text.innerHTML = "";
  });
});
