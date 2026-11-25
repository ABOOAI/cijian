import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from './qa-dom.mjs';

const settle=()=>new Promise(resolve=>setImmediate(resolve));

test('signed-out visitors see only the account gate and username/password opens cloud account storage',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),original=await readFile(new URL('../src/auth-gate.js',import.meta.url),'utf8');
 const source=original.replace(/^import .*\n/gm,'').replace(/await import\('\.\/app\.js\?v=[\d.]+'\)/,"window.__TEST_APP_IMPORTED__=true");
 const dom=new JSDOM(html,{url:'https://accounts-qa.invalid/',runScripts:'outside-only'}),w=dom.window,calls=[];
 const session={user:{id:'user-one',email:'custom-user@accounts.cijian.invalid',user_metadata:{username:'custom-user'}}};
 const client={auth:{getSession:async()=>({data:{session:null},error:null}),signInWithPassword:async value=>{calls.push(value);return {data:{session},error:null};},signOut:async()=>({error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}};
 w.supabaseClientFor=()=>client;w.createAccountLearningStorage=async(_client,id)=>{calls.push({id});return {cloud:true};};
 await w.eval('(async()=>{'+source+'\n})()');await settle();
 assert.equal(w.document.querySelector('#learning-app').hidden,true);assert.ok(w.document.querySelector('#account-login'));
 const username=w.document.querySelector('#login-username'),password=w.document.querySelector('#login-password');username.value='Custom_User';password.value='not-a-real-password';w.document.querySelector('#account-login').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await settle();
 assert.equal(calls[0].email,'custom_user@accounts.cijian.invalid');assert.equal(calls[0].password,'not-a-real-password');assert.equal(calls[1].id,'user-one');assert.equal(w.__TEST_APP_IMPORTED__,true);assert.equal(w.document.querySelector('#learning-app').hidden,false);assert.equal(w.__CIJIAN_ACCOUNT__.username,'custom_user');
 dom.window.close();
});
