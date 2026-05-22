import Share from 'react-native-share';

// ---------------------------------------------------------------------------
// Share a file from the local filesystem
// ---------------------------------------------------------------------------

export async function shareFile(
  filePath: string,
  title: string,
  mimeType?: string,
): Promise<void> {
  const type =
    mimeType ||
    (filePath.endsWith('.pdf')
      ? 'application/pdf'
      : filePath.endsWith('.json')
      ? 'application/json'
      : 'application/octet-stream');

  try {
    await Share.open({
      url: `file://${filePath}`,
      type,
      title,
      failOnCancel: false,
    });
  } catch (err) {
    // react-native-share throws when the user cancels on some platforms even
    // with failOnCancel: false. Swallow cancellation errors silently; re-throw
    // anything that looks like a real failure.
    const message = err instanceof Error ? err.message : String(err);
    const isCancellation =
      message.toLowerCase().includes('cancel') ||
      message.toLowerCase().includes('dismiss') ||
      message.toLowerCase().includes('user did not share');
    if (!isCancellation) {
      throw new Error(`Failed to share file: ${message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Share plain text
// ---------------------------------------------------------------------------

export async function shareText(text: string, title: string): Promise<void> {
  try {
    await Share.open({
      message: text,
      title,
      failOnCancel: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isCancellation =
      message.toLowerCase().includes('cancel') ||
      message.toLowerCase().includes('dismiss') ||
      message.toLowerCase().includes('user did not share');
    if (!isCancellation) {
      throw new Error(`Failed to share text: ${message}`);
    }
  }
}
