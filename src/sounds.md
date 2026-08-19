---
toc: true
title: "visualizing SONYC data"
---

```js
import { buildSonicChartData } from "./utils/sonycData.js";
import { renderBubbleChart } from "./components/chart1.js";
const rows = await FileAttachment("data/data.csv").csv();
```

# visualizing SONYC data

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## what the SONYC team recorded

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

```js
const sonycCharts = buildSonicChartData(rows);
display(renderBubbleChart({data: sonycCharts.bubbleHierarchy, width}))
```

#### Smoke check

```js
const topCategoryTotals = sonycCharts.radialPresence.sortedCategories
	.map((key) => ({
		key,
		category: sonycCharts.radialPresence.labelsByCategory[key] ?? key,
		total: sonycCharts.radialPresence.processedData.reduce((acc, row) => acc + (row[key] ?? 0), 0)
	}))
	.slice(0, 5);

display({
	totalRows: rows.length,
	universalTruthRows: sonycCharts.universalRows.length,
	topCategoryTotals
});
```

## different sounds are loudest at different times

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

```js
import { renderRadialPresenceChart } from "./components/chart2.js";
display(renderRadialPresenceChart({data: sonycCharts.radialPresence, width}));
```