// Preview sample ids are part of shared links, so keep existing ids stable.
export const previewSamples = [
  ["shell", "Shell"],
  ["code", "Code"],
  ["text", "Typography"],
];

export const getSampleLabel = (sample) =>
  previewSamples.find(([id]) => id === sample)?.[1] ?? sample;
