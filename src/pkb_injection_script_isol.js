const logStyle = 'color: green; font-size: 20px'
console.log('%cInjection', logStyle);
const root = document.querySelector(':root');
const obsAtt = {childList: true, subtree: true};
let settings = {};
let handlers = new Map;

function mutationHandler(node){
  handlers.values().forEach((fun)=>{fun(node)});
}

async function waitForHead() {
  if (document.head) return;
  return new Promise(() => {
    const observer = new MutationObserver(() => {
      if (document.head) {observer.disconnect();}
    });
    observer.observe(document.documentElement, obsAtt);
  });
}

async function fixPikabu(){
  settings = await chrome.storage.sync.get();
  await waitForHead();
  Object.getOwnPropertyNames(settings.checkbox).forEach((e)=>{
    if (settings.checkbox[e].value && typeof factory[e] === 'function') {
      try { 
        factory[e]();
      } catch(error) {
        console.error(error);
      }
    }
  })

  if (handlers.size > 0) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(mutationHandler);
      });
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ()=>{
        observer.observe(document.body, obsAtt);
      });
    } else {
      observer.observe(document.body, obsAtt);
    }
    
  }
}

function prepareHandler(selector, nodeHandler) {
  return function catchNodes(node) {
    if (node.nodeType !== 1) return;
    const nodes = [
      ...(node.matches(selector) ? [node] : []),
      ...node.querySelectorAll(selector)
    ];
    nodes.forEach(nodeHandler);
  };
}

