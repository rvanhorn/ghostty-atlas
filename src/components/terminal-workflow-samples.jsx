import { Fragment } from "react";

/* Issue #6: samples for the full ANSI palette, Git, dense logs, and a terminal UI.
   Text uses the contrast-adjusted --ansi-N colors; background blocks use the raw
   --ansi-bg-N colors, because minimum-contrast only changes foreground text. */

export const Ansi = ({ color, children }) => (
  <span className={`ansi-${color}`}>{children}</span>
);

const Block = ({ color, children }) => (
  <span
    className="terminal-block"
    style={{ background: `var(--ansi-bg-${color})` }}
  >
    {children}
  </span>
);

// SGR 7 swaps foreground and background; a color sets the swapped background.
const Inverse = ({ color, children }) => (
  <span
    className="terminal-inverse"
    style={
      color === undefined
        ? undefined
        : { "--terminal-inverse": `var(--ansi-bg-${color})` }
    }
  >
    {children}
  </span>
);

const Dim = ({ children }) => <span className="terminal-dim">{children}</span>;

const colorNames = [
  "Black",
  "Red",
  "Green",
  "Yellow",
  "Blue",
  "Magenta",
  "Cyan",
  "White",
];
const normalColors = [0, 1, 2, 3, 4, 5, 6, 7];
const brightColors = [8, 9, 10, 11, 12, 13, 14, 15];

const colorLabel = (color) =>
  `${color > 7 ? "Bright " : ""}${colorNames[color % 8]}`;

const ColorRow = ({ color }) => (
  <>
    {`${String(color).padStart(2)} ${colorLabel(color).padEnd(16)}`}
    <Ansi color={color}>Text</Ansi>{" "}
    <strong>
      <Ansi color={color}>Bold</Ansi>
    </strong>
    {"  "}
    <Block color={color}>{"      "}</Block>
    {"\n"}
  </>
);

const BlockRow = ({ colors, inverse = false }) => (
  <>
    {colors.map((color) =>
      inverse ? (
        <Inverse key={color} color={color}>
          {String(color).padStart(3)}{" "}
        </Inverse>
      ) : (
        <Block key={color} color={color}>
          {String(color).padStart(3)}{" "}
        </Block>
      ),
    )}
    {"\n"}
  </>
);

const StyleRow = () => (
  <>
    <strong>Bold</strong> <Dim>Dim</Dim> <em>Italic</em> <u>Underline</u>{" "}
    <Inverse>Inverse</Inverse>
  </>
);

export const AnsiSample = ({ compact }) =>
  compact ? (
    <>
      <strong>ANSI 0–15</strong>
      {"\n"}
      {normalColors.map((color) => (
        <Block key={color} color={color}>
          {"  "}
        </Block>
      ))}
      {"\n"}
      {brightColors.map((color) => (
        <Block key={color} color={color}>
          {"  "}
        </Block>
      ))}
      {"\n"}
      {[1, 2, 3, 4].map((color) => (
        <Fragment key={color}>
          <Ansi color={color}>{colorNames[color].toLowerCase()}</Ansi>{" "}
        </Fragment>
      ))}
      {"\n"}
      {[9, 10, 11, 12].map((color) => (
        <Fragment key={color}>
          <Ansi color={color}>{colorNames[color % 8].toLowerCase()}</Ansi>{" "}
        </Fragment>
      ))}
    </>
  ) : (
    <>
      <strong>Normal Colors 0–7</strong>
      {"\n"}
      {normalColors.map((color) => (
        <ColorRow key={color} color={color} />
      ))}
      {"\n"}
      <strong>Bright Colors 8–15</strong>
      {"\n"}
      {brightColors.map((color) => (
        <ColorRow key={color} color={color} />
      ))}
      {"\n"}
      <strong>Foreground on Color Blocks</strong>
      {"\n"}
      <BlockRow colors={normalColors} />
      <BlockRow colors={brightColors} />
      {"\n"}
      <strong>Background on Color Blocks</strong>
      {"\n"}
      <BlockRow colors={normalColors} inverse />
      <BlockRow colors={brightColors} inverse />
      {"\n"}
      <StyleRow />
    </>
  );

