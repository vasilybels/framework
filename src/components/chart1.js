import * as d3 from "npm:d3";
import {SONYC_COARSE_CATEGORIES, SONYC_COARSE_KEY_BY_NAME} from "../sonycData.js";

const transitionMs = 100;
const defaultOpacity = 0.75;
const groupFillOpacity = 0.08; // soft category wash behind each coarse group, for Gestalt grouping
const leafStrokeWidth = 0;
const groupStrokeWidth = 0;
const leafStrokeDarken = 0.5;
const groupStrokeDarken = 0.5;
const lightFillLuminanceThreshold = 0.6; // above this, switch label text to dark for contrast
const minGroupLabelFontSize = 9;
const maxGroupLabelFontSize = 15;
const groupLabelInsetMultiplier = 0.7;
const minGroupLabelInsetPx = 6;

// MD USAGE:
// ```js
// import {buildBubbleHierarchy, filterUniversalTruthRows} from "../sonycData.js";
// import {renderBubbleChart} from "./components/chart1.js";
// const rows = await FileAttachment("data/data.csv").csv();
// const hierarchy = buildBubbleHierarchy(filterUniversalTruthRows(rows));
// display(renderBubbleChart({data: hierarchy, width}));
// ```
export const renderBubbleChart = ({
  data,
  width = 928,
  heading = "Cars and Humans are Most Frequent Noise Sources",
  subheading = "Total number of occurrences of each sound in the SONYC-UST dataset, by fine- and coarse- grained category.",
  footnote = "Source: Sounds of New York City Urban Sound Tagging (SONYC-UST) dataset, version 2.4."
} = {}) => {
  if (!data || typeof data !== "object") {
    throw new Error("This chart requires a hierarchical data object.");
  }

  const myColors = ['#450840', '#541535', '#5b2531', '#603431', '#634231', '#645033', '#645f35', '#626d39', '#5e7b3d'];

  const chartWidth = Math.max(320, width);
  const chartHeight = Math.max(420, Math.round(chartWidth * 0.78));
  const palette = d3.scaleOrdinal().domain(SONYC_COARSE_CATEGORIES).range(myColors);
  const formatCount = d3.format(",d");

  const root = d3.hierarchy(data)
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  d3.pack()
    .size([chartWidth, chartHeight])
    .padding(2)(root);

  const container = d3.create("figure").attr("class", "bubble-chart");
  const header = container.append("header").attr("class", "chart-header");
  header.append("h3").text(heading);
  header.append("p").text(subheading);

  const svg = container.append("svg")
    .attr("class", "bubble-chart__svg")
    .attr("viewBox", [0, 0, chartWidth, chartHeight])
    .attr("role", "img")
    .attr("aria-label", cleanName(data.name ?? "bubble chart"));

  const tooltip = container.append("div").attr("class", "bubble-chart__tooltip");

  // Identify a node by its full ancestor path so ids stay unique at any depth.
  const nodeId = (node) => node.ancestors().map((a) => a.data?.name ?? "").reverse().join("__");

  const topAncestorCategory = (node) => {
    let n = node;
    while (n.depth > 1) n = n.parent;
    return n.data?.id ?? SONYC_COARSE_KEY_BY_NAME[n.data?.name] ?? "unknown";
  };

  const isGroup = (node) => Boolean(node.children && node.children.length);

  // Groups get a faint wash of their own hue (context); leaves get the full-strength fill (content).
  const fillFor = (node) => {
    if (node.depth === 0) return "rgba(0,0,0,0)";
    const base = d3.color(palette(topAncestorCategory(node)));
    if (!base) return "#f8f9fa";
    return base.copy({opacity: isGroup(node) ? groupFillOpacity : defaultOpacity}).toString();
  };

  // Every circle gets a same-hue stroke so touching same-category bubbles stay visually separated.
  const strokeFor = (node) => {
    if (node.depth === 0) return "rgba(0,0,0,0)";
    const base = d3.color(palette(topAncestorCategory(node)));
    if (!base) return "rgba(0,0,0,0.3)";
    return isGroup(node) ? base.darker(groupStrokeDarken).toString() : base.darker(leafStrokeDarken).toString();
  };

  const strokeWidthFor = (node) => {
    if (node.depth === 0) return 0;
    return isGroup(node) ? groupStrokeWidth : leafStrokeWidth;
  };

  const luminanceOf = (color) => (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255;

  // WCAG-informed: dark text on light fills, light text on dark fills.
  const labelFillFor = (node) => {
    const bubble = d3.color(fillFor(node));
    if (!bubble) return "#111";
    return luminanceOf(bubble) > lightFillLuminanceThreshold ? "#111" : "#f8f9fa";
  };

  // Curved group labels take on their own category hue (darkened if needed for contrast)
  // so the label color directly reinforces which region it names.
  const groupLabelColorFor = (d) => {
    const base = d3.color(palette(topAncestorCategory(d)));
    if (!base) return "var(--theme-foreground)";
    return luminanceOf(base) > lightFillLuminanceThreshold ? base.darker(1.6).toString() : base.toString();
  };

  const labelFontSize = (d) => Math.max(8, Math.min(15, d.r / 5));
  const shouldLabel = (d) => {
    if (d.depth === 0 || isGroup(d)) return false;
    const fs = labelFontSize(d);
    const estWidth = String(d.data?.name ?? "").length * fs * 0.56;
    return d.r >= 14 && estWidth <= d.r * 1.7;
  };

  // Tune these module-level caps to control coarse curved label size.
  const groupLabelFontSize = (d) => Math.max(minGroupLabelFontSize, Math.min(maxGroupLabelFontSize, d.r / 8));
  const groupLabelInsetPx = (d) => (d.data?.name === "Powered saw" || d.data?.name === "Machinery") ? -6 : Math.max(minGroupLabelInsetPx, groupLabelFontSize(d) * groupLabelInsetMultiplier);
  const shouldGroupLabel = (d) => {
    if (!isGroup(d) || d.depth !== 1 || d.r < 20) return false;
    const fs = groupLabelFontSize(d);
    const text = cleanName(d.data?.name ?? "");
    const estWidth = text.length * fs * 0.58;
    const topArcLength = Math.PI * Math.max(d.r - groupLabelInsetPx(d), 5);
    return estWidth <= topArcLength * 0.95;
  };

  const groupArcId = (d) => `bubble-group-arc-${nodeId(d).replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  const polarPoint = (cx, cy, r, radians) => [
    cx + r * Math.cos(radians),
    cy + r * Math.sin(radians)
  ];

  // Top-half arc so coarse labels are curved and centered over each parent circle.
  const groupLabelArcPath = (d) => {
    const r = Math.max(d.r - groupLabelInsetPx(d), 10);
    const start = -5 * Math.PI / 6;
    const end = -Math.PI / 6;
    const [x1, y1] = polarPoint(d.x, d.y, r, start);
    const [x2, y2] = polarPoint(d.x, d.y, r, end);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  // root.descendants() returns every node D3 packed, so single-leaf
  // categories (no .children) are drawn exactly like any other leaf.
  const nodes = root.descendants();
  const coarseGroups = nodes.filter((d) => isGroup(d) && d.depth === 1);

  svg.append("defs")
    .selectAll("path")
    .data(coarseGroups.filter(shouldGroupLabel))
    .join("path")
    .attr("class", "bubble-label-arc")
    .attr("id", (d) => groupArcId(d))
    .attr("d", (d) => groupLabelArcPath(d));

  const layers = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "hierarchy-node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  layers.append("circle")
    .attr("class", "hierarchy-circle")
    .attr("r", (d) => d.r)
    .attr("fill", (d) => fillFor(d))
    .attr("stroke", (d) => strokeFor(d))
    .attr("stroke-width", (d) => strokeWidthFor(d))
    .on("mouseenter", (event, d) => {
      if (d.depth === 0) return;
      hover(d);
      showTooltip(event, d);
    })
    .on("mousemove", (event, d) => {
      if (d.depth === 0) return;
      showTooltip(event, d);
    })
    .on("mouseleave", () => {
      resetHover();
      hideTooltip();
    });

  layers.append("text")
    .attr("class", "bubble-label")
    .style("display", (d) => shouldLabel(d) ? null : "none")
    .style("font-size", (d) => `${labelFontSize(d)}px`)
    .attr("fill", (d) => labelFillFor(d))
    .text((d) => cleanName(d.data?.name ?? ""));

  svg.append("g")
    .selectAll("text")
    .data(coarseGroups.filter(shouldGroupLabel))
    .join("text")
    .attr("class", "bubble-label bubble-label--group")
    .style("font-size", (d) => `${groupLabelFontSize(d)}px`)
    .style("font-weight", 700)
    .attr("fill", (d) => groupLabelColorFor(d))
    .append("textPath")
    .attr("href", (d) => `#${groupArcId(d)}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text((d) => cleanName(d.data?.name ?? ""));

  function cleanName(name) {
    return String(name ?? "").replace(/-/g, " ");
  }

  const tooltipText = (node, count) => {
    const soundName = node.data?.name ?? node.name ?? "";
    const catName = node.parent?.data?.name ?? "";
    const soundType = cleanName(soundName).toLowerCase();
    const countText = formatCount(count);
    const category = cleanName(catName).toLowerCase();
    const row = (label, value) => `<div class="tooltip-row"><span class="tooltip-label">${label}</span><strong class="tooltip-value">${value}</strong></div>`;

    if (catName === "Sounds") {
      return `${row("Sound type", soundType)}${row("Count", countText)}`;
    }
    return `${row("Sound type", soundType)}${row("Count", countText)}${row("Category", category)}`;
  }

  function showTooltip(event, node) {
    const [x, y] = d3.pointer(event, container.node());
    const count = node.value ?? node.data?.value ?? 0;
    const swatchColor = d3.color(palette(topAncestorCategory(node)))?.formatHex() ?? "#999";
    tooltip
      .style("transform", `translate(${x + 14}px, ${y + 14}px)`)
      .style("opacity", 1)
      .html(tooltipText(node, count));
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  function hover(targetNode) {
    const targetId = nodeId(targetNode);
    const targetIsGroup = isGroup(targetNode);

    svg.selectAll(".hierarchy-circle")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("stroke-width", (d) => {
        if (d.depth === 0) return 0;
        return nodeId(d) === targetId ? strokeWidthFor(d) + 1 : strokeWidthFor(d);
      })
      .attr("fill", (d) => {
        if (d.depth === 0) return "rgba(0,0,0,0)";
        if (isGroup(d)) return fillFor(d); // keep the category wash constant; only its opacity (below) responds to hover
        if (targetIsGroup) {
          const inGroup = d.parent && nodeId(d.parent) === targetId;
          const base = d3.color(palette(topAncestorCategory(d)));
          return base ? base.copy({opacity: inGroup ? defaultOpacity : defaultOpacity * 0.16}).toString() : "#f8f9fa";
        }
        return fillFor(d);
      });

    svg.selectAll(".hierarchy-node")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", (d) => {
        if (d.depth === 0) return 1;
        const id = nodeId(d);
        if (targetIsGroup) {
          return id === targetId || (d.parent && nodeId(d.parent) === targetId) ? 1 : defaultOpacity * 0.2;
        }
        // Keep the hovered leaf's own group visible for context (breadcrumb of category).
        const isTargetsParent = isGroup(d) && targetNode.parent && nodeId(targetNode.parent) === id;
        return id === targetId || isTargetsParent ? 1 : defaultOpacity * 0.2;
      });
  }

  function resetHover() {
    svg.selectAll(".hierarchy-circle")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("fill", (d) => fillFor(d))
      .attr("stroke-width", (d) => strokeWidthFor(d));

    svg.selectAll(".hierarchy-node")
      .interrupt()
      .transition()
      .duration(transitionMs)
      .attr("opacity", 1);
  }

  if (footnote) {
    container
      .append("figcaption")
      .attr("class", "chart-footnote")
      .text(footnote);
  }

  return container.node();
}

