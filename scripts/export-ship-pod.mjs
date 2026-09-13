import { readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

// Export the same stateless lesson component without a second copy of its content.
const moduleUrl = (code) =>
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
const compile = async (path) =>
  ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
const contentUrl = moduleUrl(await compile('../content/ship-pod.ts'));
const componentUrl = moduleUrl(
  (await compile('../components/ship-pod-explainer.tsx'))
    .replace(/from ['"]@\/content\/ship-pod['"]/g, `from '${contentUrl}'`)
    .replace(
      /from ['"]react\/jsx-runtime['"]/g,
      `from '${import.meta.resolve('react/jsx-runtime')}'`,
    ),
);
const { podPages } = await import(contentUrl);
const { ShipPodExplainer } = await import(componentUrl);
const css = await readFile(
  new URL('../public/ship-pod.css', import.meta.url),
  'utf8',
);
const pages = podPages
  .map(
    (page, index) =>
      `<section class="pod-export-slide" id="${page.id}" ${index ? 'hidden' : ''}>` +
      '<div class="pod-export-top">电机与拖动 · 绪论 <span>16:9 · ELI5</span></div>' +
      renderToStaticMarkup(
        createElement(ShipPodExplainer, { view: page.view }),
      ) +
      `<footer>轮船电动吊舱推进<span>${index + 1} / ${podPages.length}</span></footer></section>`,
  )
  .join('\n');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>轮船电动吊舱推进 · ELI5</title>
<style>${css}
html,body{margin:0;height:100%;background:#eaf0ed;color:#203947;font-family:'Segoe UI','Microsoft YaHei',sans-serif}
*{box-sizing:border-box} [hidden]{display:none!important}
main{position:fixed;inset:0 0 66px;touch-action:pan-y}
.pod-export-slide{width:1600px;height:900px;padding:49px 78px 0;background:white;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(var(--scale,1));transform-origin:center;overflow:hidden;box-shadow:0 6px 30px #20394716}
.pod-export-top,footer{font-size:16px;color:#7e9488;display:flex;justify-content:space-between;letter-spacing:2px}
footer{position:absolute;bottom:28px;left:78px;right:78px;font-size:14px}
nav{position:fixed;bottom:0;left:0;right:0;height:66px;display:flex;align-items:center;justify-content:center;gap:18px;background:#f5f8f5}
button,select{font:inherit;color:#315a48;background:white;border:1px solid #ccdbd0;border-radius:7px;padding:8px 13px;cursor:pointer}
button:disabled{opacity:.4;cursor:default} button:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #bd7541;outline-offset:4px}
body.full main{bottom:0}body.full nav{opacity:0;transition:opacity .2s}body.full nav:hover,body.full nav:focus-within{opacity:1}
@media(max-width:600px){nav{gap:6px}select{max-width:48vw}button{padding:8px}}
@media print{main{position:static}nav{display:none}.pod-export-slide[hidden]{display:block!important}.pod-export-slide{position:relative;left:0;top:0;transform:none;page-break-after:always} @page{size:1600px 900px;margin:0}}
</style></head><body><main>${pages}</main>
<nav aria-label="讲解翻页"><button id="prev" aria-label="上一页">←</button><select id="page" aria-label="选择页面">${podPages.map((p, i) => `<option value="${i}">${i + 1}. ${p.title}</option>`).join('')}</select><button id="next" aria-label="下一页">→</button><button id="full">全屏</button><span id="status" aria-live="polite"></span></nav>
<script>
const slides=[...document.querySelectorAll('.pod-export-slide')],main=document.querySelector('main'),picker=document.querySelector('#page');let index=0;
function scale(){document.documentElement.style.setProperty('--scale',Math.min(main.clientWidth/1600,main.clientHeight/900))}
function show(next){index=Math.max(0,Math.min(slides.length-1,next));slides.forEach((slide,i)=>{slide.hidden=i!==index});picker.value=index;document.querySelector('#prev').disabled=index===0;document.querySelector('#next').disabled=index===slides.length-1;document.querySelector('#status').textContent=(index+1)+' / '+slides.length;scale()}
function go(next){show(next);if(location.hash!=='#'+slides[index].id)location.hash=slides[index].id}
function fromHash(){const found=slides.findIndex(s=>s.id===location.hash.slice(1));show(found<0?0:found)}
async function fullscreen(){if(document.fullscreenElement){await document.exitFullscreen();return}if(document.body.classList.contains('full')){document.body.classList.remove('full');scale();return}document.body.classList.add('full');try{await document.documentElement.requestFullscreen()}catch{}scale()}
document.querySelector('#prev').onclick=()=>go(index-1);document.querySelector('#next').onclick=()=>go(index+1);picker.onchange=()=>go(Number(picker.value));document.querySelector('#full').onclick=fullscreen;
addEventListener('keydown',e=>{if(e.target.closest('a,button,select,input,textarea'))return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();go(index+1)}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(index-1)}else if(e.key==='Home'){e.preventDefault();go(0)}else if(e.key==='End'){e.preventDefault();go(slides.length-1)}else if(e.key.toLowerCase()==='f'){e.preventDefault();fullscreen()}else if(e.key==='Escape'){document.body.classList.remove('full');scale()}});
let touch;main.addEventListener('touchstart',e=>{if(e.target.closest('a'))return;touch=e.touches[0]&&{x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});main.addEventListener('touchend',e=>{const end=e.changedTouches[0];if(touch&&end){const dx=end.clientX-touch.x,dy=end.clientY-touch.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)go(index+(dx<0?1:-1))}touch=null},{passive:true});
addEventListener('hashchange',fromHash);addEventListener('resize',scale);document.addEventListener('fullscreenchange',()=>{document.body.classList.toggle('full',!!document.fullscreenElement);scale()});fromHash();
</script></body></html>`;
await writeFile(
  new URL('../public/ship-pod.html', import.meta.url),
  html,
  'utf8',
);
console.log('Exported 8 self-contained ELI5 pages: public/ship-pod.html');
