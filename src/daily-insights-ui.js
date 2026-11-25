import {pageSlice,paginationHTML,bindPagination,focusPagination} from './pagination.js';
const priorityPages=new WeakMap();
/** Read-only presentation of the local daily report; navigation never grades an answer. */
const MODE_LABELS={memory:'单词记忆',meaning:'翻译辨义',listening:'听力辨义',dictation:'听写训练',spelling:'默写训练',usage:'词项运用',sentence:'句子听写',phrase:'固定搭配',context:'搭配与语境',reading:'阅读理解',cloze:'完形填空',analysis:'句子分析'};
const count=value=>Number.isFinite(value)&&value>=0?Math.floor(value):null;
const countText=value=>count(value)===null?'未记录':String(count(value));
const percent=value=>Number.isFinite(value)&&value>=0&&value<=100?`${Number(value.toFixed(1))}%`:null;

function duration(ms){
 if(!Number.isFinite(ms)||ms<0)return '未记录';
 const seconds=Math.floor(ms/1000),minutes=Math.floor(seconds/60);
 return minutes>=60?`${Math.floor(minutes/60)}小时${minutes%60}分`:`${minutes}分${seconds%60}秒`;
}
function recordedSince(value){
 if(value===null||value===undefined||value==='')return '首次使用新版时';
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}):'首次使用新版时';
}
function accuracyText(stats,available){
 if(!available)return '无法读取';
 return count(stats.independentAttempts)>0&&percent(stats.accuracy)!==null?percent(stats.accuracy):'暂无可核对首答';
}
function advice(report,available){
 if(!available)return '逐题记录暂不可用。可以先查看原复习入口；新增记录可能未保存，刷新可能丢失。';
 const attempts=count(report.independentAttempts);
 if(attempts===null)return '目前缺少可核对的首答样本，暂不判断学习表现。可以按到期安排继续练习。';
 if(attempts<5)return `目前记录了${attempts}次无提示首答，样本较少，暂不据此判断能力。继续正常练习即可。`;
 if(count(report.wrong)>0)return `已有${countText(report.wrong)}次错误作答记录，可先核对下方条目，再按原计划复习。订正完成与无提示首答分别记录。`;
 if(count(report.wrong)===0)return '已记录的作答中暂未出现错误，可继续查看到期安排；这不代表全天表现或长期掌握。';
 return '可以结合模式明细与到期安排选择下一项练习；当前统计不代表长期掌握。';
}

