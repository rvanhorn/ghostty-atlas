import { ConfigDocument } from "./config-document.js";

export const validateSetting = (field, value) => {
  if (value === "") return "";
  if (field.type !== "fonts" && /[\r\n\0]/.test(value))
    return "A setting must fit on one line.";
  const isDecimal = /^\s*(?:\d+(?:\.\d*)?|\.\d+)\s*$/.test(value);
  if (field.type === "number") {
    const numericValue = Number(value);
    if (
      !isDecimal ||
      !Number.isFinite(numericValue) ||
      numericValue < field.min ||
      numericValue > field.max ||
      (field.step === 1 && !Number.isInteger(numericValue))
    )
      return `Enter a number from ${field.min} to ${field.max}.`;
  }
  if (
    field.type === "opacity" &&
    (!isDecimal ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0 ||
      Number(value) > 1)
  )
    return "Enter an opacity from 0 to 1.";
  if (
    field.type === "padding" &&
    (!/^\d+(?:\.\d+)?(?:\s*,\s*\d+(?:\.\d+)?)?$/.test(value) ||
      value.split(",").some((part) => !Number.isFinite(Number(part))))
  )
    return "Use a non-negative number, or two comma-separated numbers.";
  // Ghostty reads hex colors with or without # and X11 color names such as "dark slate gray".
  if (
    field.type === "color" &&
    !/^#?[0-9a-f]{6}$/i.test(value) &&
    !/^[a-z][a-z0-9 ]*$/i.test(value)
  )
    return "Enter a hex color, as in #1e1e2e, or an X11 color name.";
  if (field.type === "fonts" && /["\\\r\0]/.test(value))
    return "Use plain font names, one per line (no quotes or backslashes).";
  return "";
};

export const parseImport = (source) => {
  if (
    !source.trim() ||
    new TextEncoder().encode(source).length > 262144 ||
    source.includes("\0")
  )
    throw new Error("Choose a non-empty UTF-8 configuration up to 256 KB.");
  const document = new ConfigDocument(source);
  if (
    !document.lines.some((line) => line.key) &&
    document.lines.some(
      (line) => line.raw.trim() && !line.raw.trim().startsWith("#"),
    )
  )
    throw new Error(
      "No key = value settings found. Check the configuration and try again.",
    );
  return document;
};
