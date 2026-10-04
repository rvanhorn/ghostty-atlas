const repository = "mbadolato/iTerm2-Color-Schemes";

const fetchResponse = async (fetcher, url, token) => {
  const response = await fetcher(url, {
    headers: {
      "User-Agent": "ghostty-atlas-theme-refresh",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok)
    throw new Error(`Theme download failed (${response.status}): ${url}`);
  return response;
};

export const loadUpstreamThemes = async (
  fetcher = fetch,
  { token = process.env.GITHUB_TOKEN } = {},
) => {
  const response = await fetchResponse(
    fetcher,
    `https://api.github.com/repos/${repository}/git/trees/master?recursive=1`,
    token,
  );
  const snapshot = await response.json();
  if (snapshot.truncated || !/^[a-f0-9]{40}$/.test(snapshot.sha))
    throw new Error("Upstream theme listing is incomplete or invalid.");
  const files = snapshot.tree.filter(
    (entry) => entry.type === "blob" && /^ghostty\/[^/]+$/.test(entry.path),
  );
  if (!files.length) throw new Error("No upstream Ghostty themes found.");
  const sources = [];
  for (let offset = 0; offset < files.length; offset += 12) {
    const batch = await Promise.all(
      files.slice(offset, offset + 12).map(async (entry) => {
        const filePath = entry.path
          .split("/")
          .map(encodeURIComponent)
          .join("/");
        const themeResponse = await fetchResponse(
          fetcher,
          `https://raw.githubusercontent.com/${repository}/${snapshot.sha}/${filePath}`,
        );
        return {
          name: entry.path.slice("ghostty/".length),
          source: await themeResponse.text(),
        };
      }),
    );
    sources.push(...batch);
  }
  return { sources, revision: snapshot.sha };
};
