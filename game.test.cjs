const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const {join}=require('node:path');

test('Campaign unlocks each mission and reaches the final broadcast',()=>{
  const elements=new Map(), save=new Map();
  const getElementById=id=>{
    if(!elements.has(id)) elements.set(id,{
      listeners:{},hidden:false,innerHTML:'',textContent:'',
      addEventListener(type,fn){this.listeners[type]=fn;},focus(){},querySelector(){return null;}
    });
    return elements.get(id);
  };
  const context=vm.createContext({
    document:{getElementById,addEventListener(){}},
    localStorage:{getItem:key=>save.get(key)??null,setItem:(key,value)=>save.set(key,String(value))}
  });
  for(const file of ['ai.js','game.js']) vm.runInContext(readFileSync(join(__dirname,'../dist',file),'utf8'),context);
  const run=code=>vm.runInContext(code,context);
  const click=(action,value)=>getElementById('campaign').listeners.click({target:{closest:()=>({dataset:{action,value}})}});
  getElementById('start').listeners.click();

  click('chapter','2');
  assert.equal(run('chapter'),0);
  for(let i=0;i<14&&!run('won');i++){
    const hint=run('interceptRoute(judy,vanRoute,turns,streetOpen)');
    assert.ok(hint);
    click('step',hint.route[1].join(','));
  }
  assert.equal(run('won'),true);
  click('next');
  click('wire','0,yellow');
  click('check');
  assert.equal(run('won'),false);
  const solution=Array.from(run("solveWires(['','','',''],allowed)"));
  solution.forEach((wire,i)=>click('wire',i+','+wire));
  click('check');
  assert.equal(run('won'),true);
  click('next');

  click('lane','1');
  assert.equal(run('won'),false);
  click('retry');
  for(let i=0;i<5;i++){
    const next=run('minimax(duel,column,lane,guard).move');
    click('lane',String(next));
  }
  assert.equal(run('won'),true);
  assert.equal(save.get('zveropolis-night-broadcast'),'3');
  assert.match(getElementById('debrief').innerHTML,/Іс жабылды/);
});