const Prompt = ({ command }) => (
  <>
    <Ansi color={2}>❯</Ansi>
    {` ${command}\n`}
  </>
);

const Refs = ({ children }) => (
  <>
    <Ansi color={3}>(</Ansi>
    {children}
    <Ansi color={3}>)</Ansi>{" "}
  </>
);

export const DiffSample = ({ compact }) =>
  compact ? (
    <>
      <Ansi color={6}>@@ -12,2 +12,3 @@</Ansi>
      {"\n   const t = read();\n"}
      <Ansi color={1}>{"-  return null;"}</Ansi>
      {"\n"}
      <Ansi color={2}>{"+  throw err;"}</Ansi>
      {"\n   return t;"}
    </>
  ) : (
    <>
      <Prompt command="git status --short" /> <Ansi color={1}>M</Ansi>
      {" src/theme.js\n"}
      <Ansi color={2}>A</Ansi>
      {"  src/palette.js\n"}
      <Ansi color={1}>??</Ansi>
      {" notes.md\n\n"}
      <Prompt command="git diff --stat" />
      {" src/theme.js | 6 "}
      <Ansi color={2}>++++</Ansi>
      <Ansi color={1}>--</Ansi>
      {"\n\n"}
      <Prompt command="git diff" />
      <strong>
        {
          "diff --git a/src/theme.js b/src/theme.js\nindex 3f2a1c4..8b9e0d2 100644\n--- a/src/theme.js\n+++ b/src/theme.js\n"
        }
      </strong>
      <Ansi color={6}>@@ -12,3 +12,5 @@</Ansi>
      {" export const load\n   const theme = read(name);\n"}
      <Ansi color={1}>{"-  if (!theme) return null;"}</Ansi>
      {"\n"}
      <Ansi color={2}>{"+  if (!theme) {\n+    throw new Error(name);"}</Ansi>
      {/* Git marks trailing whitespace on added lines with a red background. */}
      <Inverse color={1}>{"  "}</Inverse>
      {"\n"}
      <Ansi color={2}>{"+  }"}</Ansi>
      {"\n   return theme.colors;\n\n"}
      <Prompt command="git log --oneline --graph" />
      <Ansi color={1}>*</Ansi> <Ansi color={3}>2d45b42</Ansi>{" "}
      <Refs>
        <strong>
          <Ansi color={6}>HEAD -&gt; </Ansi>
          <Ansi color={2}>main</Ansi>
        </strong>
      </Refs>
      {"Add palette view\n"}
      <Ansi color={1}>*</Ansi>
      <Ansi color={2}>{"   "}</Ansi>
      <Ansi color={3}>7686b5b</Ansi>{" "}
      <Refs>
        <strong>
          <Ansi color={1}>origin/main</Ansi>
        </strong>
      </Refs>
      {"Export themes\n"}
      <Ansi color={1}>|</Ansi>
      <Ansi color={2}>{"\\"}</Ansi>
      {"\n"}
      <Ansi color={1}>|</Ansi> <Ansi color={2}>*</Ansi>{" "}
      <Ansi color={3}>c4ccbba</Ansi>
      {" Share links\n"}
      <Ansi color={1}>|</Ansi>
      <Ansi color={2}>/</Ansi>
      {"\n"}
      <Ansi color={1}>*</Ansi> <Ansi color={3}>f6461af</Ansi>{" "}
      <Refs>
        <strong>
          <Ansi color={3}>tag: v1.1.0</Ansi>
        </strong>
      </Refs>
      {"Pair themes"}
    </>
  );

const levels = {
  TRACE: (text) => <Ansi color={8}>{text}</Ansi>,
  DEBUG: (text) => <Ansi color={4}>{text}</Ansi>,
  INFO: (text) => <Ansi color={2}>{text}</Ansi>,
  WARN: (text) => (
    <strong>
      <Ansi color={3}>{text}</Ansi>
    </strong>
  ),
  ERROR: (text) => (
    <strong>
      <Ansi color={1}>{text}</Ansi>
    </strong>
  ),
  FATAL: (text) => (
    <strong>
      <Inverse color={9}>{text}</Inverse>
    </strong>
  ),
};

