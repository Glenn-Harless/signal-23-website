// *.content.html files are imported as raw markup strings (webpack `asset/source`).
declare module '*.content.html' {
  const html: string;
  export default html;
}
