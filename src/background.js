let actSettings = {};
const settings = {};

settings.color = {
  'color-black-940': {text: "Black 940", value: '#c2c4c6'},
  'color-primary-900': {text: "Primary 900", value: "#679d47"},
  'color-black-800': {text: "Black 800", value: "#8f939d"},
  'color-bright-800': {text: "Bright 800", value: "#1f2023"},
  'collapse-hover': {text: "Collapse hover", value: "#444751"}
};

settings.checkbox = {
  changeColors: {text: 'Изменить цвета', value: true, uiF: 'colorGridHandler'},
  betterCarousel: {text: 'Чуть лучше карусель', value: true},
  cleanLink: {text: 'Чистые ссылки', value: true},
  playbackRate: {text: 'Скорость видео', value: true},
  noPauseVideo: {text: 'Нет автопаузе', value: true},
  volumeScroll: {text: 'Громкость через колёсико', value: true},
  hiddenLink: {text: 'Скрыть ссылки', value: true, uiF: 'badLinks', badLinks: {
    value: 't.me, aliclick.shop, gbest.by, lres.bz, shp.pub, alli.pub'
  }},
  hideEmotions: {text: 'Скрыть реакции', value: true, uiF: 'hideEmotions', subVal: {
    comment: {text: 'В комментариях', value: true}, 
    story: {text: 'Под постом',value: true} 
  }}
};

function setBackup(obj){
  for (e in obj){
    if (obj[e] && typeof obj[e] === 'object'){
      if (obj[e].value) {
        obj[e].backup = obj[e].value
      };
      setBackup(obj[e]);
    }
  }
}

function deepUpdate(oldObj, newObj) {
  for (const key in oldObj) {
    if (!(key in newObj)) {
      delete oldObj[key];
    }
  }

  for (const key in newObj) {
    if (key === 'value') {
      if (!(key in oldObj)) {
        oldObj[key] = newObj[key];
      }
    } else {
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      if (typeof newVal === 'object' && newVal !== null) {
        if (typeof oldVal === 'object' && oldVal !== null) {
          deepUpdate(oldVal, newVal);
        } else {
          oldObj[key] = Array.isArray(newVal) ? [] : {};
          deepUpdate(oldObj[key], newVal);
        }
      } else {
        oldObj[key] = newVal;
      }
    }
  }
}

setBackup(settings);

async function onInstProcess(){
  actSettings = await chrome.storage.sync.get();
  deepUpdate(actSettings, settings)
  chrome.storage.sync.set(actSettings, ()=>{console.log('Settings seted onInstalled', )});
}

chrome.runtime.onInstalled.addListener(onInstProcess);