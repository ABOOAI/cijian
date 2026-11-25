/** Read-only list paging. Never slices or rewrites the underlying learning records. */
export function pageSlice(items,page=0,size=6){
 const list=Array.isArray(items)?items:[];
 const safeSize=Number.isFinite(size)&&size>0?Math.max(1,Math.floor(size)):6;
 const total=list.length,pages=Math.max(1,Math.ceil(total/safeSize));
 const current=Math.min(pages-1,Math.max(0,Number.isFinite(page)?Math.floor(page):0));
 const offset=current*safeSize;
 return {items:list.slice(offset,offset+safeSize),page:current,pages,total,start:total?offset+1:0,end:Math.min(total,offset+safeSize),size:safeSize};
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function paginationHTML(info,{key='list',label='列表',itemLabel='项',actions=null,statusAttribute=''}={}){
 const {page,pages,total,start,end}=info;
 const control=(title,target,disabled,action)=>`<button type="button" class="secondary" data-pagination="${escape(key)}" data-page="${target}" data-page-count="${pages}"${action?` data-action="${escape(action)}"`:''} ${disabled?'disabled':''}>${title}</button>`;
 return `<nav class="pagination list-pagination" data-pagination-nav="${escape(key)}" aria-label="${escape(label)}分页" tabindex="-1">${control('上一页',page-1,page===0,actions?.previous)}<span data-page-status${statusAttribute?` ${statusAttribute}`:''} role="status" aria-live="polite">第 ${page+1} / ${pages} 页 · 共 ${total} ${escape(itemLabel)}${total?` · ${start}–${end}`:''}</span>${control('下一页',page+1,page+1>=pages,actions?.next)}${pages>1?`<label class="page-jump">跳至 <input type="number" min="1" max="${pages}" value="${page+1}" step="1" inputmode="numeric" aria-label="${escape(label)}页码" data-pagination-input="${escape(key)}" data-page-count="${pages}"> 页</label>`:''}</nav>`;
}
export function bindPagination(element,{onChange,keys=null}){
 const change=(control,value)=>{const pages=Number(control.dataset.pageCount);if(!Number.isFinite(value))return;onChange?.(control.dataset.pagination||control.dataset.paginationInput,Math.max(0,Math.min(pages-1,Math.floor(value))));};
 [...element.querySelectorAll('[data-pagination]')].filter(button=>!keys||keys.includes(button.dataset.pagination)).forEach(button=>button.addEventListener('click',()=>{if(!button.disabled)change(button,Number(button.dataset.page));}));
 [...element.querySelectorAll('[data-pagination-input]')].filter(input=>!keys||keys.includes(input.dataset.paginationInput)).forEach(input=>{
  input.addEventListener('change',()=>{if(input.value.trim())change(input,Number(input.value)-1);});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();if(input.value.trim())change(input,Number(input.value)-1);}});
 });
}
export function focusPagination(element,key){
 const nav=[...element.querySelectorAll('[data-pagination-nav]')].find(node=>node.dataset.paginationNav===key);
 nav?.scrollIntoView?.({block:'start',behavior:'auto'});nav?.focus?.({preventScroll:true});
}
