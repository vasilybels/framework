import * as d3 from "npm:d3";
import {
  buildRadialPresenceData,
  filterUniversalTruthRows,
  SONYC_COARSE_CATEGORIES,
  SONYC_COARSE_LABELS
} from "../utils/sonycData.js";

const transitionMs = 100;
const defaultOpacity = 0.5;
const areaStrokeWidth = 0.5;
const areaStrokeWidthHover = 0;
const lightFillLuminanceThreshold = 0.6;
const radialChartMaxWidth = 700;

let selectedCategory = null;

const myColors = ['#450840', '#541535', '#5b2531', '#603431', '#634231', '#645033', '#645f35', '#626d39', '#5e7b3d'];

// MD USAGE:
// ```js
// import {renderRadialPresenceChart} from "./components/chart2.js";
// import {buildRadialPresenceData, filterUniversalTruthRows} from "../utils/sonycData.js";
// const rows = await FileAttachment("data/data.csv").csv();
// const radial = buildRadialPresenceData(filterUniversalTruthRows(rows));
// display(renderRadialPresenceChart({data: radial, width}));
// ```
export const renderRadialPresenceChart = ({
  data,
  width = 928,
  heading = "City of Commuters",
  subheading = "How often the sounds from each coarse-grained category were recorded, by time of day.",
  footnote = "Source: Sounds of New York City Urban Sound Tagging (SONYC-UST) dataset, version 2.4."
} = {}) => {
  let radialData;
  if (Array.isArray(data)) {
    radialData = buildRadialPresenceData(filterUniversalTruthRows(data));
  } else if (data && Array.isArray(data.processedData)) {
    radialData = data;
  } else {
    throw new Error("This chart requires either CSV rows or preprocessed radial data.");
  }

  const {processedData, maxVal, sortedCategories, labelsByCategory = SONYC_COARSE_LABELS} = radialData;
  const displayCategoryName = (name) => String(name ?? "");

  const chartWidth = Math.min(radialChartMaxWidth, Math.max(360, width));
  const chartHeight = chartWidth;
  const margin = 5;
  const fixedInnerRadius = chartWidth / 6;
  const fixedOuterRadius = chartWidth / 2 - margin;

  const colorScheme = d3.scaleOrdinal().domain(SONYC_COARSE_CATEGORIES).range(myColors);

  const container = d3.create("figure")
    .attr("class", "radial-presence-chart")
    .style("--radial-chart-max-width", `${chartWidth}px`);

  const header = container.append("header").attr("class", "chart-header");
  header.append("h3").text(heading);
  header.append("p").text(subheading);

  const legend = container.append("div").attr("class", "radial-presence-chart__legend");

  const x = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);

  const luminanceOf = (color) => (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;

  const strokeForCategory = (cat) => {
    const base = d3.color(colorScheme(cat));
    return base ? base.darker(0.45).toString() : "rgba(0,0,0,0.35)";
  };

  const textColorForCategory = (cat) => {
    const base = d3.color(colorScheme(cat));
    if (!base) return "#111";
    return luminanceOf(base) > lightFillLuminanceThreshold ? "#111" : "#f8f9fa";
  };

  const svg = container
    .append("svg")
    .attr("class", "radial-presence-chart__svg")
    .attr("viewBox", [-chartWidth / 2, -chartHeight / 2, chartWidth, chartHeight])
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("role", "img")
    .attr("aria-label", "Radial chart of sound category presence by hour");

  const tooltip = container.append("div").attr("class", "radial-presence-chart__tooltip");

  const areaGroup = svg.append("g");
  const gridGroup = svg.append("g");

  const centerTextGroup = svg
    .append("g")
    .attr("class", "radial-presence-chart__center")
    .attr("pointer-events", "none")
    .attr("opacity", 0);

  const formatCount = d3.format(",d");

  const hourFromPointer = (event) => {
    const [pointerX, pointerY] = d3.pointer(event, svg.node());
    const angle = (Math.atan2(pointerY, pointerX) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
    return Math.round(x.invert(angle)) % 24;
  };
  const tooltipText = (hour, count) => {
    const row = (label, value) => `<div class="tooltip-row"><span class="tooltip-label">${label}</span><strong class="tooltip-value">${value}</strong></div>`;
    return row("Hour", hour) + row("Count", formatCount(count));
  };

  function showTooltip(event, categoryKey) {
    const hour = hourFromPointer(event);
    const row = processedData[hour];
    const count = row?.[categoryKey] ?? 0;
    const categoryName = displayCategoryName(labelsByCategory[categoryKey] ?? categoryKey);
    const [pointerX, pointerY] = d3.pointer(event, container.node());

    tooltip
      .style("transform", `translate(${pointerX + 14}px, ${pointerY + 14}px)`)
      .style("opacity", 1)
      .html(tooltipText(hour, count));
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  svg
    .on("mousemove", (event) => {
      if (selectedCategory) showTooltip(event, selectedCategory);
    })
    .on("mouseleave", () => {
      hideTooltip();
    });

  const wrapCenterText = (textString, totalCount, categoryKey) => {
    centerTextGroup.selectAll("*").remove();
    const accentColor = categoryKey ? colorScheme(categoryKey) : "var(--theme-foreground)";

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

    const lineHeight = 18;
    const totalLinesCount = lines.length + 1;
    // Offsets the starting Y baseline so the multi-line block remains perfectly centered
    const startY = -((totalLinesCount - 1) * lineHeight) / 2 + 4;

    lines.forEach((lineText, index) => {
      centerTextGroup
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", startY + index * lineHeight)
        .attr("fill", "var(--theme-foreground, #111)")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("text-transform", "capitalize")
        .text(lineText);
    });

    centerTextGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", startY + lines.length * lineHeight + 6)
      .attr("fill", accentColor)
      .style("font-size", "12px")
      .style("font-weight", "normal")
      .text(`${formatCount(totalCount)}`);
  }



  function handleHover(hoveredIndex, labelText, valueText, categoryKey) {
    wrapCenterText(labelText, valueText, categoryKey);

    centerTextGroup.interrupt().transition().duration(transitionMs).attr("opacity", 0.8);

    
    areaGroup
      .selectAll(".area-path")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", (_d, i) => (i === hoveredIndex ? defaultOpacity * 2 : defaultOpacity * 0.5))
      .attr("stroke-width", (_d, i) => (i === hoveredIndex ? areaStrokeWidthHover : 0));

    legend
      .selectAll(".radial-presence-chart__legend-item")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .style("background", (_d, i) => (i === hoveredIndex ? "rgba(127,127,127,0.14)" : "transparent"))
      .style("border-color", (_d, i) => (i === hoveredIndex ? strokeForCategory(sortedCategories[i]) : "transparent"))
      .style("opacity", (_d, i) => (i === hoveredIndex ? 1 : 0.5));
  }

  function clearHover() {
    centerTextGroup.interrupt().transition().duration(transitionMs).attr("opacity", 0);

    areaGroup
      .selectAll(".area-path")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", defaultOpacity)
      .attr("stroke-width", 0);

    legend
      .selectAll(".radial-presence-chart__legend-item")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .style("background", "transparent")
      .style("border-color", "transparent")
      .style("opacity", 1);
  }

  function handleMouseLeave() {
    if (selectedCategory) return;

    centerTextGroup.interrupt().transition().duration(transitionMs).attr("opacity", 0);

    areaGroup
      .selectAll(".area-path")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", defaultOpacity)
      .attr("stroke-width", 0);

    legend
      .selectAll(".radial-presence-chart__legend-item")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .style("background", "transparent")
      .style("border-color", "transparent")
      .style("opacity", 1);
  }

  function toggleCategory(categoryKey) {
    selectedCategory = selectedCategory === categoryKey ? null : categoryKey;

    if (!selectedCategory) {
      clearHover();
      hideTooltip();
      return;
    }

    const selectedIndex = sortedCategories.indexOf(selectedCategory);
    const selectedName = displayCategoryName(labelsByCategory[selectedCategory] ?? selectedCategory);
    const selectedTotal = d3.sum(processedData, (row) => row[selectedCategory]);
    handleHover(selectedIndex, selectedName, selectedTotal, selectedCategory);
  }

  sortedCategories.forEach((cat) => {
    const cleanName = displayCategoryName(labelsByCategory[cat] ?? cat);

    const item = legend
      .append("div")
      .attr("class", "radial-presence-chart__legend-item")
      .on("click", (event) => {
        event.stopPropagation();
        toggleCategory(cat);
      })
      .on("mouseenter", () => {
        if (selectedCategory) return;
        const hoveredIndex = sortedCategories.indexOf(cat);
        const totalSum = d3.sum(processedData, (row) => row[cat]);
        handleHover(hoveredIndex, cleanName, totalSum, cat);
      })
      .on("mouseleave", () => {
        if (selectedCategory) return;
        handleMouseLeave();
      });

    item
      .append("span")
      .attr("class", "radial-presence-chart__legend-swatch")
      .style("background-color", colorScheme(cat))
      .style("border", `0px solid ${strokeForCategory(cat)}`);

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
    .attr("stroke", (cat) => strokeForCategory(cat))
    .attr("stroke-width", 0)
    .attr("opacity", defaultOpacity)
    .attr("d", (cat) => {
      const customArea = area.outerRadius((d) => y(d[cat]));
      return customArea(processedData);
    })
    .on("click", (event, cat) => {
      event.stopPropagation();
      toggleCategory(cat);
    })
    .on("mouseenter", (_event, cat) => {
      const activeCategory = selectedCategory ?? cat;
      const activeIndex = sortedCategories.indexOf(activeCategory);
      const cleanName = displayCategoryName(labelsByCategory[activeCategory] ?? activeCategory);
      const totalSum = d3.sum(processedData, (row) => row[activeCategory]);
      handleHover(activeIndex, cleanName, totalSum, activeCategory);
      showTooltip(_event, activeCategory);
    })
    .on("mousemove", (event, cat) => {
      showTooltip(event, selectedCategory ?? cat);
    })
    .on("mouseleave", () => {
      if (!selectedCategory) {
        handleMouseLeave();
        hideTooltip();
      }
    });

  const hourTicks = d3.range(0, 24);
  const radialAxis = gridGroup.append("g").selectAll("g").data(hourTicks).join("g");

  radialAxis
    .append("path")
    .attr("stroke", "currentColor")
    .attr("stroke-width", areaStrokeWidth)
    .attr("stroke-opacity", 0.1)
    .attr(
      "d",
      (d) => `M ${d3.pointRadial(x(d), fixedInnerRadius)} L ${d3.pointRadial(x(d), fixedOuterRadius)}`
    );

  radialAxis
    .append("text")
    .attr("class", "radial-presence-chart__x-label")
    .attr("transform", (d) => {
      const angle = x(d) - Math.PI / 2;
      const radius = fixedInnerRadius - 16;
      return `translate(${Math.cos(angle) * radius}, ${Math.sin(angle) * radius})`;
    })
    .attr("text-anchor", (d) => {
      const angle = x(d);
      if (angle === 0 || angle === Math.PI) return "middle";
      return angle < Math.PI ? "end" : "start";
    })
    .attr("dy", "0.35em")
    .style("font-size", "11px")
    .style("font-weight", "400")
    .style("fill", (d) => d % 6 === 0 ? "var(--theme-foreground)" : "var(--theme-foreground-muted, #666)")
    .text((d) => {
      if (d === 0) return "12 AM";
      if (d === 12) return "12 PM";
      if (d === 6) return "6 AM";
      if (d === 18) return "6 PM";
      return d % 3 === 0 ? `${d}` : ""; // Shows intermediate numbers every 3 hours, hides the rest
    });


  const rings = gridGroup.append("g")
    .attr("text-anchor", "middle")
    .selectAll("g")
    .data(y.ticks(4))
    .join("g");

  rings
    .append("circle")
    .attr("fill", "none")
    .attr("stroke", "currentColor")
    .attr("stroke-width", areaStrokeWidth)
    .attr("stroke-opacity", 0.12)
    .attr("r", y);

  rings
    .append("text")
    .filter((d) => d !== 0)
    .attr("class", "radial-presence-chart__y-label")
    .attr("x", (d) => -y(d))
    .attr("dy", "0.35em")
    .attr("stroke", "var(--theme-background)")
    .attr("stroke-width", 4)
    .attr("paint-order", "stroke")
    .text((d) => d);

  if (footnote) {
    container
      .append("figcaption")
      .attr("class", "chart-footnote")
      .text(footnote);
  }

  return container.node();
};
