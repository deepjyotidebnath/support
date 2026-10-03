const DEV=/[\u0900-\u097F]/;
const HINGLISH=/\b(kya|kab|kaise|kahan|hai|hain|mera|meri|aap|ka|ki|ke|paisa|wapas|bhejo|chahiye|samay|dukan|order kahan|kitna|nahi|madad)\b/i;
let faqs=[
 {id:'hours',name:'Store hours',kw:['hour','open','close','timing','time','samay','khula','khulta','dukan','दुकान','समय','खुल','बंद'],
  en:'We are open every day, 9 am to 9 pm. On festival days we stay open until 11 pm.',hi:'हम रोज़ सुबह 9 बजे से रात 9 बजे तक खुले रहते हैं। त्योहारों पर रात 11 बजे तक।'},
 {id:'delivery',name:'Delivery',kw:['deliver','shipping','ship','charge','courier','डिलीवरी','पहुंच','kitne din','kab tak'],
  en:'Delivery takes 1–2 days within the city and 3–5 days elsewhere in India. It is free above ₹999; otherwise ₹60.',hi:'शहर में 1–2 दिन और बाकी भारत में 3–5 दिन लगते हैं। ₹999 से ऊपर डिलीवरी मुफ़्त है, वरना ₹60।'},
 {id:'refund',name:'Refund & returns',kw:['refund','return','cancel','money back','wapas','वापस','रिफंड','पैसे','paisa'],
  en:'Sealed items can be returned within 7 days. Refunds reach your account in 3–5 working days.',hi:'सील बंद सामान 7 दिन में वापस हो सकता है। रिफंड 3–5 कार्य दिवस में आपके खाते में आ जाता है।'},
 {id:'payment',name:'Payment options',kw:['pay','upi','card','cod','cash','payment','भुगतान','पेमेंट','paise dene'],
  en:'We accept UPI, cards, net banking and cash on delivery (up to ₹5,000).',hi:'हम UPI, कार्ड, नेट बैंकिंग और कैश ऑन डिलीवरी (₹5,000 तक) स्वीकार करते हैं।'},
 {id:'location',name:'Store location',kw:['where','address','location','kahan','पता','कहाँ','कहां','map','siliguri'],
  en:'Visit us at Hill Cart Road, Siliguri, near the City Centre mall.',hi:'हमारी दुकान हिल कार्ट रोड, सिलीगुड़ी में सिटी सेंटर मॉल के पास है।'},
 {id:'hello',name:'Greeting',kw:['hello','hi','hey','namaste','नमस्ते','हेलो','हाय'],
  en:'Hello! I can help with timings, delivery, refunds, payments and order status.',hi:'नमस्ते! मैं समय, डिलीवरी, रिफंड, पेमेंट और ऑर्डर की जानकारी में मदद कर सकता हूँ।'}
];
const HANDOFF=/\b(agent|human|person|manager|complaint|talk to someone|insaan)\b|इंसान|एजेंट|शिकायत|मैनेजर|किसी से बात/i;
const ST={ch:'Web',tab:'chat',handoff:false,misses:0,log:[],thinking:false};
const CH={Web:{c:'#0f5c4d',sub:'Website widget'},WhatsApp:{c:'#128c7e',sub:'WhatsApp Business'},Facebook:{c:'#1b64d1',sub:'Facebook Messenger'}};
const $=s=>document.querySelector(s);
const msgs=$('#msgs');

function lang(t){return DEV.test(t)?'hi':(HINGLISH.test(t)?'hi-en':'en')}
function say(cls,text,meta){const d=document.createElement('div');d.className='m '+cls;d.textContent=text;if(meta){const s=document.createElement('small');s.textContent=meta;d.appendChild(s)}msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;return d}
function sys(t){const d=document.createElement('div');d.className='sys';d.textContent=t;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight}

