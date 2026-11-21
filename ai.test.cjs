const {test}=require('node:test');
const assert=require('node:assert/strict');
const {findPath,interceptRoute,wireFits,solveWires,minimax}=require('../dist/ai.js');

test('A* avoids a wall and does not propose an interception after the van leaves',()=>{
  const canWalk=(x,y)=>x>=0&&x<6&&y>=0&&y<3&&!(x===2&&y===1);
  assert.equal(findPath([0,1],[4,1],canWalk).length,7);
  const route=interceptRoute([2,0],[[2,2],[3,2],[4,2],[5,2]],0,canWalk);
  assert.deepEqual(route.target,[3,2]);
  assert.equal(interceptRoute([0,0],[[4,1]],0,canWalk),null);
});

test('CSP completes compatible wires and rejects a conflicting duplicate',()=>{
  const allowed=[['red','blue'],['green','blue'],['yellow'],['green','red']];
  assert.ok(wireFits(solveWires(['','','yellow',''],allowed),allowed));
  assert.equal(solveWires(['blue','blue','',''],allowed),null);
});

test('Minimax distinguishes the two opening moves and picks a real block',()=>{
  const duel={lanes:4,exit:2,blocked:[[],[0],[2],[],[],[0,1,3]]};
  assert.deepEqual(minimax(duel,0,1,0),{move:2,score:1});
  assert.equal(minimax(duel,1,1,0,false).score,-1);
});
