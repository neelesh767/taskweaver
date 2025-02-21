/**
 * Generates a random 32-character string, which is used as a nonce to ensure
 * scripts loaded by the webview are loaded only once.
 *
 * @returns A 32-character string, suitable for use as a nonce.
 */
export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
