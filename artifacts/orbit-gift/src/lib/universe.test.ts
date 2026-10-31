import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveSources } from './sources';
import { CX, CY, giftAngle, giftRoute, loveArcs, lovePoints } from '../components/starfield';

const loves = [{ id: 'tea', text: 'Earl Grey' }, { id: 'food', text: 'German food' }, { id: 'letter', text: 'X' }];
test('explicit one/two sources resolve only to exact current loves', () => {
  assert.deepEqual(resolveSources({ because: '', sourceLoves: ['earl grey', 'German food'] }, loves), { ids: ['tea', 'food'], names: ['Earl Grey', 'German food'] });
  assert.equal(resolveSources({ because: 'Earl Grey', sourceLoves: ['Earl Grey', 'unknown'] }, loves), null);
  assert.equal(resolveSources({ because: 'Earl Grey', sourceLoves: [] }, loves), null);
  assert.equal(resolveSources({ because: 'Earl Grey', sourceLoves: ['Earl Grey', ''] }, loves), null);
});
test('legacy exact sources work, but prose and substrings never invent a link', () => {
  assert.deepEqual(resolveSources({ because: 'X' }, loves)?.ids, ['letter']);
  assert.deepEqual(resolveSources({ because: 'Earl Grey + German food' }, loves)?.ids, ['tea', 'food']);
  assert.equal(resolveSources({ because: 'A lovely Earl Grey gift' }, loves), null);
  assert.equal(resolveSources({ because: 'German' }, loves), null);
  assert.equal(resolveSources({ because: 'Earl Grey + unknown' }, loves), null);
});
test('duplicate chip names share the same genuine source; deleted loves fall back', () => {
  assert.deepEqual(resolveSources({ because: 'Earl Grey' }, [...loves, { id: 'tea2', text: ' Earl Grey ' }])?.ids, ['tea', 'tea2']);
  assert.equal(resolveSources({ because: 'Earl Grey' }, loves.filter(love => love.id !== 'tea')), null);
});
test('all love/gift connection segments avoid the central planet', () => {
  const pts = lovePoints(Array.from({ length: 30 }, (_, i) => ({ id: String(i), text: `Love ${i}` })));
  const paths = [...loveArcs(pts), ...pts.flatMap(p => Array.from({ length: 6 }, (_, i) => giftRoute(p, giftAngle(i, 6))))];
  for (const path of paths) {
    const coordinates = [...path.d.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map(m => [Number(m[1]), Number(m[2])]);
    assert.ok(coordinates.length > 1);
    for (let i = 1; i < coordinates.length; i++) {
      const [ax, ay] = coordinates[i - 1], [bx, by] = coordinates[i];
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((CX - ax) * dx + (CY - ay) * dy) / (dx * dx + dy * dy || 1)));
      assert.ok(Math.hypot(ax + t * dx - CX, ay + t * dy - CY) > 50, 'connection cuts through planet');
    }
  }
});
test('adding a love does not move the existing stars', () => {
  const before = new Map(lovePoints(loves).map(p => [p.id, p]));
  for (const p of lovePoints([...loves, { id: 'new', text: 'New love' }])) {
    const old = before.get(p.id);
    if (old) assert.deepEqual([p.x, p.y], [old.x, old.y]);
  }
});
