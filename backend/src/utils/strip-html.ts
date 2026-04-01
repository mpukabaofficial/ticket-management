/**
 * Strip HTML tags from a string, preserving readable text content.
 * Removes style/script blocks, converts block-level elements to newlines,
 * decodes HTML entities, and collapses whitespace.
 */
export function stripHtml(html: string): string {
  const stripped = (
    html
      // Remove <style>...</style> and <script>...</script> blocks entirely
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      // Remove HTML comments (including conditional comments like <!--[if mso]>...<![endif]-->)
      .replace(/<!--[\s\S]*?-->/g, "")
      // Replace <br>, <br/>, <br /> with newlines
      .replace(/<br\s*\/?>/gi, "\n")
      // Replace block-level closing tags with newlines
      .replace(/<\/(p|div|li|tr|h[1-6]|blockquote|td)>/gi, "\n")
      // Remove all remaining HTML tags
      .replace(/<[^>]*>/g, "")
      // Decode common HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&pound;/g, "£")
      .replace(/&euro;/g, "€")
      .replace(/&copy;/g, "©")
      // Decode numeric HTML entities (&#123; and &#x1A;)
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      // Collapse multiple blank lines into one
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );

  // Strip email signature (everything after "-- " on its own line)
  const sigIndex = stripped.search(/^\s*--\s*$/m);
  const body = sigIndex !== -1 ? stripped.slice(0, sigIndex) : stripped;

  // Remove [image: ...], [photo], [cid:...] and similar bracket artifacts
  return body.replace(/\[[^\]]*\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
