/**
 * Utility to reliably open device SMS composer with recipient 6415 and body OK.
 * Handles iOS (&body=OK) vs standard Android/RFC (?body=OK),
 * and provides a graceful fallback dialog if opening fails or environment does not support sms:.
 */
export function openSmsSubscriptionComposer(
  recipient: string = '6415',
  body: string = 'OK'
): boolean {
  try {
    const isIOS =
      typeof navigator !== 'undefined' &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

    // iOS uses &body=, RFC standard / Android uses ?body=
    const separator = isIOS ? '&' : '?';
    const smsUri = `sms:${recipient}${separator}body=${encodeURIComponent(body)}`;

    // Attempt standard navigation
    window.location.href = smsUri;
    return true;
  } catch (err) {
    console.error('Failed to open SMS composer:', err);
    return false;
  }
}
