(function(){
  if(window.__rtInit)return;window.__rtInit=1;
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.documentElement.classList.add('rt-js');
  var SEL='.rt-card,.rt-pc,.rt-center,.rt-specs,.rt-faq details,.rt-note,.rt-prod>div,.rt-gift>div,.rt-trust>div';
  var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -6% 0px',threshold:.08});
  function init(){
    document.querySelectorAll('.rt-anim').forEach(function(root){
      root.querySelectorAll(SEL).forEach(function(el){
        if(el.dataset.rt)return;el.dataset.rt=1;
        var i=Array.prototype.indexOf.call(el.parentNode.children,el);
        el.style.setProperty('--rt-d',(Math.min(i,5)*0.08)+'s');
        io.observe(el);
      });
    });
  }
  if(document.readyState!=='loading')init();else document.addEventListener('DOMContentLoaded',init);
  document.addEventListener('shopify:section:load',init);
  setTimeout(function(){document.querySelectorAll('.rt-anim [data-rt]:not(.is-in)').forEach(function(el){var r=el.getBoundingClientRect();if(r.top<innerHeight)el.classList.add('is-in');});},2500);
})();
