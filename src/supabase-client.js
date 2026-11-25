import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './supabase-config.js';

const clients=new WeakMap();

export function supabaseClientFor(w){
 if(!w||typeof w!=='object')return null;
 if(clients.has(w))return clients.get(w);
 if(!w.supabase?.createClient)return null;
 const client=w.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'cijian.supabase.auth.v1'}});
 clients.set(w,client);return client;
}
