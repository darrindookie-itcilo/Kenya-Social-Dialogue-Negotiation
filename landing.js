'use strict';
(() => {
 const announcement='Ladies and gentlemen, this is your captain speaking. We will be landing in five minutes. Please bring your negotiation to a close and write down your outcome before landing. Thank you.';
 let context, sources=[], voiceTimer=null, finishTimer=null, playback=0;
 let remaining=300000, deadline=0, clock=null;
 const time=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
 function status(message){document.querySelectorAll('[data-landing-status]').forEach(el=>el.textContent=message);}
 function stop(){
  playback++;
  clearTimeout(voiceTimer);clearTimeout(finishTimer);
  sources.forEach(node=>{try{node.stop();}catch{}try{node.disconnect();}catch{}});sources=[];
  window.speechSynthesis?.cancel();
  document.querySelectorAll('[data-landing="stop"]').forEach(el=>el.disabled=true);
 }
 async function play(spoken){
  stop();const current=playback;
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)throw new Error('Audio unavailable');
   context??=new Audio();
   await context.resume();if(current!==playback)return;
   if(context.state!=='running')throw new Error('Audio unavailable');
   const start=context.currentTime+.03;
   // An original two-tone cabin chime; no airline recording or remote asset.
   [880,659.255].forEach((frequency,i)=>{
    [1,2,3].forEach((harmonic,j)=>{
     const oscillator=context.createOscillator(),gain=context.createGain(),at=start+i*.65;
     oscillator.type='sine';oscillator.frequency.value=frequency*harmonic;
     gain.gain.setValueAtTime(.0001,at);
     gain.gain.exponentialRampToValueAtTime([.19,.035,.009][j],at+.025);
     gain.gain.exponentialRampToValueAtTime(.0001,at+1.7);
     oscillator.connect(gain);gain.connect(context.destination);
     oscillator.start(at);oscillator.stop(at+1.75);sources.push(oscillator);
    });
   });
   document.querySelectorAll('[data-landing="stop"]').forEach(el=>el.disabled=false);
   const english=window.speechSynthesis?.getVoices().filter(v=>/^en(?:-|_)/i.test(v.lang))||[];
   const local=english.filter(v=>v.localService);
   const voice=local.find(v=>/^en-GB/i.test(v.lang))||local[0]||english[0];
   if(spoken&&voice&&window.SpeechSynthesisUtterance){
    status('Cabin chime, followed by the captain’s five-minute announcement.');
    voiceTimer=setTimeout(()=>{
     if(current!==playback)return;
     const utterance=new SpeechSynthesisUtterance(announcement);
     utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.92;utterance.pitch=.88;utterance.volume=1;
     utterance.onend=()=>{if(current===playback){status('Announcement complete.');stop();}};
     utterance.onerror=()=>{if(current===playback){status('Voice playback is unavailable. The announcement text is shown below.');stop();}};
     window.speechSynthesis.speak(utterance);
    },2450);
    finishTimer=setTimeout(()=>{if(current===playback){status('Read the announcement below if the voice did not play.');stop();}},30000);
   }else{
    status(spoken?'Cabin chime playing. This browser has no English voice; read the announcement below.':'Cabin chime playing.');
    finishTimer=setTimeout(()=>{if(current===playback){status(spoken?'Cabin chime complete. Read the announcement below.':'Cabin chime complete.');stop();}},2450);
   }
  }catch{
   status('Sound could not play. Check your device sound and read the announcement below.');stop();
  }
 }
 function updateClock(){
  if(deadline)remaining=Math.max(0,deadline-Date.now());
  if(deadline&&remaining===0){deadline=0;clearInterval(clock);clock=null;}
  document.querySelectorAll('[data-eggs-time]').forEach(el=>el.textContent=time(remaining));
  document.querySelectorAll('[data-landing="timer"]').forEach(el=>el.textContent=deadline?'Pause timer':remaining===0?'Start five minutes':remaining===300000?'Start five minutes':'Resume timer');
  document.querySelectorAll('[data-eggs-timer-message]').forEach(el=>el.textContent=remaining===0?'Time to land. Record your outcome.':deadline?'Negotiate and stay in role.':'Five minutes to negotiate.');
 }
 function pauseTimer(){if(deadline){remaining=Math.max(0,deadline-Date.now());deadline=0;}clearInterval(clock);clock=null;updateClock();}
 function toggleTimer(){
  if(deadline){pauseTimer();return;}
  if(remaining===0)remaining=300000;
  deadline=Date.now()+remaining;clock=setInterval(updateClock,250);updateClock();
 }
 function resetTimer(){pauseTimer();remaining=300000;updateClock();}
 function markup(timer=false){return `<section class="landing-controls" aria-label="Ostrich Eggs cabin sound${timer?' and negotiation timer':''}">
  ${timer?`<div class="egg-clock"><div><span>NEGOTIATION TIME</span><strong data-eggs-time>${time(deadline?deadline-Date.now():remaining)}</strong></div><div><div class="actions"><button class="btn" data-landing="timer">${deadline?'Pause timer':remaining===300000||remaining===0?'Start five minutes':'Resume timer'}</button><button class="btn secondary" data-landing="reset">Reset timer</button></div><p data-eggs-timer-message>${remaining===0?'Time to land. Record your outcome.':deadline?'Negotiate and stay in role.':'Five minutes to negotiate.'}</p></div></div>`:''}
  <h3>Cabin sound</h3><div class="actions"><button class="btn" data-landing="announcement">Play landing announcement</button><button class="btn secondary" data-landing="chime">Chime only</button><button class="btn secondary" data-landing="stop" disabled>Stop sound</button></div>
  <p class="landing-status" data-landing-status role="status">Sound plays only when you press a button.</p>
  <details class="landing-transcript"><summary>Announcement text</summary><p>${announcement}</p></details>
 </section>`;}
 document.addEventListener('click',e=>{
  const button=e.target.closest('button[data-landing]');if(!button)return;
  const action=button.dataset.landing;
  if(action==='announcement')play(true);
  if(action==='chime')play(false);
  if(action==='stop'){stop();status('Sound stopped.');}
  if(action==='timer')toggleTimer();
  if(action==='reset')resetTimer();
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateClock();});
 window.NaivashaLanding={markup,stop,pauseTimer};
})();