// [time, level, source, message, highlighted detail, its color]
const logLines = [
  ["02.118", "INFO", "http", "GET /themes ", "200", 10],
  ["02.131", "DEBUG", "cache", "hit key=", "themes:v3", 14],
  ["02.140", "TRACE", "db", "SELECT * FROM palettes", "", 0],
  ["02.162", "INFO", "http", "GET /theme/Nord ", "200", 10],
  ["02.201", "WARN", "pool", "busy=", "3/4", 11],
  ["02.244", "INFO", "http", "POST /export ", "201", 10],
  ["02.287", "ERROR", "http", "GET /theme/Nope ", "404", 11],
  ["02.301", "DEBUG", "cache", "miss key=", "config:draft", 14],
  ["02.355", "WARN", "font", "fallback for ", '"Iosevka"', 13],
  ["02.412", "INFO", "build", "✓ 214 modules in ", "1.2s", 12],
  ["02.460", "ERROR", "worker", "Unhandled rejection", "", 0],
];

const LogLine = ({ line: [time, level, source, message, detail, color] }) => (
  <>
    <Ansi color={8}>{`09:14:${time}`}</Ansi> {levels[level](level.padEnd(5))}{" "}
    <Ansi color={6}>{source.padEnd(6)}</Ansi> {message}
    {detail && <Ansi color={color}>{detail}</Ansi>}
    {"\n"}
  </>
);

export const LogSample = ({ compact }) =>
  compact ? (
    <>
      {[
        ["09:14", "INFO", "ready"],
        ["09:15", "DEBUG", "cache hit"],
        ["09:16", "WARN", "slow query"],
        ["09:17", "ERROR", "timeout"],
        ["09:18", "INFO", "retry ok"],
      ].map(([time, level, message], index) => (
        <Fragment key={time}>
          {index > 0 && "\n"}
          <Ansi color={8}>{time}</Ansi> {levels[level](level.padEnd(5))}{" "}
          {message}
        </Fragment>
      ))}
    </>
  ) : (
    <>
      <Prompt command="pnpm dev --verbose" />
      {logLines.map((line) => (
        <LogLine key={line[0]} line={line} />
      ))}
      <Ansi color={1}>
        {"  TypeError: Cannot read properties of undefined"}
      </Ansi>
      {"\n"}
      <Dim>{"      at loadPalette ("}</Dim>
      <u>src/palette.js:42:17</u>
      <Dim>{")\n      at async render ("}</Dim>
      <u>src/app.js:88:5</u>
      <Dim>{")"}</Dim>
      {"\n"}
      <LogLine line={["02.502", "FATAL", "db", "connection lost", "", 0]} />
      <LogLine line={["02.540", "INFO", "db", "reconnected in ", "38ms", 12]} />
      <Ansi color={8}>09:14:02.551</Ansi>{" "}
      <Dim>{"── 2 errors · 1 fatal ──"}</Dim>
    </>
  );

/* Terminal UI rows pad their plain text so box-drawing borders stay aligned.
   A cell is [text, render]; render wraps the text in colors or styles. */
const Frame = ({ children }) => <Ansi color={6}>{children}</Ansi>;

const Edge = ({ width, left, right, title = "" }) => (
  <>
    <Frame>{`${left}─`}</Frame>
    {title ? (
      <>
        {" "}
        <strong>{title}</strong>{" "}
      </>
    ) : (
      <Frame>──</Frame>
    )}
    <Frame>{`${"─".repeat(width - title.length - 1)}${right}`}</Frame>
    {"\n"}
  </>
);

const Row = ({ width, cells, fill }) => {
  const length = cells.reduce((sum, [text]) => sum + text.length, 0);
  const padding = " ".repeat(Math.max(0, width - length));
  return (
    <>
      <Frame>│</Frame>{" "}
      {cells.map(([text, render], index) => (
        <Fragment key={index}>{render ? render(text) : text}</Fragment>
      ))}
      {fill ? fill(padding) : padding} <Frame>│</Frame>
      {"\n"}
    </>
  );
};

