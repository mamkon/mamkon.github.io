"use strict";

const el = (id) => document.getElementById(id);
const value = (n) => n.toFixed(2);
const dayFormat = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
const shortDay = (date) => dayFormat.format(new Date(date + "T00:00:00Z"));
const svg = (tag, attrs = {}, text = "") => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, attribute] of Object.entries(attrs)) node.setAttribute(key, attribute);
  if (text) node.textContent = text;
  return node;
};

function init(data) {
  const location = el("location");
  const threshold = el("threshold");
  const day = el("day");
  const chart = el("chart");
  const locations = Object.keys(data);
  locations.forEach((name) => location.add(new Option(name, name)));
  location.value = "Toronto";
  const rows = () => data[location.value];

  function showDay(index) {
    const [date, reference, prediction, low, high] = rows()[index];
    day.value = String(index);
    el("day-detail").textContent = shortDay(date) + " · CAMS reference " + value(reference)
      + " ppb · Estimate " + value(prediction) + " ppb · 95% prediction interval "
      + value(low) + " to " + value(high) + " ppb.";
  }

  function renderThreshold() {
    const cutoff = threshold.valueAsNumber;
    if (!Number.isInteger(cutoff) || cutoff < 20 || cutoff > 100) {
      for (const id of ["hits", "misses", "extra", "quiet"]) el(id).textContent = "—";
      el("threshold-detail").textContent = "Enter a whole-number cutoff from 20 to 100 ppb.";
      el("study-support").textContent = "";
      return;
    }
    const counts = { hits: 0, misses: 0, extra: 0, quiet: 0 };
    for (const [, reference, prediction] of rows()) {
      if (reference >= cutoff) counts[prediction >= cutoff ? "hits" : "misses"]++;
      else counts[prediction >= cutoff ? "extra" : "quiet"]++;
    }
    for (const [id, count] of Object.entries(counts)) el(id).textContent = count;
    const events = counts.hits + counts.misses;
    const locationsWithEvents = locations.filter((name) => data[name].some((row) => row[1] >= cutoff)).length;
    el("threshold-detail").textContent = events
      ? "The model flagged " + counts.hits + " of " + events + " CAMS reference event days. It generated "
        + (counts.hits + counts.extra) + " alerts in total."
      : "The CAMS reference had zero event days at this cutoff. Event detection rate is undefined.";
    el("study-support").textContent = locationsWithEvents + " of " + locations.length
      + " locations had at least one CAMS reference event day at this cutoff.";
  }

  function renderLocation() {
    const series = rows();
    const first = series[0][0], last = series.at(-1)[0];
    el("period").textContent = location.value + " · " + shortDay(first) + " to " + shortDay(last) + ", " + last.slice(0, 4);
    el("days").textContent = series.length;
    el("rmse").textContent = value(Math.sqrt(series.reduce((sum, row) => sum + (row[1] - row[2]) ** 2, 0) / series.length)) + " ppb";
    el("coverage").textContent = series.filter(([, ref, , low, high]) => ref >= low && ref <= high).length + " of " + series.length;
    day.replaceChildren(...series.map(([date], index) => new Option(shortDay(date), index)));

    const ozone = series.flatMap((row) => row.slice(1));
    const floor = Math.min(0, Math.floor(Math.min(...ozone) / 20) * 20);
    const ceiling = Math.ceil(Math.max(...ozone) / 20) * 20;
    const x = (i) => 52 + 679 * i / (series.length - 1);
    const y = (n) => 250 - 225 * (n - floor) / (ceiling - floor);
    const coord = (row, index, column) => x(index) + "," + y(row[column]);
    chart.replaceChildren();
    for (let tick = floor; tick <= ceiling; tick += 20) {
      chart.append(svg("line", { x1: 52, y1: y(tick), x2: 731, y2: y(tick), stroke: "#d2e0e8" }));
      chart.append(svg("text", { x: 44, y: y(tick) + 5, "text-anchor": "end", class: "axis" }, String(tick)));
    }
    chart.append(svg("text", { x: 44, y: 15, "text-anchor": "end", class: "axis" }, "ppb"));
    const lower = series.map((row, i) => coord(row, i, 3)).reverse();
    const upper = series.map((row, i) => coord(row, i, 4));
    chart.append(svg("polygon", { points: upper.concat(lower).join(" "), fill: "#badfda" }));
    for (const [column, colour] of [[1, "#173e72"], [2, "#08736a"]]) {
      chart.append(svg("polyline", {
        points: series.map((row, i) => coord(row, i, column)).join(" "),
        fill: "none", stroke: colour, "stroke-width": 3,
      }));
    }
    series.forEach(([date, reference], i) => {
      const point = svg("circle", {
        cx: x(i), cy: y(reference), r: 5, fill: "#173e72", class: "point",
        role: "button", tabindex: 0, "aria-label": "Inspect " + shortDay(date),
      });
      for (const event of ["pointerenter", "focus", "click"]) point.addEventListener(event, () => showDay(i));
      point.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          showDay(i);
        }
      });
      chart.append(point);
    });
    for (const i of [0, Math.floor(series.length / 2), series.length - 1]) {
      chart.append(svg("text", { x: x(i), y: 280, "text-anchor": "middle", class: "axis" }, shortDay(series[i][0])));
    }
    showDay(series.length - 1);
    renderThreshold();
  }

  location.addEventListener("change", renderLocation);
  threshold.addEventListener("input", renderThreshold);
  day.addEventListener("change", () => showDay(Number(day.value)));
  el("reset").addEventListener("click", () => {
    location.value = "Toronto";
    threshold.value = "60";
    renderLocation();
  });
  renderLocation();
  el("dashboard").hidden = false;
  el("status").hidden = true;
}

fetch("validation.json").then((response) => {
  if (!response.ok) throw new Error("Validation data request failed");
  return response.json();
}).then(init).catch(() => {
  el("status").textContent = "The research data could not load. Try refreshing the page.";
});
