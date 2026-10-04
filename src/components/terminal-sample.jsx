const Ansi = ({ color, children }) => (
  <span className={`ansi-${color}`}>{children}</span>
);

export const TerminalSample = ({ sample, compact = false }) => {
  if (compact && sample === "shell")
    return (
      <>
        <Ansi color={4}>~/atlas</Ansi> <Ansi color={5}>main</Ansi>
        {"\n"}
        <Ansi color={2}>❯</Ansi>
        {" pnpm test\n"}
        <Ansi color={2}>✓</Ansi>
        {" palette.test.ts\n"}
        <Ansi color={2}>✓</Ansi>
        {" config.test.ts\n"}
        <Ansi color={2}>12 tests passed</Ansi>
      </>
    );
  if (compact && sample === "code")
    return (
      <>
        <Ansi color={5}>const</Ansi>
        {" theme = {\n  name: "}
        <Ansi color={2}>'Ghostty'</Ansi>
        {",\n  colors: "}
        <Ansi color={3}>16</Ansi>
        {"\n};\n"}
        <Ansi color={4}>render</Ansi>
        {"(theme);"}
      </>
    );
  if (compact)
    return (
      <>
        {"The quick brown fox\njumps over the lazy dog.\n"}
        <Ansi color={4}>Aa Bb Cc 0123456789</Ansi>
        {"\n"}
        <strong>Bold</strong>
        {" · "}
        <em>Italic</em>
        {"\n"}
        <Ansi color={2}>Success</Ansi> <Ansi color={3}>Warning</Ansi>
      </>
    );
  if (sample === "code")
    return (
      <>
        <span className="terminal-dim">{"// src/theme.js\n"}</span>
        <Ansi color={5}>export const</Ansi> <Ansi color={4}>findTheme</Ansi>
        {" = (name) => {\n  "}
        <Ansi color={5}>return</Ansi>
        {" themes."}
        <Ansi color={4}>find</Ansi>
        {"((theme) =>\n    theme.name === name\n  );\n};\n\n"}
        <Ansi color={5}>const</Ansi>
        {" options = {\n  fontSize: "}
        <Ansi color={3}>14</Ansi>
        {",\n  enabled: "}
        <Ansi color={5}>true</Ansi>
        {",\n  fallback: "}
        <Ansi color={5}>null</Ansi>
        {"\n};\n\n"}
        <span className="terminal-dim">
          {"// Keep the same sample in both previews.\n"}
        </span>
        {"console."}
        <Ansi color={4}>log</Ansi>
        {"(options);\n\n"}
        <TypographySample />
      </>
    );
  if (sample === "text") return <TypographySample />;
  return (
    <>
      <Ansi color={4}>~/projects/atlas</Ansi> <Ansi color={5}>main</Ansi>
      {"\n"}
      <Ansi color={2}>❯</Ansi>
      {" pnpm test\n\n"}
      <Ansi color={2}> ✓</Ansi>
      {" palette.test.ts "}
      <span className="terminal-dim">(8 tests)</span>
      {"\n"}
      <Ansi color={2}> ✓</Ansi>
      {" config.test.ts  "}
      <span className="terminal-dim">(4 tests)</span>
      {"\n\n Test Files  "}
      <Ansi color={2}>2 passed</Ansi>
      {" (2)\n   Duration  "}
      <Ansi color={3}>482ms</Ansi>
      {"\n\n"}
      <Ansi color={3}>[warn]</Ansi>
      {" Example warning output\n"}
      <Ansi color={1}>[error]</Ansi>
      {" Example error output\n\n"}
      <Ansi color={2}>❯</Ansi> <span className="terminal-cursor" />
      {"\n\n"}
      <span className="terminal-dim">{"────────────────────────────\n\n"}</span>
      <Ansi color={2}>❯</Ansi>
      {" git diff\n\n"}
      <span className="terminal-dim">{"diff --git a/config b/config\n"}</span>
      <Ansi color={1}>- font-size = 12</Ansi>
      {"\n"}
      <Ansi color={2}>+ font-size = 14</Ansi>
      {"\n"}
      <Ansi color={2}>+ window-padding-x = 20</Ansi>
      {"\n\n"}
      <TypographySample />
    </>
  );
};

const TypographySample = () => (
  <>
    {
      "The quick brown fox jumps\nover the lazy dog.\n\nSphinx of black quartz, judge my vow.\n\nABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789  0O 1Il  rn m  vv w\n() [] {} <> / \\ : ; , .\n\n"
    }
    <strong>Bold emphasis</strong>
    {"\n"}
    <em>Italic notes</em>
    {"\n"}
    <u>Underlined text</u>
    {"\n"}
    <span className="terminal-dim">Dim secondary output</span>
    {"\nRegular foreground\n\n"}
    <span className="terminal-selection">Selected text</span>
    {
      "\n\n┌──────────────────────┐\n│  Room to focus.      │\n└──────────────────────┘\n\n"
    }
    <Ansi color={2}>❯</Ansi> <span className="terminal-cursor" />
  </>
);