const factory = {
  betterCarousel: function (){
    // const stEl = document.createElement('style');
    // stEl.textContent = `button.carousel__scroll.button {height: 100%; border-radius: 0%; border: none; width: 40px; background-color: var(--cariusel_bgc); box-shadow: none;}
    //   button.carousel__scroll_right {right: 0px;}
    //   button.carousel__scroll_left {left: 0px;}`;
    // stEl.id = 'betterCarousel';
    // document.head.appendChild(stEl);
    document.documentElement.classList.add('betterCarousel')
    root.style.setProperty('--cariusel_bgc', '#31313191');
  },

  changeColors: function (){
    Object.entries(settings.color).forEach(att => root.style.setProperty('--' + att[0], att[1].value));
  },

  noAvatarLevel: function (){
    // const stEl = document.createElement('style');
    // stEl.textContent = '.avatar__inner::before {border: none !important;}'
    // stEl.id = 'noAvatarLevel';
    // document.head.appendChild(stEl);
    document.documentElement.classList.add('noAvatarLevel')
  },

  betterCollapse: function(){
    // const stEl = document.createElement('style');
    // stEl.textContent = `.story__scroll > div.collapse-button:hover { background-color: #444751; } 
    // div.story__scroll {
    //   padding-bottom: 20px;
    //   border-bottom: 1px solid;
    //   border-radius: 3px;
    //   border-bottom-color: #2e2f33;
    // }`;
    // stEl.id = 'betterCollapse';
    // document.head.appendChild(stEl);
    document.documentElement.classList.add('betterCollapse')
  },

  cleanLink: function (){
    const extLink = (s) => s.match(/u=([^&]*)/)?.[1] || '';
    const selector = 'a[href*="u="]';
    const links = document.querySelectorAll(selector);

    function clearLink(e) {
      const eLink = extLink(e.href);
      if (eLink) e.href = decodeURIComponent(eLink);
    };

    links.forEach(clearLink);

    handlers.set('cleanLink', prepareHandler(selector, clearLink));
  },

  playbackRate: function () {
    const obsAtt = {childList: true, subtree: true};
    const w3svg = 'http://www.w3.org/2000/svg';
    const selector = 'div.player__controls-wrapper';
    const circleAtt = {fill: '#0000', cx: 10, cy:10, r: 7, 'stroke-width': 3, stroke: '#fff'};


    function createDivPR(){
        const divPlaybackRate = document.createElement('div');
        divPlaybackRate.className = 'player__playbackRate';

        const divPRVal = document.createElement('div');
        divPRVal.className = 'playbackValue'
        divPRVal.textContent = '1.0'

        const svgElem = document.createElementNS(w3svg, 'svg');
        svgElem.style.cssText = 'width: 25px; height: 20px';

        const ellipseElem = document.createElementNS(w3svg, 'circle');
        Object.entries(circleAtt).forEach(attr => ellipseElem.setAttribute(...attr));

        svgElem.appendChild(ellipseElem);
        divPlaybackRate.appendChild(svgElem);
        divPlaybackRate.appendChild(divPRVal);

        return divPlaybackRate;
    }

    function handleWheelPR(event) {
      event.preventDefault(); // Предотвращаем скролл страницы
      const playbackRateDelta = 0.1 * Math.sign(event.deltaY) * -1;
      const video = event.target.closest('.player__player').querySelector('video');
      video.playbackRate += playbackRateDelta;
      video.playbackRate = Math.min(Math.max(video.playbackRate, 0.1), 3); // Ограничиваем диапазон скорости (0.1 - 3)
      const divPRVal = event.target.querySelector('.playbackValue');
      divPRVal.textContent = video.playbackRate.toFixed(1);
    };

    function prepareHandlerWPR(element) {
        const divPR = createDivPR();
        element.lastElementChild.appendChild(divPR);
        divPR.addEventListener('wheel', handleWheelPR);
    };

    handlers.set('playbackRate', prepareHandler(selector, prepareHandlerWPR));

  },

  volumeScroll: function (){
    const palyerQ = '.player'
    const volumeQ = '.player__volume-container';
    const lsVName = 'pkb_Ply_v';

    function handleVolumeS(event) {
      event.preventDefault(); // Предотвращаем скролл страницы
      const player = event.target.closest(palyerQ);
      const volumeDelta = 0.1 * Math.sign(event.deltaY) * -1;
      const jq = changeVloumeJQ(player, volumeDelta);
      if (!jq) changeVloumeNative(player, volumeDelta);
    };

    function changeVloumeJQ(player, volumeDelta){
      const propList = Object.getOwnPropertyNames(player);
      for (let p of propList) {
        if (player[p]?._uiElement?.volume !== undefined){
          player[p]._uiElement.volume += volumeDelta;
          return true;
        } else {
          return false;
        }
      };
    };

    function changeVloumeNative(player, volumeDelta){ 
      const video = player.querySelector('video');
      video.volume = Math.min(Math.max(video.volume + volumeDelta, 0), 1); // Ограничиваем диапазон скорости (0 - 1)

      const lsV = window.localStorage.getItem(lsVName);
      if (lsV) {
        let volS = JSON.parse(lsV);
        if (volS.vo !== undefined) {volS.vo = video.volume};
        window.localStorage.setItem(lsVName, JSON.stringify(volS));
      }

      const slider = player.querySelector('.player__volume-amount')
      if (slider) {
        slider.style.transform = `translateY(${100 - (video.volume * 100)}%)`
      }
    };

    function setWheelEvent(e){
      e.addEventListener('wheel', handleVolumeS);
    }

    handlers.set('volumeScroll', prepareHandler(volumeQ, setWheelEvent));
  },

  noPauseVideo: function (){
    const elem = document.createElement('meta');
    elem.id = 'noPauseVideo';
    document.head.appendChild(elem);
  },

  hiddenLink: function (){
    const hiddenCl = 'hiddenLink';
    const notHiddenCl = 'notHiddenLink';
    const targetLinks = settings.checkbox.hiddenLink.badLinks.value;

    const selector = targetLinks.split(/[,\s]+/).map(item => `p > a[href*="${item.trim()}"]`).join(', ');

    function findBR(e) {return e.nodeName === 'BR'};

    function hideLink(elemLink) {
      if (elemLink.parentNode.matches('.' + hiddenCl)) return;

      let childArray = Array.from(elemLink.parentNode.childNodes);
      let eIndex = childArray.indexOf(elemLink);

      let leftIndex = childArray.slice(0, eIndex).findLastIndex(findBR);
      leftIndex = leftIndex >= 0 ? leftIndex + 1 : 0;

      let rightIndex = childArray.slice(eIndex + 1).findIndex(findBR);
      rightIndex = rightIndex >= 0 ? rightIndex + eIndex : childArray.length

      let linkRange = childArray.slice(leftIndex, rightIndex + 1);
      if (linkRange.length == 0) return;

      const span = document.createElement('span');
      span.className = hiddenCl;
      elemLink.after(span);
      span.append(...linkRange);
      span.addEventListener('click', toggleClass);
    };

    function toggleClass(e){
      const t = e.currentTarget.classList;
      t.toggle(notHiddenCl, !t.toggle(hiddenCl))
    };

    document.addEventListener('DOMContentLoaded', ()=>{
      prepareHandler(selector, hideLink)(document.body)
    });

    handlers.set('hiddenLink',prepareHandler(selector, hideLink));
  },

  hideEmotions: function (){
    let cssRule = ' {display: none !important;}';
    let selClNames = [];
    const subVal = settings.checkbox.hideEmotions.subVal;
    if (subVal.comment.value) selClNames.push('.comment__emotions');
    if (subVal.story.value) selClNames.push('.story__emotions');
    if(selClNames.length){
      cssRule = selClNames.join(', ') + cssRule;
      const styleEl = document.createElement('style');
      styleEl.textContent = cssRule;
      styleEl.id = 'noEmotions';
      document.head.appendChild(styleEl);
    }
  }
}

fixPikabu();
