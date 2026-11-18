/** Snippets are derived data, not a second state copy of the form inputs. */
export function deriveEmbedOutput(embedUrl: string, embedLabel: string) {
  return {
    embedUrl,
    embedLabel,
    markdownCode: embedUrl ? `![${embedLabel}](${embedUrl})` : "",
    htmlCode: embedUrl ? `<img src="${embedUrl}" alt="${embedLabel}" />` : "",
  };
}
