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
  years.forEach((year) => { yearSelect.add(new Option(year, year)); byId("geography-year").add(new Option(year, year)); });
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
    const path = svgNode("path", { d: data.regions[name].path, class: "region", "fill-rule": "evenodd", tabindex: 0, role: "button", "aria-label": "Select " + name });
    const title = svgNode("title");
    path.append(title);
    path.addEventListener("click", () => {
      provinceSelect.value = name;
      renderMap();
    });
    path.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) { event.preventDefault(); path.dispatchEvent(new Event("click")); }
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
    const ranking = [...totals].sort((a, b) => b[1][1] - a[1][1]);
    renderBars("regional-bars", ranking.map(([name, values]) => [name, values[1], areaLabel(values[1])]), selected);
    const label = selected || "Mapped to a province or territory";
    byId("map-detail").textContent = label + " · " + number.format(count) + " records · " + exact.format(area) + " ha";
  }

  function renderYear() {
    const selected = yearSelect.value;
    byId("geography-year").value = selected;
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

  byId("geography-year").addEventListener("change", () => { yearSelect.value = byId("geography-year").value; renderYear(); });
  yearSelect.addEventListener("change", renderYear);
  provinceSelect.addEventListener("change", renderMap);
  byId("reset").addEventListener("click", () => {
    yearSelect.value = "";
    provinceSelect.value = "";
    renderYear();
  });
  byId("dashboard").hidden = false;
  byId("geography").hidden = false;
  const bounds = map.getBBox();
  map.setAttribute("viewBox", [bounds.x - 8, bounds.y - 8, bounds.width + 16, bounds.height + 16].join(" "));
  renderYear();
  byId("status").hidden = true;
  setupViews();
}

