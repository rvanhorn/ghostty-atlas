// Keys whose every line counts, rather than only the last one.
const repeatableKeys = ["font-family", "palette"];
const joinValues = (key, values) =>
  values.join(repeatableKeys.includes(key) ? "\n" : "");

/* Lossless line-based editing: untouched directives, comments, order and EOLs survive. */
export class ConfigDocument {
  constructor(source) {
    this.source = source;
    this.eol = source.includes("\r\n") ? "\r\n" : "\n";
    this.lines = [...source.matchAll(/([^\r\n]*)(\r\n|\n|\r|$)/g)]
      .filter((m) => m[0])
      .map((m) => {
        const match = m[1].match(/^\s*([a-z][a-z0-9-]*)\s*=\s*(.*?)\s*$/);
        return { raw: m[0], key: match?.[1], value: match?.[2] };
      });
    this.edits = new Map();
  }
  static decode(value) {
    // Complex escaped strings remain intact rather than guessing their meaning.
    return /^"[^"\\]*"$/.test(value) ? value.slice(1, -1) : value;
  }
  values(key) {
    if (this.edits.has(key)) return this.edits.get(key);
    const matches = this.lines
      .filter((line) => line.key === key)
      .map((line) => ConfigDocument.decode(line.value));
    if (key === "palette") return matches;
    if (key !== "font-family") return matches.slice(-1);
    const reset = matches.lastIndexOf("");
    return matches.slice(reset + 1);
  }
  get(key) {
    return joinValues(key, this.values(key));
  }
  set(key, values) {
    if (!/^[a-z][a-z0-9-]*$/.test(key))
      throw new Error("Invalid configuration key");
    if (!Array.isArray(values)) values = [String(values)];
    if (values.some((value) => /[\r\n\0]/.test(value)))
      throw new Error("A setting must fit on one line");
    const previous = this.edits.get(key);
    this.edits.delete(key);
    const original = this.get(key);
    if (joinValues(key, values) !== original) this.edits.set(key, values);
    return previous;
  }
  // An empty list removes every line of a key; font-family writes its reset line instead.
  remove(key) {
    return this.set(key, []);
  }
  export() {
    if (!this.edits.size) return this.source;
    const last = new Map();
    this.lines.forEach((line, i) => {
      if (this.edits.has(line.key)) last.set(line.key, i);
    });
    const directive = (key) => {
      const values = this.edits.get(key);
      if (!values.length && key !== "font-family") return "";
      // Reset the repeatable font list before replacing it with the edited chain.
      const reset =
        key === "font-family" && values.some(Boolean)
          ? key + " =" + this.eol
          : "";
      return (
        reset +
        (values.length ? values : [""])
          .map((value) => key + " = " + value + this.eol)
          .join("")
      );
    };
    let result = this.lines
      .map((line, i) =>
        !this.edits.has(line.key)
          ? line.raw
          : last.get(line.key) === i
            ? directive(line.key)
            : "",
      )
      .join("");
    for (const key of this.edits.keys())
      if (!last.has(key)) {
        if (result && !/[\r\n]$/.test(result)) result += this.eol;
        result += directive(key);
      }
    return result;
  }
}
