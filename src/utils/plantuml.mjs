export function isPlantUmlSource(code) {
  return /^\s*@start(?:uml|mindmap|wbs|gantt|json|yaml)\b/i.test(code);
}

export function cleanPlantUml(code) {
  const value = code.replace(/\r\n?/g, '\n').trim();
  return isPlantUmlSource(value) ? value : `@startuml\n${value}\n@enduml`;
}

// Hash source, never compressed bytes: Node zlib and browser encoders differ.
export function plantUmlSlug(code) {
  const source = cleanPlantUml(code);
  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i++) {
    hash = Math.imul(hash ^ source.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
