/** The optional platform badge can be blocked outside its host. Keep it visible as a warning;
 * application requests, other origins and unexpected failures remain errors. */
export function isExternalBrandingFailure({ text, url }) {
  return (
    url === "https://grok.com/grok-app-builder/extensions.js" &&
    /net::ERR_(?:CERT_AUTHORITY_INVALID|BLOCKED_BY_RESPONSE\.NotSameOrigin)(?:\s|$)/.test(text)
  );
}
