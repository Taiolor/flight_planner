const fs = require("fs");
const content = fs.readFileSync("client/src/pages/CalendarView.tsx", "utf8");
const lines = content.split("\n");

let start = -1;
let end = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("function FlightPopup({")) {
    start = i;
  }
  if (start !== -1 && lines[i] === "}") {
    end = i;
    break;
  }
}

console.log(`FlightPopup is ${end - start} lines long`);
