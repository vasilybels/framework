const SONYC_CATEGORY_CONFIG = [
  {
    key: "1_engine_presence",
    name: "Engines",
    children: [
      {key: "1-1_small-sounding-engine_presence", name: "Small engine"},
      {key: "1-2_medium-sounding-engine_presence", name: "Medium engine"},
      {key: "1-3_large-sounding-engine_presence", name: "Large engine"},
      {key: "1-X_engine-of-uncertain-size_presence", name: "Engine of uncertain size"}
    ]
  },
  {
    key: "2_machinery-impact_presence",
    name: "Machinery",
    children: [
      {key: "2-1_rock-drill_presence", name: "Rock drill"},
      {key: "2-2_jackhammer_presence", name: "Jackhammer"},
      {key: "2-3_hoe-ram_presence", name: "Hoe ram"},
      {key: "2-4_pile-driver_presence", name: "Pile driver"},
      {key: "2-X_other-unknown-impact-machinery_presence", name: "Other machinery"}
    ]
  },
  {
    key: "3_non-machinery-impact_presence",
    name: "Non machinery impact",
    children: [
      {key: "3-1_non-machinery-impact_presence", name: "Non machinery impact"}
    ],
    collapseSingleChild: true
  },
  {
    key: "4_powered-saw_presence",
    name: "Powered saw",
    children: [
      {key: "4-1_chainsaw_presence", name: "Chainsaw"},
      {key: "4-2_small-medium-rotating-saw_presence", name: "Small or medium rotating saw"},
      {key: "4-3_large-rotating-saw_presence", name: "Large rotating saw"},
      {key: "4-X_other-unknown-powered-saw_presence", name: "Other saw"}
    ]
  },
  {
    key: "5_alert-signal_presence",
    name: "Alert signals",
    children: [
      {key: "5-1_car-horn_presence", name: "Car horn"},
      {key: "5-2_car-alarm_presence", name: "Car alarm"},
      {key: "5-3_siren_presence", name: "Siren"},
      {key: "5-4_reverse-beeper_presence", name: "Reverse beeper"},
      {key: "5-X_other-unknown-alert-signal_presence", name: "Other alert signals"}
    ]
  },
  {
    key: "6_music_presence",
    name: "Music",
    children: [
      {key: "6-1_stationary-music_presence", name: "Stationary music"},
      {key: "6-2_mobile-music_presence", name: "Mobile music"},
      {key: "6-3_ice-cream-truck_presence", name: "Ice cream truck"},
      {key: "6-X_music-from-uncertain-source_presence", name: "Music from uncertain source"}
    ]
  },
  {
    key: "7_human-voice_presence",
    name: "Human voice",
    children: [
      {key: "7-1_person-or-small-group-talking_presence", name: "Talking"},
      {key: "7-2_person-or-small-group-shouting_presence", name: "Shouting"},
      {key: "7-3_large-crowd_presence", name: "Large crowd"},
      {key: "7-4_amplified-speech_presence", name: "Amplified speech"},
      {key: "7-X_other-unknown-human-voice_presence", name: "Other human voice"}
    ]
  },
  {
    key: "8_dog_presence",
    name: "Dog barking or whining",
    children: [
      {key: "8-1_dog-barking-whining_presence", name: "Dog barking or whining"}
    ],
    collapseSingleChild: true
  }
];

export const SONYC_COARSE_CATEGORIES = SONYC_CATEGORY_CONFIG.map((d) => d.key);
export const SONYC_COARSE_LABELS = Object.fromEntries(SONYC_CATEGORY_CONFIG.map((d) => [d.key, d.name]));
export const SONYC_COARSE_KEY_BY_NAME = Object.fromEntries(SONYC_CATEGORY_CONFIG.map((d) => [d.name, d.key]));

function isPresent(value) {
  return String(value) === "1";
}

function sumPresence(rows, column) {
  let total = 0;
  for (const row of rows) {
    if (isPresent(row[column])) total += 1;
  }
  return total;
}

export function filterUniversalTruthRows(rows, annotatorId = 0) {
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => +row.annotator_id === annotatorId);
}

export function buildBubbleHierarchy(rows, rootName = "Sounds") {
  const children = [];

  for (const category of SONYC_CATEGORY_CONFIG) {
    const leafNodes = category.children
      .map((leaf) => ({
        id: leaf.key,
        name: leaf.name,
        value: sumPresence(rows, leaf.key)
      }))
      .filter((leaf) => leaf.value > 0);

    const total = leafNodes.reduce((acc, leaf) => acc + leaf.value, 0);
    if (total <= 0) continue;

    if (category.collapseSingleChild) {
      children.push({id: category.key, name: category.name, value: total});
    } else {
      children.push({id: category.key, name: category.name, children: leafNodes});
    }
  }

  return {id: "root", name: rootName, children};
}

export function buildRadialPresenceData(rows) {
  const processedData = Array.from({length: 24}, (_, hour) => {
    const row = {hour};
    for (const key of SONYC_COARSE_CATEGORIES) row[key] = 0;
    return row;
  });

  for (const row of rows) {
    const hour = +row.hour;
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) continue;
    const bucket = processedData[hour];
    for (const key of SONYC_COARSE_CATEGORIES) {
      if (isPresent(row[key])) bucket[key] += 1;
    }
  }

  const maxVal = Math.max(
    1,
    ...processedData.map((d) => Math.max(...SONYC_COARSE_CATEGORIES.map((key) => d[key] ?? 0)))
  );

  const sortedCategories = [...SONYC_COARSE_CATEGORIES].sort((a, b) => {
    const sumA = processedData.reduce((acc, d) => acc + (d[a] ?? 0), 0);
    const sumB = processedData.reduce((acc, d) => acc + (d[b] ?? 0), 0);
    return sumB - sumA;
  });

  return {
    processedData,
    maxVal,
    sortedCategories,
    categories: SONYC_COARSE_CATEGORIES,
    labelsByCategory: SONYC_COARSE_LABELS
  };
}

export function buildSonicChartData(rows) {
  const universalRows = filterUniversalTruthRows(rows);
  return {
    universalRows,
    bubbleHierarchy: buildBubbleHierarchy(universalRows),
    radialPresence: buildRadialPresenceData(universalRows)
  };
}
