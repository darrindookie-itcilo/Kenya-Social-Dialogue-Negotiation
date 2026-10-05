'use strict';
(() => {
 const ROUND=90000, HALFWAY=45000;
 let remaining=ROUND, deadline=0, clock=null, halfwayCalled=false;
 let context, sources=[], finishTimer=null, playback=0;
 let soundMessage='Press Start for automatic cues, or play the 45-second cue yourself.';
 const time=ms=>{const seconds=Math.max(0,Math.ceil(ms/1000));return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');};
 const each=(selector,fn)=>document.querySelectorAll(selector).forEach(fn);
 const text=(selector,value)=>each(selector,el=>{if(el.textContent!==value)el.textContent=value;});
 function soundStatus(message){soundMessage=message;text('[data-triad-sound-status]',message);}
 function stopSound(){
  playback++;clearTimeout(finishTimer);finishTimer=null;
  sources.forEach(node=>{try{node.stop();}catch{}try{node.disconnect();}catch{}});sources=[];
  each('[data-triad="stop"]',el=>el.disabled=true);
 }
 async function audio(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)throw new Error('Audio unavailable');
  context??=new Audio();await context.resume();
  if(context.state!=='running')throw new Error('Audio unavailable');
  return context;
 }
 async function playCue(end=false){
  stopSound();const current=playback;
  try{
   const ctx=await audio();if(current!==playback)return;
   // Original short alarm: three bright pulses at halfway, two lower tones at the end.
   const tones=end?[659.255,523.251]:[880,1174.659,880],start=ctx.currentTime+.02;
   tones.forEach((frequency,i)=>{
    const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=start+i*.25;
    oscillator.type='sine';oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(.24,at+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.21);
    oscillator.connect(gain);gain.connect(ctx.destination);
    oscillator.start(at);oscillator.stop(at+.23);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};sources.push(oscillator);
   });
   each('[data-triad="stop"]',el=>el.disabled=false);
   soundStatus(end?'90 seconds complete. End chime playing.':'45-second halfway alarm playing. Say “Halfway”.');
   finishTimer=setTimeout(()=>{
    if(current!==playback)return;
    stopSound();soundStatus(end?'End chime complete. The listener now paraphrases for 30 seconds.':'Halfway cue complete. The speaker continues until 90 seconds.');
   },tones.length*250+100);
  }catch{
   if(current!==playback)return;
   stopSound();soundStatus('Sound could not play. Check your device sound; use the visible timer and call the cue aloud.');
  }
 }
 function phase(){
  if(remaining===0)return '90 seconds complete · Paraphrase for 30 seconds';
  if(remaining===ROUND&&!deadline)return 'Ready for a new round';
  const label=remaining>HALFWAY?'First half · Show full attention':'Second half · Change visible attention';
  return deadline?label:'Paused · '+label;
 }
 function draw(){
  text('[data-triad-time]',time(remaining));text('[data-triad-phase]',phase());
  text('[data-triad="timer"]',deadline?'Pause timer':remaining===0?'Start next round':remaining===ROUND?'Start 90-second round':'Resume timer');
  each('[data-triad-progress]',el=>el.value=Math.min(90,Math.max(0,(ROUND-remaining)/1000)));
 }
 function tick(){
  if(!deadline)return;
  remaining=Math.max(0,Math.min(ROUND,deadline-Date.now()));
  if(remaining===0){
   deadline=0;clearInterval(clock);clock=null;halfwayCalled=true;void playCue(true);
  }else if(remaining<=HALFWAY&&!halfwayCalled){halfwayCalled=true;void playCue();}
  draw();
 }
 function pause(){
  const wasPlaying=sources.length>0||finishTimer!==null;
  if(deadline)remaining=Math.max(0,Math.min(ROUND,deadline-Date.now()));
  deadline=0;clearInterval(clock);clock=null;stopSound();
  if(remaining!==ROUND&&remaining!==0)soundStatus('Timer paused. Resume when the room is ready.');
  else if(wasPlaying)soundStatus('Sound stopped.');
  draw();
 }
 function reset(){pause();remaining=ROUND;halfwayCalled=false;soundStatus('Ready for a new round. Rotate roles, then press Start.');draw();}
 async function toggleTimer(){
  if(deadline){pause();return;}
  stopSound();const current=playback;
  if(remaining===0){remaining=ROUND;halfwayCalled=false;}
  deadline=Date.now()+remaining;clock=setInterval(tick,100);draw();
  try{await audio();if(current===playback&&deadline)soundStatus('Automatic sound cues armed: halfway at 45 seconds, end at 90 seconds.');}
  catch{if(current===playback&&deadline)soundStatus('Timer running. Sound is unavailable; call the halfway and end cues aloud.');}
 }
 function markup(){return `<section class="card triad-desk" aria-labelledby="triad-title">
  <span class="eyebrow">Tuesday · Day 2 · Session 4</span><h2 id="triad-title">Triad Exercise</h2>
  <p class="triad-intro">A 90-second speaking round. A short alarm marks <strong>halfway at 45 seconds</strong>; a different chime marks the end at 90 seconds.</p>
  <div class="triad-console"><div class="triad-clock"><span>Speaking time remaining</span><strong data-triad-time role="timer" aria-live="off" aria-label="Time remaining in the speaking round">${time(remaining)}</strong><progress data-triad-progress value="${(ROUND-remaining)/1000}" max="90" aria-label="Speaking round progress"></progress><div class="triad-marks"><span>Start</span><span>45s · Halfway</span><span>90s · End</span></div></div>
  <div class="triad-controls"><p class="triad-phase" data-triad-phase role="status">${phase()}</p><div class="actions"><button class="btn" data-triad="timer">${deadline?'Pause timer':remaining===0?'Start next round':remaining===ROUND?'Start 90-second round':'Resume timer'}</button><button class="btn secondary" data-triad="reset">Reset round</button></div><div class="actions triad-sound-actions"><button class="btn secondary" data-triad="cue">Play 45-second cue</button><button class="btn secondary" data-triad="stop" disabled>Stop sound</button></div><p class="triad-sound-status" data-triad-sound-status role="status">${soundMessage}</p></div></div>
  <details class="triad-instructions"><summary>Roles and instructions</summary><ol><li><strong>Speaker:</strong> speak for 90 seconds about an ordinary thing at work you would change. Everyone knows the listener will change their visible attention halfway through.</li><li><strong>Listener, first 45 seconds:</strong> show full attention through eye contact, nodding and mirroring. Listen without advice, questions or your own story.</li><li><strong>At the halfway cue:</strong> look away or at your phone or notes, without eye contact or a visible response. Keep listening so you can paraphrase afterwards.</li><li><strong>Observer:</strong> watch the speaker and note when their speech or behaviour changes.</li><li><strong>At 90 seconds:</strong> the listener paraphrases for 30 seconds, then the observer shares what they saw. Rotate twice so everyone plays all three roles.</li></ol></details>
  <p class="triad-tip">Use the sound on one device for the room. If you time the exercise yourself, press <strong>Play 45-second cue</strong> at halfway. Leaving this page pauses the timer.</p>
 </section>`;}
 document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-triad]');if(!button)return;
  if(button.dataset.triad==='timer')void toggleTimer();
  if(button.dataset.triad==='reset')reset();
  if(button.dataset.triad==='cue')void playCue();
  if(button.dataset.triad==='stop'){stopSound();soundStatus('Sound stopped.');}
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
 window.addEventListener('pagehide',pause);
 window.NaivashaTriad={markup,pause};
})();
