---
toc: true
title: "Visualizing temporal data from SONYC sensors"
---

```js
import { buildSonicChartData } from "../utils/sonycData.js";
import { renderBubbleChart } from "../components/chart1.js";
const rows = await FileAttachment("../data/data.csv").csv();
```


# Visualizing temporal data from SONYC sensors
##

## Description

From late 2016 to early 2020, [**Sounds of New York City (SONYC)**](https://wp.nyu.edu/sonyc/) used smart noise sensors to collect 30-second sound clips from across the Big Apple.

A team of researchers used these clips to assess noise levels in New York City's outdoor environments. With most of the sensors in downtown Manhattan and some in Brooklyn, Queens, and uptown, the data reflect outdoor sounds New Yorkers are likely to hear on their daily commutes.

New York City is noisy. In 2026 alone, the city has received over [140000](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9/about_data) street and sidewalk noise complaints.  is a research project that aims to asses how noisy our outdoor environments are, and how smart noise sensors can be used to monitor them.

Read more about the motivation and creation of this dataset see the [DCASE 2020 Urban Sound Tagging with Spatiotemporal Context Task website](http://dcase.community/challenge2020/task-urban-sound-tagging-with-spatiotemporal-context).

## Sounds
The researchers and citizen volunteers tagged the presence of 23 sounds, chosen in consultation with the New York City Department of Environmental Protection (DEP). These 23 fine-grained sound categories were then grouped into 8  general, "coarse-grained" classes.

```js
const sonycCharts = buildSonicChartData(rows);
display(renderBubbleChart({data: sonycCharts.bubbleHierarchy, width}))
```

This chart shows TKTK.

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

### When were they recorded

In this chart, you can explore each category of sounds and the times of day that they occur. 

```js
import { renderRadialPresenceChart } from "../components/chart2.js";
display(renderRadialPresenceChart({data: sonycCharts.radialPresence, width}));
```