export function renderDailyInsights({element,report={},esc,onRefresh,onNavigate}){
 const escape=value=>esc(String(value??'')),available=report.available===true;
 const stat=value=>available?countText(value):'无法读取';
 const modes=Array.isArray(report.modes)?report.modes:[];
 const priorities=available&&Array.isArray(report.priorities)?report.priorities:[];
 const saved=priorityPages.get(element),page=pageSlice(priorities,saved?.day===report.day?saved.page:0,10),shownPriorities=page.items,pager=paginationHTML(page,{key:'daily-priorities',label:'优先检查与复习',itemLabel:'项'});
 priorityPages.set(element,{day:report.day,page:page.page});
 const navigation=(mode,label,itemId)=>{
  const destination=Object.hasOwn(MODE_LABELS,mode)||mode==='track'?mode:'track';
  return `<button type="button" class="secondary" data-daily-navigate="${escape(destination)}"${itemId?` data-daily-item="${escape(itemId)}"`:''}>${escape(label)}</button>`;
 };
 const fraction=available?`${countText(report.independentCorrect)} / ${countText(report.independentAttempts)} 次无提示首答正确`:'逐题记录暂不可用';
 const due=count(report.dueCount)===null?'无法读取':`${countText(report.dueCount)} 项`;
 const metric=(id,label,value,detail)=>`<section class="metric" data-daily-metric="${escape(id)}"><span>${escape(label)}</span><strong data-daily-value${value==='暂无可核对首答'||value==='无法读取'||value==='未记录'?' class="daily-missing"':''}>${escape(value)}</strong><p class="daily-metric-detail">${escape(detail)}</p></section>`;
 const coverage=report.partial
  ?`逐题统计从本机首次使用新版时间（${recordedSince(report.startedAt)}）开始。升级前的单词作答与订正过程无法完整还原，以下只展示已记录部分。`
  :`按本机自然日汇总已记录部分；逐题记录从${recordedSince(report.startedAt)}开始。这些统计不代表全天表现或长期掌握。`;
 element.innerHTML=`<div class="daily-insights">
  <div class="page-heading"><div><h1 id="daily-insights-title">今日学情</h1><p>${escape(report.day||'今天')} · 本机学习记录</p></div><button id="daily-insights-refresh" type="button" class="secondary">刷新统计</button></div>
  ${!available?'<p id="daily-insights-availability" class="notice" role="status">逐题记录暂不可用，无法确认当前统计。新增记录可能未保存，刷新可能丢失。练习时长和到期安排按各自可读取的数据展示。</p>':''}
  <p id="daily-insights-coverage" class="coverage-label">${escape(coverage)}</p>
  ${count(report.invalidCount)>0?`<p class="notice">有 ${escape(countText(report.invalidCount))} 条格式异常的记录未纳入统计。</p>`:''}
  <div class="metrics daily-metrics">
   ${metric('time','有效练习时长',duration(report.timeMs),'全模块活动估算；与逐题统计的采集窗口不同。')}
   ${metric('accuracy','无提示首答正确率',accuracyText(report,available),fraction)}
   ${metric('attempts','已记录作答题次',stat(report.total),'按已记录事件计数；各类作答在下表分别展示。')}
   ${metric('due','当前到期能力',due,'按当前排期计数；同一词条可能有多项到期。')}
  </div>
  <section class="panel daily-advice" aria-labelledby="daily-advice-title"><h2 id="daily-advice-title">接下来可以怎么学</h2><p id="daily-insights-advice">${escape(advice(report,available))}</p></section>
  <section class="panel" aria-labelledby="daily-modes-title"><div class="panel-heading"><h2 id="daily-modes-title">各模式学习明细</h2><span class="small muted">时长未按模式记录</span></div>
   <p class="inline-note" id="daily-mode-note">首次作答包括提示后的首次提交；无提示首答率只看未使用提示的首答。自评与订正单独展示。</p>
   <div class="daily-table-scroll" role="region" aria-label="各模式学习明细，可横向滚动" tabindex="0"><table id="daily-insights-mode-table" aria-describedby="daily-mode-note"><thead><tr><th scope="col">学习模式</th><th scope="col">首次作答</th><th scope="col">无提示首答率</th><th scope="col">首答错误</th><th scope="col">提示后首答</th><th scope="col">自评</th><th scope="col">订正提交 / 正确</th></tr></thead><tbody>
    ${modes.length?modes.map(mode=>`<tr data-daily-mode-row="${escape(mode.id)}"><th scope="row">${escape(mode.label||MODE_LABELS[mode.id]||mode.id)}</th><td>${escape(stat(mode.firstAttempts))}</td><td><strong>${escape(accuracyText(mode,available))}</strong><span class="daily-cell-note">${escape(available?`${countText(mode.independentCorrect)} / ${countText(mode.independentAttempts)}`:'无法读取')}</span></td><td>${escape(stat(mode.wrong))}</td><td>${escape(stat(mode.assisted))}</td><td>${escape(stat(mode.self))}</td><td>${escape(stat(mode.corrections))} / ${escape(stat(mode.correctionCorrect))}</td></tr>`).join(''):`<tr><td colspan="7">${available?'暂未记录可展示的模式明细。':'逐题记录暂不可用。'}</td></tr>`}
   </tbody></table></div>
   <p class="inline-note daily-table-footnote">“订正正确”是订正提交中的正确次数；每一轮分别计数，不加入首答正确率。已记录完成订正：${escape(stat(report.correctionCompleted))} 次。</p>
  </section>
  <section class="panel" id="daily-insights-priorities" aria-labelledby="daily-priorities-title"><div class="panel-heading"><h2 id="daily-priorities-title">优先检查与复习</h2>${navigation('track','查看到期复习')}</div>
   <p class="inline-note">以下建议仅依据已记录作答。按钮打开原学习入口，不自动开始练习，也不改变成绩或覆盖未完成的小组。</p>
   ${pager}${shownPriorities.length?`<ol class="daily-priority-list" start="${page.start}">${shownPriorities.map(item=>`<li><div class="daily-priority-content"><h3>${escape(item.label||item.itemId||'未命名项目')}</h3><p>${escape(item.reason||'请回到原学习入口核对这项记录。')}</p><p class="small muted">${escape(MODE_LABELS[item.mode]||item.mode||'学习记录')} · 错误 ${escape(countText(item.wrong))} 次 · 无提示首答正确 ${escape(countText(item.independentCorrect))} 次 · 订正完成 ${escape(countText(item.correctionCompleted))} 次</p></div>${navigation(item.mode,'进入原学习入口',item.itemId)}</li>`).join('')}</ol>`:`<div id="daily-insights-empty" class="daily-empty"><p>${available?'已记录部分暂无需要优先检查的错题。可以查看当前到期安排。':'暂时无法从逐题记录生成清单。可以查看原复习入口。'}</p></div>`}${pager}
  </section>
  <details id="daily-insights-method" class="panel daily-method"><summary>这些数字是怎么统计的</summary><ul>
   <li>以本机日期划分自然日，只使用此浏览器中可以读取的记录，不上传学习内容。</li>
   <li>单词与搭配按本轮题目的首次提交统计；句子与连续语境题沿用原模式的首次记录，已揭示答案的再次练习归入订正。提示辅助、自评、订正提交均不进入无提示首答正确率。</li>
   <li>无提示首答正确率 = 无提示首答正确次数 ÷ 无提示首答次数。没有可核对样本时不显示百分比；音频播放不计入正确率。</li>
   <li>三轮订正按实际提交次数和正确次数另行记录；完成订正不等于新增一次独立首答，也不据此判断长期掌握。</li>
   <li>有效练习时长沿用全模块活动估算，包含符合原计时规则的练习、音频和停留时间。它与新版逐题记录的采集窗口不同，不用于推算各模式时长。</li>
   <li>旧历史或缺少时间、分类的记录无法完整还原。未记录与无法读取不等于零；页面只说明已记录部分，不代表全天或长期掌握。</li>
  </ul></details>
 </div>`;
 bindPagination(element,{onChange:(key,nextPage)=>{priorityPages.set(element,{day:report.day,page:nextPage});renderDailyInsights({element,report,esc,onRefresh,onNavigate});focusPagination(element,key);}});
 element.querySelector('#daily-insights-refresh').onclick=()=>onRefresh?.();
 element.querySelectorAll('[data-daily-navigate]').forEach(button=>{button.onclick=()=>onNavigate?.(button.dataset.dailyNavigate,button.dataset.dailyItem||undefined);});
}