function understand(t){
  const low=t.toLowerCase();
  const m=low.match(/\b\d{4,}\b/);
  if(m&&/order|ऑर्डर|status|track|kahan|कहाँ/.test(low)||(/^\s*(ord)?-?\d{4,}\s*$/.test(low)))
    return {id:'order',num:(m||low.match(/\d{4,}/))[0]};
  let best=null,bs=0;
  for(const f of faqs){let s=0;for(const k of f.kw){if(low.includes(k.toLowerCase()))s+=Math.max(1,k.length/4)}
    if(s>bs){bs=s;best=f}}
  return bs>0?best:null;
}
function reply(t){
  const L=lang(t),hi=L!=='en';
  if(HANDOFF.test(t))return {intent:'handoff',handoff:true};
  const r=understand(t);
  if(r&&r.id==='order'){
    const steps=['Packed','Out for delivery','Delivered'];const s=steps[parseInt(r.num.slice(-1))%3];
    return {intent:'order',text:hi?`ऑर्डर #${r.num} की स्थिति: ${s==='Packed'?'पैक हो गया':s==='Delivered'?'डिलीवर हो गया':'डिलीवरी के लिए निकल चुका'}।`:`Order #${r.num} status: ${s}.`};
  }
  if(/order|ऑर्डर|track|ट्रैक/i.test(t)&&!r)return {intent:'order',text:hi?'कृपया अपना ऑर्डर नंबर भेजें (जैसे 48213)।':'Please share your order number (for example 48213) and I will check it.'};
  if(r)return {intent:r.name,text:hi?r.hi:r.en};
  return null;
}

