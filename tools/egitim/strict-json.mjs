// No repair, fences, duplicate keys, unsafe property names or non-finite numbers.
export function strictJSON(text) {
  if (typeof text !== 'string' || text.length > 200000) throw Error('text_limit');
  let i = 0;
  const ws = () => { while (i < text.length && /[ \t\r\n]/.test(text[i])) i++; };
  const string = () => {
    const start = i++;
    while (i < text.length) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i++] === '"') return JSON.parse(text.slice(start, i));
    }
    throw Error('unterminated_string');
  };
  function value(depth = 0) {
    if (depth > 32) throw Error('depth_limit');
    ws(); const c = text[i];
    if (c === '"') return string();
    if (c === '{') {
      i++; const out = {}, seen = new Set(); ws();
      if (text[i] === '}') { i++; return out; }
      while (i < text.length) {
        ws(); if (text[i] !== '"') throw Error('object_key');
        const key = string();
        if (seen.has(key)) throw Error('duplicate_key');
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw Error('unsafe_key');
        seen.add(key); ws(); if (text[i++] !== ':') throw Error('colon');
        out[key] = value(depth + 1); ws(); const sep = text[i++];
        if (sep === '}') return out;
        if (sep !== ',') throw Error('object_delimiter');
      }
      throw Error('unterminated_object');
    }
    if (c === '[') {
      i++; const out = []; ws(); if (text[i] === ']') { i++; return out; }
      while (i < text.length) {
        out.push(value(depth + 1)); ws(); const sep = text[i++];
        if (sep === ']') return out;
        if (sep !== ',') throw Error('array_delimiter');
      }
      throw Error('unterminated_array');
    }
    for (const token of ['true', 'false', 'null']) if (text.slice(i, i + token.length) === token) {
      i += token.length; return JSON.parse(token);
    }
    const match = text.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) throw Error('value');
    i += match[0].length; const n = Number(match[0]);
    if (!Number.isFinite(n)) throw Error('nonfinite_number');
    return n;
  }
  const out = value(); ws(); if (i !== text.length) throw Error('trailing_text');
  return out;
}
