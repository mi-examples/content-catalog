/**
 * Copies text to the clipboard.
 *
 * The async Clipboard API is blocked in some contexts (permission denied when
 * the document is not focused, or a non-secure origin), so a hidden-textarea
 * `execCommand` copy is used as a fallback before giving up.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    // fall through to the legacy path
  }

  try {
    const textarea = document.createElement('textarea');

    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');

    document.body.removeChild(textarea);

    return copied;
  } catch {
    return false;
  }
}
