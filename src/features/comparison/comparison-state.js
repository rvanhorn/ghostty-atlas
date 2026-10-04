export const updateComparison = (comparison, action) => {
  if (action.type === "open") {
    const side = !comparison.left.locked
      ? "left"
      : !comparison.right.locked
        ? "right"
        : null;
    if (!side || comparison[side].themeName === action.themeName)
      return comparison;
    return {
      ...comparison,
      [side]: { ...comparison[side], themeName: action.themeName },
    };
  }
  const currentPane = comparison[action.side];
  if (!currentPane) return comparison;
  if (action.type === "lock")
    return {
      ...comparison,
      [action.side]: { ...currentPane, locked: !currentPane.locked },
    };
  if (action.type === "select" && !currentPane.locked)
    return {
      ...comparison,
      [action.side]: { ...currentPane, themeName: action.themeName },
    };
  return comparison;
};

export const getAdjacentTheme = (catalog, themeName, direction) => {
  const currentIndex = catalog.findIndex((theme) => theme.name === themeName);
  if (!catalog.length) return null;
  if (currentIndex === -1) return direction === 1 ? catalog[0] : null;
  return catalog[currentIndex + direction] ?? null;
};
