import * as d3 from "npm:d3";

const transitionMs = 200;

const categories = [
  "1_engine_presence",
  "2_machinery-impact_presence",
  "3_non-machinery-impact_presence",
  "4_powered-saw_presence",
  "5_alert-signal_presence",
  "6_music_presence",
  "7_human-voice_presence",
  "8_dog_presence"
];

const cleanCategories = {
  "1_engine_presence": "engine",
  "2_machinery-impact_presence": "machinery",
  "3_non-machinery-impact_presence": "non-machinery impact",
  "4_powered-saw_presence": "powered saw",
  "5_alert-signal_presence": "alert signals",
  "6_music_presence": "music",
  "7_human-voice_presence": "human voice",
  "8_dog_presence": "dog barking or whining"
};

const myColors = [
  "#450840",
  "#403539",
  "#4b4d47",
  "#5a645a",
  "#6c7b72",
  "#80928b",
  "#97a9a7",
  "#afc1c5",
  "#c8d9e4"
];

// MD USAGE:
// ```js
// import {renderRadialPresenceChart} from "./components/chart2.js";
// const rows = await FileAttachment("data/data.csv").csv();
// display(renderRadialPresenceChart({data: rows, width}));
// ```
export const renderRadialPresenceChart = ({data, width = 928} = {}) => {
  if (!Array.isArray(data)) {
    throw new Error("This chart requires CSV rows as an array.");
  }

  const filteredData = data.filter((row) => +row.annotator_id === 0);

  const chartWidth = Math.max(360, width);
  const chartHeight = chartWidth;
  const margin = 5;
  const fixedInnerRadius = chartWidth / 6;
  const fixedOuterRadius = chartWidth / 2 - margin;

  const colorScheme = d3.scaleOrdinal().domain(categories).range(myColors);

  const container = d3.create("figure").attr("class", "radial-presence-chart");
  container.append("style").text(`
    .radial-presence-chart {
      margin: 5px 0;
      max-width: none;
      width: 100%;
      color: var(--theme-foreground);
    }
    .radial-presence-chart__legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      margin-bottom: 10px;
      width: 100%;
      gap: 2px 8px;
    }
    .radial-presence-chart__legend-item {
      display: flex;
      align-items: center;
      padding: 4px 6px;
      gap: 5px;
      font-family: Monda, sans-serif;
      font-size: 14px;
      cursor: pointer;
      border: 0;
      border-radius: 5px;
      transition: background 120ms ease;
    }
    .radial-presence-chart__legend-swatch {
      display: inline-block;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      flex: 0 0 auto;
    }
    .radial-presence-chart__svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .radial-presence-chart__center text {
      fill: var(--theme-foreground);
    }
    .radial-presence-chart__x-label,
    .radial-presence-chart__y-label {
      fill: var(--theme-foreground-muted, #666);
      font-size: 14px;
    }
  `);

  const legend = container.append("div").attr("class", "radial-presence-chart__legend");

  const rollups = d3.rollup(
    filteredData,
    (group) =>
      categories.reduce((acc, cat) => {
        acc[cat] = d3.sum(group, (row) => (String(row[cat]) === "1" ? 1 : 0));
        return acc;
      }, {}),
    (row) => +row.hour
  );

  const processedData = Array.from({length: 24}, (_, hour) => {
    const counts =
      rollups.get(hour) || categories.reduce((acc, cat) => ({...acc, [cat]: 0}), {});
    return {hour, ...counts};
  });

  const maxVal = d3.max(processedData, (d) => d3.max(categories, (cat) => d[cat])) || 1;

  const sortedCategories = [...categories].sort((a, b) => {
    const sumA = d3.sum(processedData, (d) => d[a]);
    const sumB = d3.sum(processedData, (d) => d[b]);
    return sumB - sumA;
  });

  const x = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);

  const opacityScale = d3
    .scaleLinear()
    .domain([0, Math.max(1, sortedCategories.length - 1)])
    .range([0.4, 0.8]);

  const svg = container
    .append("svg")
    .attr("class", "radial-presence-chart__svg")
    .attr("viewBox", [-chartWidth / 2, -chartHeight / 2, chartWidth, chartHeight])
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("role", "img")
    .attr("aria-label", "Radial chart of sound category presence by hour");

  const areaGroup = svg.append("g");
  const gridGroup = svg.append("g");

  const centerTextGroup = svg
    .append("g")
    .attr("class", "radial-presence-chart__center")
    .attr("pointer-events", "none")
    .attr("opacity", 0);

  const formatCount = d3.format(",d");

  function wrapCenterText(textString, totalCount) {
    centerTextGroup.selectAll("*").remove();

    const words = String(textString ?? "").split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = [];

    words.forEach((word) => {
      if (currentLine.join(" ").length + word.length > 14 && currentLine.length > 0) {
        lines.push(currentLine.join(" "));
        currentLine = [word];
      } else {
        currentLine.push(word);
      }
    });

    if (currentLine.length > 0) lines.push(currentLine.join(" "));

    const lineHeight = 14;
    const totalLinesCount = lines.length + 1;
    const startY = -((totalLinesCount - 1) * lineHeight) / 2;

    lines.forEach((lineText, index) => {
      centerTextGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", startY + index * lineHeight)
        .style("font-size", "16px")
        .style("font-weight", "700")
        .text(lineText);
    });

    centerTextGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", startY + lines.length * lineHeight + 4)
      .style("font-size", "14px")
      .style("font-weight", "400")
      .text(`${formatCount(totalCount)} instances`);
  }

  function handleHover(hoveredIndex, labelText, valueText) {
    wrapCenterText(labelText, valueText);

    centerTextGroup.interrupt().transition().duration(transitionMs).attr("opacity", 0.8);

    areaGroup
      .selectAll(".area-path")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", (_d, i) => (i === hoveredIndex ? 1 : opacityScale(i) * 0.25));

    legend
      .selectAll(".radial-presence-chart__legend-item")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .style("background", (_d, i) => (i === hoveredIndex ? "#EBEBEB" : "transparent"))
      .style("opacity", (_d, i) => (i === hoveredIndex ? 1 : 0.5));
  }

  function handleMouseLeave() {
    centerTextGroup.interrupt().transition().duration(transitionMs).attr("opacity", 0);

    areaGroup
      .selectAll(".area-path")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", (_d, i) => opacityScale(i));

    legend
      .selectAll(".radial-presence-chart__legend-item")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .style("background", "transparent")
      .style("opacity", 1);
  }

  sortedCategories.forEach((cat) => {
    const cleanName = cleanCategories[cat] ?? cat;

    const item = legend
      .append("div")
      .attr("class", "radial-presence-chart__legend-item")
      .on("mouseenter", () => {
        const hoveredIndex = sortedCategories.indexOf(cat);
        const totalSum = d3.sum(processedData, (row) => row[cat]);
        handleHover(hoveredIndex, cleanName, totalSum);
      })
      .on("mouseleave", () => {
        handleMouseLeave();
      });

    item
      .append("span")
      .attr("class", "radial-presence-chart__legend-swatch")
      .style("background-color", colorScheme(cat));

    item.append("span").text(cleanName);
  });

  const y = d3.scaleLinear().domain([0, maxVal]).range([fixedInnerRadius, fixedOuterRadius]);

  const area = d3
    .areaRadial()
    .curve(d3.curveLinearClosed)
    .angle((d) => x(d.hour))
    .innerRadius(() => y(0));

  areaGroup
    .selectAll("path")
    .data(sortedCategories)
    .join("path")
    .attr("class", "area-path")
    .attr("fill", colorScheme)
    .attr("opacity", (_d, i) => opacityScale(i))
    .attr("d", (cat) => {
      const customArea = area.outerRadius((d) => y(d[cat]));
      return customArea(processedData);
    })
    .on("mouseenter", (_event, cat) => {
      const hoveredIndex = sortedCategories.indexOf(cat);
      const cleanName = cleanCategories[cat] ?? cat;
      const totalSum = d3.sum(processedData, (row) => row[cat]);
      handleHover(hoveredIndex, cleanName, totalSum);
    })
    .on("mouseleave", () => {
      handleMouseLeave();
    });

  const hourTicks = d3.range(0, 24);
  const radialAxis = gridGroup.append("g").selectAll("g").data(hourTicks).join("g");

  radialAxis
    .append("path")
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.12)
    .attr(
      "d",
      (d) => `M ${d3.pointRadial(x(d), fixedInnerRadius)} L ${d3.pointRadial(x(d), fixedOuterRadius)}`
    );

  radialAxis
    .append("text")
    .attr("class", "radial-presence-chart__x-label")
    .attr("transform", (d) => {
      const angle = x(d) - Math.PI / 2;
      const radius = fixedInnerRadius - 15;
      return `translate(${Math.cos(angle) * radius}, ${Math.sin(angle) * radius})`;
    })
    .attr("text-anchor", (d) => {
      const angle = x(d);
      if (angle === 0 || angle === Math.PI) return "middle";
      return angle < Math.PI ? "end" : "start";
    })
    .attr("dy", "0.35em")
    .text((d) => `${d}`);

  const rings = gridGroup.append("g").attr("text-anchor", "middle").selectAll("g").data(y.ticks(4)).join("g");

  rings
    .append("circle")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.12)
    .attr("r", y);

  rings
    .append("text")
    .filter((d) => d !== 0)
    .attr("class", "radial-presence-chart__y-label")
    .attr("x", (d) => -y(d))
    .attr("dy", "0.35em")
    .attr("stroke", "var(--theme-background)")
    .attr("stroke-width", 5)
    .attr("paint-order", "stroke")
    .text((d) => d);

  return container.node();
};
