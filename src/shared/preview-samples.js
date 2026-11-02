// Preview sample ids are part of shared links, so keep existing ids stable.
export const previewSamples = [
  ["shell", "Shell"],
  ["code", "Code"],
  ["text", "Typography"],
  ["ansi", "ANSI Colors"],
  ["diff", "Git Diff"],
  ["log", "Dense Log"],
  ["tui", "Terminal UI"],
];

export const getSampleLabel = (sample) =>
  previewSamples.find(([id]) => id === sample)?.[1] ?? sample;