function bot(t,L,delay=600){
  ST.thinking=true;const typing=say('bot','…');
  setTimeout(()=>{typing.remove();say('bot',t,CH[ST.ch].sub+' · AI');ST.thinking=false},delay);
}
function send(text){
  text=text.trim();if(!text||ST.thinking)return;
  say('me',text);$('#inp').value='';
  const L=lang(text);const rec={t:new Date(),ch:ST.ch,lang:L,q:text,intent:'unknown',status:'resolved'};
  if(ST.handoff){rec.intent='with agent';rec.status='human';ST.log.push(rec);
    setTimeout(()=>say('agent','(Demo) A real agent would type here. Your full chat history is already visible to them.','Priya · Support team'),700);return}
  const r=reply(text);
  if(r&&r.handoff){rec.intent='handoff request';rec.status='handoff';ST.log.push(rec);startHandoff(L);return}
  if(r){ST.misses=0;rec.intent=r.intent;ST.log.push(rec);bot(r.text,L)}
  else{
    ST.misses++;rec.status='unresolved';ST.log.push(rec);
    if(ST.misses>=2){rec.status='handoff';ST.misses=0;startHandoff(L,true)}
    else bot(L==='en'?'I am not sure about that yet. Could you rephrase, or ask about delivery, refunds, timings or payments?':'मुझे इसका जवाब अभी नहीं पता। कृपया दूसरे शब्दों में पूछें, या डिलीवरी, रिफंड, समय या पेमेंट के बारे में पूछें।',L);
  }
  renderView();
}
function startHandoff(L,auto){
  ST.thinking=true;
  const t=L==='en'?(auto?'I could not find a good answer, so I am bringing in a teammate.':'Sure, connecting you to a human agent.'):'ठीक है, मैं आपको हमारे एजेंट से जोड़ रही हूँ।';
  say('bot',t,'AI');sys('Transferring to a human agent…');
  setTimeout(()=>{ST.handoff=true;ST.thinking=false;$('#botSub').textContent='Priya (human agent) · live';
    say('agent',L==='en'?'Hi, I am Priya. I have read your chat so far. How can I help?':'नमस्ते, मैं प्रिया हूँ। मैंने आपकी चैट पढ़ ली है। बताइए, कैसे मदद करूँ?','Priya · Support team');
    renderChips();renderView()},1400);
  renderView();
}
function renderChips(){
  const c=$('#chips');c.innerHTML='';
  if(ST.handoff){const b=document.createElement('button');b.textContent='Return to bot';b.onclick=()=>{ST.handoff=false;ST.misses=0;$('#botSub').textContent='Online · replies instantly';sys('Back with the AI assistant');renderChips()};c.appendChild(b);return}
  ['What are your timings?','डिलीवरी कितने दिन में होगी?','Refund kaise milega?','Track order 48213','Talk to a human'].forEach(q=>{const b=document.createElement('button');b.textContent=q;b.onclick=()=>send(q);c.appendChild(b)});
}
function renderChannels(){
  const w=$('#chTabs');w.innerHTML='';
  Object.keys(CH).forEach(k=>{const b=document.createElement('button');b.setAttribute('role','tab');b.setAttribute('aria-selected',k===ST.ch);b.textContent=k;
    b.onclick=()=>{ST.ch=k;document.querySelector('.bar').style.background=CH[k].c;sys('Switched to '+CH[k].sub);renderChannels()};w.appendChild(b)});
}
const TABS=[['analytics','Analytics'],['train','Train on FAQs'],['logs','Conversation log']];
function renderTabs(){
  const w=$('#tabs');w.innerHTML='';
  TABS.forEach(([k,n])=>{const b=document.createElement('button');b.setAttribute('role','tab');b.setAttribute('aria-selected',k===ST.tab||(ST.tab==='chat'&&k==='analytics'));b.textContent=n;b.onclick=()=>{ST.tab=k;renderTabs();renderView()};w.appendChild(b)});
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function renderView(){
  const v=$('#view'),tab=ST.tab==='chat'?'analytics':ST.tab,L=ST.log;
  if(tab==='analytics'){
    const n=L.length,res=L.filter(x=>x.status==='resolved').length,ho=L.filter(x=>x.status==='handoff'||x.status==='human').length;
    const hi=L.filter(x=>x.lang!=='en').length;
    const by={};L.forEach(x=>by[x.intent]=(by[x.intent]||0)+1);
    const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,6),mx=top.length?top[0][1]:1;
    v.innerHTML=`<div class="stats">
      <div class="stat"><b>${n}</b><span>Messages</span></div>
      <div class="stat"><b>${n?Math.round(res/n*100):0}%</b><span>Resolved by AI</span></div>
      <div class="stat"><b>${ho}</b><span>Human handoffs</span></div>
      <div class="stat"><b>${n?Math.round(hi/n*100):0}%</b><span>Hindi / Hinglish</span></div></div>
      <h3 style="margin-bottom:6px">Top topics</h3>
      <div class="bars">${top.length?top.map(([k,c])=>`<div><span>${esc(k)}</span><i style="width:${c/mx*100}%"></i><span>${c}</span></div>`).join(''):'<p class="empty">Send a message in the chat to see live numbers.</p>'}</div>`;
  }else if(tab==='train'){
    v.innerHTML=`<p style="margin-top:0;color:var(--mute)">The bot answers from these FAQs. Add one and ask it in the chat right away.</p>
    ${faqs.map(f=>`<div class="faq"><b>${esc(f.name)}</b><p>${esc(f.en)}</p></div>`).join('')}
    <h3 style="margin-top:16px">Add an FAQ</h3>
    <label for="fn">Topic name</label><input class="t" id="fn" placeholder="Gift wrapping">
    <label for="fk">Words customers use (comma separated, any language)</label><input class="t" id="fk" placeholder="gift, wrap, पैकिंग, gift wrap">
    <label for="fa">Answer</label><textarea id="fa" rows="3" placeholder="Gift wrapping is free on orders above ₹500."></textarea>
    <p><button class="btn pri" id="add">Save and train</button> <span id="fmsg" style="color:var(--mute);font-size:13px"></span></p>`;
    $('#add').onclick=()=>{const n=$('#fn').value.trim(),k=$('#fk').value.split(',').map(s=>s.trim()).filter(Boolean),a=$('#fa').value.trim();
      if(!n||!k.length||!a){$('#fmsg').textContent='Fill in the topic, at least one word and an answer.';return}
      faqs.unshift({id:'c'+Date.now(),name:n,kw:k,en:a,hi:a});renderView();$('#fmsg').textContent='Saved. Try it in the chat.'};
  }else{
    v.innerHTML=L.length?`<div class="wrap"><table><thead><tr><th>Time</th><th>Channel</th><th>Message</th><th>Topic</th><th>Outcome</th></tr></thead><tbody>${L.slice().reverse().map(x=>`<tr><td>${x.t.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</td><td>${x.ch}</td><td>${esc(x.q)}</td><td>${esc(x.intent)}</td><td><span class="tag ${x.status!=='resolved'?'h':''}">${x.status}</span></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">No conversations yet. Messages you send appear here with their outcome.</p>';
  }
}
$('#form').addEventListener('submit',e=>{e.preventDefault();send($('#inp').value)});
renderChannels();renderTabs();renderChips();renderView();
document.querySelector('.bar').style.background=CH.Web.c;
say('bot','Namaste! 🙏 I am the Sharma Sweets assistant. Ask me anything in English or हिंदी.','Web · AI');
