// Type derived from the API so callers pick up whatever WXT currently
// expects (e.g. the strict ManifestPermission union for `permissions`).
export type PermissionsRequest = Parameters<
  typeof browser.permissions.contains
>[0];

export function hasPermissions(perms: PermissionsRequest): Promise<boolean> {
  return browser.permissions.contains(perms);
}

// MUST stay synchronously callable from a click handler: chrome.permissions
// .request() only works inside the user-gesture window. Awaiting anything
// before calling this from onClick will make Chrome silently reject the prompt.
export function requestPermissions(
  perms: PermissionsRequest,
): Promise<boolean> {
  return browser.permissions.request(perms);
}

export function watchPermissions(callback: () => void): () => void {
  browser.permissions.onAdded.addListener(callback);
  browser.permissions.onRemoved.addListener(callback);
  return () => {
    browser.permissions.onAdded.removeListener(callback);
    browser.permissions.onRemoved.removeListener(callback);
  };
}