function renderBars(id, rows, selected = "") {
  const max = Math.max(1, ...rows.map((row) => row[1]));
  byId(id).replaceChildren(...rows.map(([label, value, display]) => {
    const item = document.createElement("li");
    if (label === selected) item.className = "highlight";
    const name = document.createElement("span"); name.textContent = label;
    const track = document.createElement("span"); track.className = "track";
    const bar = document.createElement("i"); bar.style.width = value / max * 100 + "%";
    track.append(bar);
    const count = document.createElement("strong"); count.textContent = display;
    item.append(name, track, count); return item;
  }));
}
function setupViews() {
  const update = () => {
    const view = ["overview", "geography", "triage"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview";
    document.querySelectorAll(".view").forEach((el) => { el.hidden = el.id !== view; });
    document.querySelectorAll("[data-view]").forEach((el) => {
      if (el.dataset.view === view) el.setAttribute("aria-current", "page"); else el.removeAttribute("aria-current");
    });
  };
  window.addEventListener("hashchange", update); update();
}
const percent = (value) => value === null ? "N/A" : (value * 100).toFixed(1) + "%";
function table(id, headings, rows, caption) {
  const t = document.createElement("table");
  const c = t.createCaption(); c.textContent = caption;
  const head = t.createTHead().insertRow();
  headings.forEach((label) => { const th = document.createElement("th"); th.scope = "col"; th.textContent = label; head.append(th); });
  const body = t.createTBody();
  rows.forEach((values) => { const tr = body.insertRow(); values.forEach((value, i) => {
    const cell = document.createElement(i === 0 ? "th" : "td"); if (i === 0) cell.scope = "row";
    cell.textContent = value; tr.append(cell);
  }); });
  byId(id).replaceChildren(t);
}
function initIntelligence([policies, yearly, kpis, agencies, concentration]) {
  const kpi = kpis[0];
  byId("large-count").textContent = number.format(kpi.large_fire_records);
  byId("large-share").textContent = percent(kpi.large_fire_share) + " of 168,276 study records; fixed across year filters";
  renderBars("concentration", concentration.filter((r) => r.reporting_agency === "ALL").map((r) => ["Top " + r.top_pct + "%", r.area_share, percent(r.area_share)]));
  renderBars("agency-bars", agencies.sort((a,b) => b.large_fire_share - a.large_fire_share).map((r) => [r.reporting_agency, r.large_fire_share, percent(r.large_fire_share)]));
  const models = policies.filter((r) => !["Alert every record", "Alert no records"].includes(r.policy));
  const select = byId("policy");
  models.forEach((r) => select.add(new Option(r.policy, r.policy)));
  select.value = "Miss cost 10×";
  const plot = byId("tradeoff");
  for (const v of [0, .25, .5, .75, 1]) {
    const y = 250 - v * 215, x = 60 + v * 490;
    plot.append(svgNode("line", {x1:60, x2:550, y1:y, y2:y, class:"grid"}));
    plot.append(svgNode("text", {x:50,y:y+4,"text-anchor":"end",class:"axis"}, percent(v)));
    plot.append(svgNode("text", {x,y:272,"text-anchor":"middle",class:"axis"}, percent(v)));
  }
  plot.append(svgNode("text", {x:300,y:295,"text-anchor":"middle",class:"axis"}, "Records sent for review"));
  const dots = [];
  models.forEach((r, i) => {
    const dot = svgNode("circle", {cx:60+r.alert_share*490,cy:250-r.recall*215,r:7,tabindex:0,role:"button",class:"annual-point","aria-label":r.policy+": recall "+percent(r.recall)+", review "+percent(r.alert_share)});
    dot.append(svgNode("title", {}, r.policy+" · recall "+percent(r.recall)+" · review "+percent(r.alert_share)));
    const choose = () => { select.value = r.policy; render(); };
    dot.addEventListener("click", choose);
    dot.addEventListener("keydown", (e) => { if (["Enter", " "].includes(e.key)) { e.preventDefault(); choose(); } });
    plot.append(dot); dots.push([dot, r.policy]);
    plot.append(svgNode("text", {x:70+r.alert_share*490,y:250-r.recall*215+(i%2 ? 16 : -9),class:"axis"}, r.policy.replace("Miss cost ","")));
  });
  const columns = ["Policy", "Recall", "Precision", "Review rate", "False positives", "False negatives"];
  table("policy-table", columns, models.map((r) => [r.policy, percent(r.recall), percent(r.precision), percent(r.alert_share), number.format(r.false_positives), number.format(r.false_negatives)]), "Same 18,814 held-out records for every policy");
  table("year-table", ["Year", "Records", ...columns.slice(1)], yearly.map((r) => [r.year, number.format(r.records), percent(r.recall), percent(r.precision), percent(r.alert_share), number.format(r.false_positives), number.format(r.false_negatives)]), "Original 10× policy, held-out annual results");
  function render() {
    const r = models.find((row) => row.policy === select.value);
    const cards = [["Large-fire recall", percent(r.recall)], ["Alert precision", percent(r.precision)], ["Review rate", percent(r.alert_share)], ["Missed large fires", number.format(r.false_negatives)]];
    byId("triage-metrics").replaceChildren(...cards.map(([label,value]) => {
      const div = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = label; dd.textContent = value; div.append(dt,dd); return div;
    }));
    byId("policy-detail").textContent = "Score threshold: "+r.threshold+" · "+number.format(r.true_positives)+" of 2,027 large fires flagged · "+number.format(r.true_positives+r.false_positives)+" reviews · "+number.format(r.false_positives)+" false positives.";
    table("confusion", ["Observed final size", "Alert", "No alert"], [["≥200 ha", number.format(r.true_positives), number.format(r.false_negatives)], ["<200 ha", number.format(r.false_positives), number.format(r.true_negatives)]], r.policy);
    dots.forEach(([dot,name]) => { dot.setAttribute("r", name === r.policy ? 10 : 7); dot.setAttribute("aria-pressed", String(name === r.policy)); });
  }
  select.addEventListener("change",render); render();
}
async function csv(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("CSV request failed");
  const [header, ...lines] = (await response.text()).trim().split(/\r?\n/);
  const names = header.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, i) => [names[i], value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : value])));
}
Promise.all([
  fetch("summary.json").then((r) => { if (!r.ok) throw new Error("Summary request failed"); return r.json(); }),
  Promise.all(["../test_policies.csv", "../test_by_year.csv", "data/reference_kpis.csv", "data/vw_agency.csv", "data/vw_concentration.csv"].map(csv)),
]).then(([data, intelligence]) => { initIntelligence(intelligence); init(data); }).catch(() => {
  byId("dashboard").hidden = true;
  byId("status").hidden = false;
  byId("status").textContent = "The dashboard could not load. Try refreshing the page.";
});
