// Validate the complete solver result before replacing any home-plan item.
export function applyRoomLayout(items, placements, roomId) {
  const targets = new Map(items.filter(i => i.design && i.space_id === roomId).map(i => [i.id, i]));
  const updates = new Map(), seen = new Set(), ids = new Set(items.map(i => i.id));
  if (ids.size !== items.length || !Array.isArray(placements)) throw new Error('Yerleşim kimlikleri geçersiz.');
  for (const p of placements) {
    if (!p || typeof p.id !== 'string' || seen.has(p.id) || !Array.isArray(p.pos_xy_mm) || p.pos_xy_mm.length !== 2 || !p.pos_xy_mm.every(Number.isFinite) || !Number.isFinite(p.rot_deg)) throw new Error('Yerleşim ölçüleri geçersiz.');
    seen.add(p.id);
    if (p.kind === 'majlis') {
      const item = targets.get(p.source_id), size = p.size_mm;
      if (!item || item.design.kind !== 'majlis' || ids.has(p.id) || !size || !['w', 'd', 'h'].every(k => Number.isFinite(size[k]) && size[k] > 0)) throw new Error('Meclis parçaları ana kayıtla eşleşmiyor.');
      const segments = updates.get(item.id) || [];
      segments.push({...p, pos_xy_mm: [...p.pos_xy_mm], size_mm: {...size}}); updates.set(item.id, segments);
    } else {
      const item = targets.get(p.id);
      if (!item || item.design.kind === 'majlis') throw new Error('Yerleşim eşya kaydıyla eşleşmiyor.');
      updates.set(item.id, {...item, pos_xy_mm: [...p.pos_xy_mm], rot_deg: p.rot_deg});
    }
  }
  if (updates.size !== targets.size) throw new Error('Yerleşimde eksik eşya var.');
  return items.map(item => !updates.has(item.id) ? item : item.design.kind === 'majlis' ? {...item, layout_segments: updates.get(item.id)} : updates.get(item.id));
}

// Keep the customer's single majlis request for re-solving; draw its measured seat runs.
export function placedItems(items = []) {
  return items.flatMap(item => item.design?.kind !== 'majlis' ? [item] :
    (item.layout_segments || []).map(p => ({...item, ...p, design: item.design})));
}
