
export const isNumeric = (s: string) => /^[+-]?\d+(\.\d+)?$/.test(s)

function isJsonString(str: string) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}