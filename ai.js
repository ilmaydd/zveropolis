// Week 2. Four-way A* with a Manhattan-distance estimate.
function findPath(start, goal, canWalk, maxSteps=Infinity) {
  const key = ([x,y]) => x+','+y;
  const estimate = ([x,y]) => Math.abs(x-goal[0])+Math.abs(y-goal[1]);
  const open=[{point:start,path:[start],g:0}];
  const best=new Map([[key(start),0]]);
  while(open.length) {
    open.sort((a,b)=>a.g+estimate(a.point)-b.g-estimate(b.point));
    const {point,path,g}=open.shift();
    if(key(point)===key(goal)) return path;
    if(g===maxSteps) continue;
    if(g>best.get(key(point))) continue;
    const [x,y]=point;
    for(const next of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
      const id=key(next);
      if(!canWalk(...next)||g+1>=(best.get(id)??Infinity)) continue;
      best.set(id,g+1);
      open.push({point:next,path:[...path,next],g:g+1});
    }
  }
  return [];
}
function interceptRoute(judy, vanRoute, turn, canWalk) {
  for(let i=Math.floor(turn/2);i<vanRoute.length;i++) {
    const timeUntilDeparture=(i+1)*2-turn-1;
    const route=findPath(judy,vanRoute[i],canWalk,timeUntilDeparture);
    if(route.length) return {route,target:vanRoute[i]};
  }
  return null;
}

// Week 3. Try unused sockets, pruning branches that violate a rule.
function wireFits(wires, allowed) {
  const placed=wires.filter(Boolean);
  return new Set(placed).size===placed.length&&wires.every((wire,i)=>!wire||allowed[i].includes(wire));
}
function solveWires(wires, allowed) {
  if(!wireFits(wires,allowed)) return null;
  const blank=wires.indexOf('');
  if(blank===-1) return wires;
  for(const wire of allowed[blank]) {
    const option=[...wires];
    option[blank]=wire;
    const solution=solveWires(option,allowed);
    if(solution) return solution;
  }
  return null;
}

// Week 4. Judy maximizes her result. Bellwether minimizes it.
function laneChoices(lane, count) {
  return [lane-1,lane,lane+1].filter(i=>i>=0&&i<count);
}
function duelMoves(board,column,lane,guard) {
  if(column===board.blocked.length-1) return [];
  return laneChoices(lane,board.lanes).filter(i=>(column+1===board.blocked.length-1||i!==guard)&&!board.blocked[column+1].includes(i));
}
function minimax(board,column,lane,guard,playerTurn=true) {
  if(column===board.blocked.length-1) return {score:lane===board.exit?1:-1,move:null};
  const moves=playerTurn?duelMoves(board,column,lane,guard):laneChoices(guard,board.lanes);
  if(!moves.length) return {score:-1,move:null};
  const options=moves.map(move=>({
    move,
    score:playerTurn?minimax(board,column+1,move,guard,false).score:minimax(board,column,lane,move,true).score
  }));
  return options.reduce((best,next)=>(playerTurn?next.score>best.score:next.score<best.score)?next:best);
}
if(typeof module!=='undefined') module.exports={findPath,interceptRoute,wireFits,solveWires,duelMoves,minimax};
