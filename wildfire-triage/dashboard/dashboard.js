"use strict";

const byId = (id) => document.getElementById(id);
const number = new Intl.NumberFormat("en-CA");
const exact = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });
const millions = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });
const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-CA", { month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(2000, index, 1))));
const svgNode = (tag, attributes = {}, content = "") => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (content) node.textContent = content;
  return node;
};

function areaLabel(value) {
  return value >= 1000000 ? millions.format(value / 1000000) + "M ha" : exact.format(value) + " ha";
}

function init(data) {
  const years = Object.keys(data.annual);
  const yearSelect = byId("year");
  const provinceSelect = byId("province");
  const annual = byId("annual");
  const map = byId("map");
  const regionNames = Object.keys(data.regions);
  years.forEach((year) => yearSelect.add(new Option(year, year)));
  regionNames.forEach((name) => provinceSelect.add(new Option(name, name)));

  function showYear(year) {
    const row = data.annual[year];
    const mean = row.mean === null ? "" : " · Five-year mean " + exact.format(row.mean) + " ha";
    const caveat = year === "2023" ? " · Pending National Forestry Database reconciliation" : "";
    byId("annual-detail").textContent = year + " · " + number.format(row.records)
      + " records · " + exact.format(row.area) + " ha" + mean + caveat;
  }

  const x = (year) => 48 + (Number(year) - 2000) * 24;
  const y = (area) => 206 - area / 100000;
  for (const value of [0, 5, 10, 15, 20]) {
    const lineY = y(value * 1000000);
    annual.append(svgNode("line", { x1: 48, x2: 648, y1: lineY, y2: lineY, class: "grid" }));
    annual.append(svgNode("text", { x: 40, y: lineY + 4, "text-anchor": "end", class: "axis" }, value + "M"));
  }
  for (const year of ["2000", "2005", "2010", "2015", "2020", "2025"]) {
    annual.append(svgNode("text", { x: x(year), y: 227, "text-anchor": "middle", class: "axis" }, year));
  }
  for (const [key, colour] of [["area", "#dc673d"], ["mean", "#e9a747"]]) {
    const points = years.filter((year) => data.annual[year][key] !== null)
      .map((year) => x(year) + "," + y(data.annual[year][key])).join(" ");
    annual.append(svgNode("polyline", { points, fill: "none", stroke: colour, "stroke-width": 3 }));
  }
  const points = new Map();
  for (const year of years) {
    const row = data.annual[year];
    const point = svgNode("circle", {
      cx: x(year), cy: y(row.area), r: year === "2023" ? 5 : 3.5,
      class: "annual-point", tabindex: 0, role: "button",
      "aria-label": year + ", " + exact.format(row.area) + " hectares. Show annual details",
    });
    point.append(svgNode("title", {}, year + " · " + exact.format(row.area) + " ha"));
    for (const event of ["pointerenter", "focus", "click"]) {
      point.addEventListener(event, () => showYear(year));
    }
    point.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        showYear(year);
      }
    });
    annual.append(point);
    points.set(year, point);
  }
  annual.append(svgNode("text", {
    x: x("2023") - 8, y: y(data.annual["2023"].area) - 10, "text-anchor": "end", class: "axis",
  }, "2023 peak"));

  const shapes = new Map();
  for (const name of regionNames) {
    if (!data.regions[name].path) continue;
    const path = svgNode("path", { d: data.regions[name].path, class: "region", "fill-rule": "evenodd" });
    const title = svgNode("title");
    path.append(title);
    path.addEventListener("click", () => {
      provinceSelect.value = name;
      renderMap();
    });
    shapes.set(name, { path, title });
    map.append(path);
  }
  const mappedTotals = (name) => {
    const values = data.regions[name].years;
    if (yearSelect.value) return values[yearSelect.value] || [0, 0];
    return Object.values(values).reduce(([n, ha], [records, area]) => [n + records, ha + area], [0, 0]);
  };

  function renderMap() {
    const selected = provinceSelect.value;
    const totals = new Map(regionNames.map((name) => [name, mappedTotals(name)]));
    const max = Math.max(1, ...Array.from(shapes.keys(), (name) => totals.get(name)[1]));
    for (const [name, { path, title }] of shapes) {
      const [records, area] = totals.get(name);
      const strength = Math.sqrt(area / max);
      path.setAttribute("fill", "hsl(15 58% " + (20 + strength * 35) + "%)");
      path.classList.toggle("selected", selected === name);
      path.classList.toggle("dimmed", Boolean(selected && selected !== name));
      title.textContent = name + " · " + number.format(records) + " mapped records · " + exact.format(area) + " ha";
    }
    const [count, area] = selected ? totals.get(selected) : Array.from(shapes.keys())
      .reduce(([n, ha], name) => [n + totals.get(name)[0], ha + totals.get(name)[1]], [0, 0]);
    const label = selected || "Mapped to a province or territory";
    byId("map-detail").textContent = label + " · " + number.format(count) + " records · " + exact.format(area) + " ha";
  }

  function renderYear() {
    const selected = yearSelect.value;
    const rows = selected ? [data.annual[selected]] : Object.values(data.annual);
    const records = rows.reduce((sum, row) => sum + row.records, 0);
    const area = rows.reduce((sum, row) => sum + row.area, 0);
    const months = monthNames.map((_, index) => rows.reduce((sum, row) => sum + row.months[index], 0));
    const unknown = records - months.reduce((sum, count) => sum + count, 0);
    const max = Math.max(...months);
    byId("records").textContent = number.format(records);
    byId("area").textContent = areaLabel(area);
    byId("peak").textContent = max ? monthNames[months.indexOf(max)] : "No known month";
    byId("month-note").textContent = number.format(unknown) + " records with unknown month are excluded from the bars.";
    byId("months").replaceChildren(...months.map((count, index) => {
      const row = document.createElement("li");
      const label = document.createElement("abbr");
      label.textContent = monthNames[index].slice(0, 3);
      label.title = monthNames[index];
      const track = document.createElement("span");
      track.className = "track";
      track.setAttribute("aria-hidden", "true");
      const bar = document.createElement("i");
      bar.style.width = (max ? count / max * 100 : 0) + "%";
      track.append(bar);
      const value = document.createElement("strong");
      value.textContent = number.format(count);
      row.append(label, track, value);
      return row;
    }));
    for (const [year, point] of points) {
      point.setAttribute("r", year === selected ? 7 : year === "2023" ? 5 : 3.5);
    }
    showYear(selected || "2023");
    renderMap();
  }

  yearSelect.addEventListener("change", renderYear);
  provinceSelect.addEventListener("change", renderMap);
  byId("reset").addEventListener("click", () => {
    yearSelect.value = "";
    provinceSelect.value = "";
    renderYear();
  });
  byId("dashboard").hidden = false;
  const bounds = map.getBBox();
  map.setAttribute("viewBox", [bounds.x - 8, bounds.y - 8, bounds.width + 16, bounds.height + 16].join(" "));
  renderYear();
  byId("status").hidden = true;
}

fetch("summary.json")
  .then((response) => {
    if (!response.ok) throw new Error("Summary data request failed");
    return response.json();
  })
  .then(init)
  .catch(() => {
    byId("dashboard").hidden = true;
    byId("status").textContent = "The dashboard could not load. Try refreshing the page.";
  });
