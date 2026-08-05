(()=>{const r=new XMLHttpRequest();r.open('GET','q4-data.js',false);r.send(null);if(r.status>=200&&r.status<300){Function(r.responseText)();}})();
window.addEventListener('DOMContentLoaded',()=>{
 const b=document.getElementById('allBtn'),l=document.getElementById('label');
 if(!b||typeof begin!=='function'||!Array.isArray(window.ACLS_QUESTIONS))return;
 const total=window.ACLS_QUESTIONS.length;
 b.innerHTML='<b>📚 '+total+' 題全部練習</b><span>可選擇起始題號，作答後自動下一題</span>';
 b.onclick=()=>{const d=Math.min(total,Math.max(1,Number(localStorage.getItem('aclsLastQuestion')||1)));const v=prompt('請輸入起始題號（1–'+total+'）',String(d));if(v===null)return;const n=Math.floor(Number(v));if(!Number.isFinite(n)||n<1||n>total){alert('請輸入 1–'+total+' 的有效題號。');return;}localStorage.setItem('aclsLastQuestion',String(n));begin(window.ACLS_QUESTIONS.slice(n-1),'全部題庫｜從第 '+n+' 題開始');};
 if(l)new MutationObserver(()=>{const m=l.textContent.match(/題號\s*(\d+)/);if(m)localStorage.setItem('aclsLastQuestion',m[1]);}).observe(l,{childList:true,subtree:true,characterData:true});
});