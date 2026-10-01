'use client';
import {useCallback,useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';

const ID='G-ZGXCN93Z7E';
const KEY='ghstats-analytics-consent';
type Choice='granted'|'denied'|null;
const store=(choice:Choice)=>{try{localStorage.setItem(KEY,choice||'denied')}catch{}};
// Profile names and query strings can contain personal data. Send route classes,
// not usernames, repo names, page titles or full browser URLs.
function safePath(path:string) {
 if(path==='/'||path==='/status'||path==='/privacy')return path;
 const segments=path.split('/').filter(Boolean);
 return segments.length>1?'/[username]/[repo]':'/[username]';
}
export default function GoogleAnalyticsConsent() {
 const [choice,setChoice]=useState<Choice>(null),[ready,setReady]=useState(false),[settings,setSettings]=useState(false);
 const path=usePathname();
 useEffect(()=>{try{const saved=localStorage.getItem(KEY);if(saved==='granted'||saved==='denied')setChoice(saved)}catch{}setReady(true)},[]);
 const applyChoice=useCallback((next:Choice)=>{
  setChoice(next);setSettings(false);
  if(choice==='granted'&&next!=='granted'){
   // Stop the loaded tag immediately in every tab, not only the clicked tab.
   (window as typeof window & {[key:string]:unknown})[`ga-disable-${ID}`]=true;
   for(const part of document.cookie.split(';')){const name=part.trim().split('=')[0];if(name.startsWith('_ga'))for(const domain of ['',location.hostname,`.${location.hostname}`])document.cookie=`${name}=; Max-Age=0; path=/;${domain?` domain=${domain};`:''} SameSite=Lax`;}
   location.reload();
  }
 },[choice]);
 useEffect(()=>{
  const changed=(event:StorageEvent)=>{
   if(event.key!==KEY&&event.key!==null)return;
   if(event.storageArea&&event.storageArea!==localStorage)return;
   applyChoice(event.newValue==='granted'?'granted':event.newValue==='denied'?'denied':null);
  };
  window.addEventListener('storage',changed);
  return()=>window.removeEventListener('storage',changed);
 },[applyChoice]);
 useEffect(()=>{
  if(choice!=='granted'||(window as typeof window & {[key:string]:unknown})[`ga-disable-${ID}`]===true)return;
  const w=window as typeof window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void};
  const route=safePath(path||'/');
  if(!w.gtag){w.dataLayer=w.dataLayer||[];w.gtag=(...args:unknown[])=>{w.dataLayer!.push(args)};
   w.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
   w.gtag('js',new Date());w.gtag('config',ID,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:`https://ghstats.dev${route}`,page_title:'GitHub Profile Stats',page_referrer:''});
   const script=document.createElement('script');script.id='ghstats-google-analytics';script.async=true;script.src=`https://www.googletagmanager.com/gtag/js?id=${ID}`;document.head.appendChild(script);
  }
  w.gtag('event','page_view',{page_location:`https://ghstats.dev${route}`,page_title:'GitHub Profile Stats',page_referrer:'',page_path:route});
 },[choice,path]);
 function choose(next:'granted'|'denied') {
  store(next);applyChoice(next);
 }
 if(!ready)return null;
 return <><div className="px-6 py-3 text-center text-xs text-[#8b949e]"><a href="/privacy" className="underline hover:text-white">Privacy</a><span className="mx-3">·</span><button onClick={()=>setSettings(true)} className="underline hover:text-white">Analytics choices</button></div>{(choice===null||settings)&&<section aria-label="Optional Google Analytics" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-xl border border-[#484f58] bg-[#0d1117] p-5 text-sm text-[#c9d1d9] shadow-2xl"><h2 className="mb-2 font-semibold text-white">Optional analytics</h2><p className="mb-4 leading-relaxed">Google Analytics helps measure how this site is used. It only loads if you accept, and uses analytics cookies. Declining does not affect the cards. <a href="/privacy" className="underline">Privacy details</a></p><div className="flex flex-wrap gap-3"><button onClick={()=>choose('denied')} className="rounded-md border border-[#8b949e] px-4 py-2 font-medium text-white">Decline</button><button onClick={()=>choose('granted')} className="rounded-md border border-[#8b949e] px-4 py-2 font-medium text-white">Accept analytics</button>{settings&&choice!==null&&<button onClick={()=>setSettings(false)} className="px-4 py-2 underline">Close</button>}</div></section>}</>;
}
