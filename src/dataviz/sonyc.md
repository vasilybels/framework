---
toc: true
title: "Visualizing temporal data from SONYC sensors"
---

```js
import { buildSonicChartData } from "../utils/sonycData.js";
import { renderBubbleChart } from "../components/chart1.js";
const rows = await FileAttachment("../data/data.csv").csv();
```

## Description
New York City is noisy. In 2026 alone, the city has received over [140000](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9/about_data) street and sidewalk noise complaints. **Sounds of New York City (SONYC)** is a research project that aims to asses how noisy our outdoor environments are, and how smart noise sensors can be used to monitor them.

### Project's methodology
SONYC Urban Sound Tagging (SONYC-UST) is a dataset for the development and evaluation of machine listening systems for realistic urban noise monitoring. The audio was recorded from the [SONYC](https://wp.nyu.edu/sonyc) acoustic sensor network. Members of the SONYC team created a subset of verified, ground-truth tags, which are a small portion of the entire dataset that will be explored in this piece. You can read more about the motivation and creation of this dataset see the [DCASE 2020 Urban Sound Tagging with Spatiotemporal Context Task website](http://dcase.community/challenge2020/task-urban-sound-tagging-with-spatiotemporal-context).

### Sounds collected
Volunteers on the  [Zooniverse](https://zooniverse.org) citizen science platform tagged the presence of 23 classes that were chosen in consultation with the New York City Department of Environmental Protection. These 23 fine-grained classes were then grouped into 8 coarse-grained classes.

```js
const sonycCharts = buildSonicChartData(rows);
display(renderBubbleChart({data: sonycCharts.bubbleHierarchy, width}))
```

<!-- ```js
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
``` -->

## Temporal exploration

In this chart, you can explore each category of sounds and the times of day that they occur. 

```js
import { renderRadialPresenceChart } from "../components/chart2.js";
display(renderRadialPresenceChart({data: sonycCharts.radialPresence, width}));
```