const colored = (color) => (text) => <Ansi color={color}>{text}</Ansi>;
const bold = (text) => <strong>{text}</strong>;
const dim = (text) => <Dim>{text}</Dim>;
const header = (text) => <Inverse color={2}>{text}</Inverse>;
const selected = (text) => <span className="terminal-selection">{text}</span>;

// A meter is a label and a bar split into colored parts, then a percentage.
const meter = (label, parts, percent, barWidth) => {
  const used = parts.reduce((sum, [length]) => sum + length, 0);
  return [
    [label && `${label} `, bold],
    ...parts.map(([length, color]) => ["█".repeat(length), colored(color)]),
    ["░".repeat(barWidth - used), dim],
    [`${percent}%`.padStart(5)],
  ];
};

const processes = [
  ["412", "atlas", "18.2", "4.1", "node"],
  ["1033", "atlas", "6.4", "2.8", "ghostty"],
  ["88", "root", "1.1", "0.3", "launchd"],
  ["2210", "atlas", "0.4", "0.9", "zsh"],
];

const processText = ([pid, user, cpu, memory, command]) =>
  `${pid.padStart(5)} ${user.padEnd(6)} ${cpu.padStart(5)} ${memory.padStart(4)} ${command}`;

export const TuiSample = ({ compact }) => {
  if (compact) {
    const width = 16;
    return (
      <>
        <Edge width={width} left="╭" right="╮" title="CPU" />
        <Row
          width={width}
          cells={meter(
            "",
            [
              [6, 2],
              [2, 3],
            ],
            62,
            11,
          )}
        />
        <Edge width={width} left="├" right="┤" title="MEM" />
        <Row width={width} cells={meter("", [[4, 12]], 31, 11)} />
        <Frame>{`╰${"─".repeat(width + 2)}╯`}</Frame>
      </>
    );
  }
  const width = 34;
  return (
    <>
      <Prompt command="atlas-top" />
      <Edge width={width} left="╭" right="╮" title="System" />
      <Row
        width={width}
        cells={meter(
          "CPU",
          [
            [11, 2],
            [3, 3],
            [2, 1],
          ],
          62,
          24,
        )}
      />
      <Row width={width} cells={meter("MEM", [[7, 12]], 31, 24)} />
      <Row width={width} cells={meter("SWP", [[1, 9]], 4, 24)} />
      <Row
        width={width}
        cells={[
          ["NET ", bold],
          ["▁▂▃▅▇▆▄▂", colored(5)],
          ["▁▂▃▅▆▇█▆▄▃▂▁", colored(13)],
          ["  12 MB/s", colored(8)],
        ]}
      />
      <Edge width={width} left="├" right="┤" title="Processes" />
      <Row
        width={width}
        cells={[
          [processText(["PID", "USER", "CPU%", "MEM%", "COMMAND"]), header],
        ]}
        fill={header}
      />
      {processes.map((process, index) => (
        <Row
          key={process[0]}
          width={width}
          cells={[
            [
              processText(process),
              index === 0
                ? selected
                : process[1] === "root"
                  ? colored(9)
                  : undefined,
            ],
          ]}
          fill={index === 0 ? selected : undefined}
        />
      ))}
      <Frame>{`╰${"─".repeat(width + 2)}╯`}</Frame>
      {"\n"}
      {[
        ["F1", "Help  "],
        ["F5", "Tree  "],
        ["F9", "Kill  "],
        ["F10", "Quit  "],
      ].map(([key, action]) => (
        <Fragment key={key}>
          {key}
          <Inverse color={6}>{action}</Inverse>
        </Fragment>
      ))}
      {"\n\n"}
      <Ansi color={11}>{`╔═ Confirm ${"═".repeat(19)}╗`}</Ansi>
      {"\n"}
      <Ansi color={11}>║</Ansi>
      {" Kill process 412? "}
      <u>
        <strong>y</strong>
      </u>
      {"es / "}
      <Inverse>
        <strong>N</strong>o
      </Inverse>
      {"  "}
      <Ansi color={11}>║</Ansi>
      {"\n"}
      <Ansi color={11}>{`╚${"═".repeat(29)}╝`}</Ansi>
      {"\n\n"}
      <StyleRow />
    </>
  );
};
