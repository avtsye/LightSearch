const I18N={
he:{tagline:"חיפוש פשוט. פחות נתונים מיותרים.",settings:"הגדרות",searchLabel:"מה לחפש?",searchPlaceholder:"מה תרצה לחפש?",search:"חיפוש",engine:"מנוע חיפוש",compact:"מצב חסכוני",results:"תוצאות",more:"הצג עוד",privacy:"החיפושים נשמרים מקומית במכשיר. מפתחות API, אם הוגדרו, נשמרים בהגדרות התוסף.",footer:"חיפוש חסכוני, בשליטתך.",loading:"מחפש…",empty:"לא נמצאו תוצאות.",error:"החיפוש נכשל. בדוק את ההגדרות או נסה שוב.",setup:"כדי לקבל תוצאות בתוך LightSearch, יש להגדיר מפתח Google Programmable Search Engine בהגדרות. אפשר בינתיים לפתוח את Google בחיפוש רגיל.",openGoogle:"פתיחת תוצאות Google",cached:"תוצאות שמורות",stale:"החיבור נכשל — מוצגות תוצאות שמורות שאולי אינן מעודכנות.",fresh:"תוצאות שהתקבלו עכשיו",approx:"נתוני התשובה (בקירוב)",noMore:"אין תוצאות נוספות.",clearCache:"ניקוי מטמון",cacheCleared:"המטמון של LightSearch נוקה."},
en:{tagline:"Simple search. Less unnecessary data.",settings:"Settings",searchLabel:"What are you looking for?",searchPlaceholder:"Search the web",search:"Search",engine:"Search engine",compact:"Data saver mode",results:"Results",more:"Load more",privacy:"Searches are cached locally. API keys, if configured, are stored in the extension settings.",footer:"Efficient search, under your control.",loading:"Searching…",empty:"No results found.",error:"Search failed. Check settings or try again.",setup:"To show results inside LightSearch, configure a Google Programmable Search Engine API key in Settings. You can open standard Google results meanwhile.",openGoogle:"Open Google results",cached:"Cached results",stale:"Connection failed — showing possibly outdated cached results.",fresh:"Fresh results",approx:"Response payload (approx.)",noMore:"No more results.",clearCache:"Clear cache",cacheCleared:"LightSearch cache cleared."}
};
let lang="he", currentQuery="", nextStart=11;
const $=id=>document.getElementById(id);
function t(key){return I18N[lang][key]||key}
function setLanguage(value){lang=value;document.documentElement.lang=value;document.documentElement.dir=value==="he"?"rtl":"ltr";document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));$("languageButton").textContent=value==="he"?"English":"עברית"}
$("languageButton").addEventListener("click",()=>setLanguage(lang==="he"?"en":"he"));
async function getSettings(){return await chrome.storage.sync.get({googleApiKey:"",googleCx:"",cacheMinutes:30})}
function cacheKey(provider,q,start,compact){return "ls:"+provider+":"+start+":"+(compact?"compact":"full")+":"+q.trim().toLowerCase()}
async function pruneCache(){
 const all=await chrome.storage.local.get(null);
 const entries=Object.entries(all).filter(([key,value])=>key.startsWith("ls:")&&value&&Number.isFinite(value.savedAt)).sort((a,b)=>b[1].savedAt-a[1].savedAt);
 const expired=entries.slice(100).map(([key])=>key);
 if(expired.length)await chrome.storage.local.remove(expired);
}
async function clearSearchCache(){
 const all=await chrome.storage.local.get(null);
 const keys=Object.keys(all).filter(key=>key.startsWith("ls:"));
 if(keys.length)await chrome.storage.local.remove(keys);
 $("status").textContent=t("cacheCleared");
 $("resultMeta").textContent="";
}
$("clearCacheButton").addEventListener("click",clearSearchCache);
async function googleSearch(q,start,settings,compact){
 if(!settings.googleApiKey||!settings.googleCx)throw new Error("SETUP_REQUIRED");
 const url=new URL("https://www.googleapis.com/customsearch/v1");url.search=new URLSearchParams({key:settings.googleApiKey,cx:settings.googleCx,q,num:compact?"5":"10",start:String(start)});
 const response=await fetch(url);if(!response.ok)throw new Error("HTTP_"+response.status);
 const body=await response.text();let data;try{data=JSON.parse(body)}catch{throw new Error("BAD_JSON")}
 return {items:(data.items||[]).map(x=>({title:x.title,url:x.link,snippet:x.snippet||""})),bytes:new Blob([body]).size,total:data.searchInformation?.totalResults||"0"};
}
async function renderItems(items,append=false){
 if(!append)$("results").replaceChildren();
 if(!items.length&&!append){$("results").innerHTML='<div class="empty-state">'+t("empty")+'</div>';return}
 for(const item of items){const card=document.createElement("article");card.className="result-card";const a=document.createElement("a");a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.title;const url=document.createElement("span");url.className="result-url";url.textContent=item.url;const p=document.createElement("p");p.textContent=item.snippet;card.append(a,url,p);$("results").append(card)}
}
async function search(start=1){
 const q=$("query").value.trim();if(!q)return;currentQuery=q;
 const provider=$("provider").value,compact=$("compactMode").checked,requestedCount=compact?5:10;
 $("resultsSection").hidden=false;$("status").textContent=t("loading");$("moreButton").hidden=true;
 if(provider==="duckduckgo"){const u="https://duckduckgo.com/?q="+encodeURIComponent(q);chrome.tabs.create({url:u});$("status").textContent=lang==="he"?"נפתח חיפוש DuckDuckGo בכרטיסייה חדשה.":"DuckDuckGo search opened in a new tab.";return}
 const settings=await getSettings(),key=cacheKey(provider,q,start,compact),cached=await chrome.storage.local.get(key);
 const ttl=Math.max(0,Number(settings.cacheMinutes)||0)*60*1000;
 if(ttl>0&&cached[key]&&Date.now()-cached[key].savedAt<ttl){
  await renderItems(cached[key].data.items,start>1);$("status").textContent=t("cached")+" · "+new Date(cached[key].savedAt).toLocaleString();$("resultMeta").textContent=t("approx")+": "+cached[key].data.bytes+" B · 0 B downloaded";$("moreButton").hidden=cached[key].data.items.length<requestedCount;nextStart=start+cached[key].data.items.length;return;
 }
 try{
  const data=await googleSearch(q,start,settings,compact);
  await chrome.storage.local.set({[key]:{savedAt:Date.now(),data}});await pruneCache();
  await renderItems(data.items,start>1);$("status").textContent=t("fresh");$("resultMeta").textContent=t("approx")+": "+data.bytes+" B";$("moreButton").hidden=data.items.length<requestedCount;nextStart=start+data.items.length;
 }catch(err){
  if(err.message==="SETUP_REQUIRED"){$("status").textContent=t("setup");const a=document.createElement("a");a.href="https://www.google.com/search?q="+encodeURIComponent(q);a.target="_blank";a.rel="noopener noreferrer";a.className="result-card";a.textContent=t("openGoogle");$("results").replaceChildren(a)}
  else if(ttl>0&&cached[key]){await renderItems(cached[key].data.items,start>1);$("status").textContent=t("stale");$("resultMeta").textContent=t("approx")+": "+cached[key].data.bytes+" B · cache";$("moreButton").hidden=cached[key].data.items.length<requestedCount;nextStart=start+cached[key].data.items.length}
  else{$("status").textContent=t("error")+" ("+err.message+")"}
 }
}
$("searchForm").addEventListener("submit",e=>{e.preventDefault();search(1)});
$("moreButton").addEventListener("click",()=>search(nextStart));
chrome.storage.sync.get({language:"he",defaultProvider:"google",compactMode:true}).then(s=>{setLanguage(s.language);$("provider").value=s.defaultProvider;$("compactMode").checked=s.compactMode});
$("provider").addEventListener("change",e=>chrome.storage.sync.set({defaultProvider:e.target.value}));
$("compactMode").addEventListener("change",e=>chrome.storage.sync.set({compactMode:e.target.checked}));
