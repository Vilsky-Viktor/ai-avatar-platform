export function encode(text: string): string {
  return btoa(text);
}

export function decode(base64String: string): string {
  return atob(base64String);
}