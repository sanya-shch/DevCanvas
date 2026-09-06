export function readDevCanvasFile(file: File): Promise<string> {
  return file.text();
}
