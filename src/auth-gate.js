import {supabaseClientFor} from './supabase-client.js';
import {createAccountLearningStorage} from './cloud-storage.js?v=1.13.7';

const gate=document.querySelector('#auth-gate'),app=document.querySelector('#learning-app'),client=supabaseClientFor(window);
const USER_DOMAIN='accounts.cijian.invalid';
const usernameEmail=username=>`${username.toLowerCase()}@${USER_DOMAIN}`;
const accountName=user=>user?.user_metadata?.username||user?.email?.split('@')[0]||'学习账户';
let entering=false,currentUserId=null;

function loginView(message=''){
 app.hidden=true;gate.hidden=false;gate.innerHTML=`<main class="auth-card"><div class="auth-brand"><span class="brand-mark">词</span><div><strong>词间</strong><span>英语学习中心</span></div></div><h1>登录学习账户</h1><p>登录后才能进入。每个账号拥有独立的云端学习进度，本浏览器不保存学习进度。</p><form id="account-login"><label for="login-username">账号</label><input id="login-username" name="username" autocomplete="username" inputmode="text" minlength="4" maxlength="32" pattern="[A-Za-z0-9_]+" required placeholder="请输入账号"><label for="login-password">密码</label><input id="login-password" name="password" type="password" autocomplete="current-password" minlength="6" required placeholder="请输入密码"><button class="primary" type="submit">登录并进入</button></form><p id="login-status" class="auth-status" role="alert"></p><p class="auth-note">学习中每5分钟批量保存到账号云端，切到后台或退出时立即保存；你仍可在“设置与来源”中导出或恢复 JSON 备份。</p></main>`;
 const form=document.querySelector('#account-login'),status=document.querySelector('#login-status'),button=form.querySelector('button');
 status.textContent=message;
 form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;button.disabled=true;status.textContent='正在登录并读取账号进度…';const data=new FormData(form),username=String(data.get('username')).trim().toLowerCase(),password=String(data.get('password'));try{const {data:result,error}=await client.auth.signInWithPassword({email:usernameEmail(username),password});if(error||!result?.session)throw error||Error('登录失败');await enter(result.session,username);}catch{status.textContent='账号或密码不正确，请重新输入。';button.disabled=false;}});
}

async function enter(session,username=accountName(session.user)){
 if(entering)return;entering=true;gate.hidden=false;gate.innerHTML='<main class="auth-card auth-loading"><div class="auth-spinner" aria-hidden="true"></div><h1>正在读取学习进度</h1><p>请稍候，正在连接账号云端…</p></main>';
 try{const storage=await createAccountLearningStorage(client,session.user.id);window.__CIJIAN_ACCOUNT__={user:session.user,username};window.__CIJIAN_CLOUD_STORAGE__=storage;currentUserId=session.user.id;app.hidden=false;gate.hidden=true;await import('./app.js?v=1.13.7');}
 catch(error){entering=false;try{await client.auth.signOut();}catch{}loginView('账号进度读取失败：'+(error?.message||'请检查网络后重试。'));}
}

async function start(){
 if(!client){loginView('登录组件未能加载，请刷新页面。');document.querySelector('#account-login button').disabled=true;return;}
 try{const {data,error}=await client.auth.getSession();if(error)throw error;if(data?.session)await enter(data.session);else loginView();}
 catch{loginView('登录状态读取失败，请检查网络后刷新。');}
 client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&currentUserId)location.reload();else if(event==='SIGNED_IN'&&currentUserId&&session?.user?.id!==currentUserId)location.reload();});
}

start();
