console.log('Hi!');
let settings = {};

//create element halper
function createEl(descr, nameSpace) {
  const match = descr.match(/^([a-z]+)(?:#([a-z][a-z0-9_-]*))?((?:\.[a-z][a-z0-9_-]*)+)?$/i);
  if (!match || !match[1]) return undefined;
  const el = nameSpace ? document.createElementNS(nameSpace, match[1]) : document.createElement(match[1])
  if (match[2]) el.id = match[2];
  (match[3] || '').split('.').forEach(c => { if (c) el.classList.add(c) });
  return el;
};

function createElArray(descr, nameSpace) {
  const descrArray = descr.split('>').map(e => e.trim());
  let elArray = []
  descrArray.forEach((d, i) => {
    let el = createEl(d, nameSpace);
    elArray.push(el);
    if (i === 0) return;
    elArray[i - 1].appendChild(el);
  })
  return elArray;
};

function createSVG(clName, ref){
  const w3svg = 'http://www.w3.org/2000/svg';
  const [svgEl, useEl] = createElArray(`svg.${clName} > use`, w3svg);
  useEl.setAttribute('href', ref);
  return svgEl;
};

// additional functions
function processUIF(uiF, container) {
  const uiFunctions = {
    colorGridHandler: function (container) {
      const colorGrid = createEl(`div.colorGrid`);
      container.input.colorGrid = colorGrid;
      Object.entries(settings.color).forEach(e => { createCont.color(...e, colorGrid) });
      container.appendChild(colorGrid);
      colorGrid.classList.toggle('hidden', !container.input.checked);
    },
    badLinks: function (container) {
      const [pCont, pRow, textRow] = createElArray('div.paramContainer > div.paramRow > div.badLinkList');
      const pencil = createSVG('pencil', '#iconPencil');
      const content = settings.checkbox.hiddenLink.badLinks
      textRow.textContent = content.value
      textRow.before(pencil);
      pencil.textRow = textRow;
      pencil.addEventListener('mouseup', eventHandler.textEditor('badLinks', content));
      container.appendChild(pCont);
      container.input.badLinksCont = pCont;
      pCont.classList.toggle('hidden', !container.input.checked);
    },
    hideEmotions: function (container) {
      const pCont = createEl('div.subPContainer');
      const subVal = settings.checkbox.hideEmotions.subVal;
      Object.entries(subVal).forEach(e => { createCont.checkbox(...e, pCont) });
      container.appendChild(pCont);
      container.input.subPContainer = pCont;
      pCont.classList.toggle('hidden', !container.input.checked);
    }
  };

  const fun = uiFunctions[uiF];
  if (typeof fun === 'function') fun(container)
};

class EventHandler {
  constructor() { }

  defaultEvent(e) {
    const target = e.currentTarget;
    if (target.type === 'color') {
      target.settings.value = target.value;
      target.colorValue.textContent = target.value;
    } else if (target.type === 'checkbox') {
      target.settings.value = target.checked;
    }
  }

  textEditor(name, content){
    return function(e){
      const [bs, scrInp, inp] = createElArray('div.backShadow > div.fullScrInpCont > div.inputText');
      inp.textContent = content.value;
      inp.setAttribute('contenteditable', 'true');
      inp.textRow = e.currentTarget.textRow;
      inp.id = name;
      inp.content = content;
      const apprSVG = createSVG('approve', '#iconApproveRound');
      apprSVG.input = inp;
      apprSVG.addEventListener('mouseup', this.approveTextEditor);
      const closeSVG = createSVG('close', '#iconCloseRound');
      closeSVG.addEventListener('mouseup', this.closeTextEditor);
      const buttonCont = createEl('div.buttonCont');
      buttonCont.append(apprSVG, closeSVG);
      scrInp.append(buttonCont);
      document.body.append(bs);
    }.bind(this);
  }

  closeTextEditor(e){
    const target = e.currentTarget;
    target.closest('div.backShadow').remove();
  }

  approveTextEditor(e){
    const inp = e.target.closest('div.fullScrInpCont').querySelector('div.inputText');
    const text = inp.innerText.split(/[,\s]+/).join(', ')
    inp.textRow.innerText = text;
    inp.content.value = text;
    e.target.closest('div.backShadow').remove();
  }

  colorGridHandler(e){
    const target = e.currentTarget;
    target.colorGrid.classList.toggle('hidden', !target.checked);
    this.defaultEvent(e);
  }

  badLinks(e){
    const target = e.currentTarget;
    target.badLinksCont.classList.toggle('hidden', !target.checked);
    this.defaultEvent(e);
  }

  hideEmotions(e){
    const target = e.currentTarget;
    target.subPContainer.classList.toggle('hidden', !target.checked);
    this.defaultEvent(e);
  }

  getEvent(uiF){
    return this[uiF]?.bind(this) || this.defaultEvent.bind(this);
  }
}
const eventHandler = new EventHandler();


// container
class SettingsContainer {
  constructor(){}
  getContainer(id, att, type) {
    const [pCont, pRow, name] = createElArray('div.paramContainer > div.paramRow > div.paramName');
    name.textContent = att.text;
    const inp = createEl(`input#${id}.${type}`);
    pCont.input = inp;
    inp.type = type;
    inp.name = att.text;
    inp.settings = att;
    inp.addEventListener('input', eventHandler.getEvent(att.uiF));
    pRow.append(inp);
    return pCont;
  }

  color(id, att, parent) {
    const cont = this.getContainer(id, att, 'color');
    cont.input.value = att.value;
    const colorValue = createEl('div.colorValue');
    colorValue.textContent = att.value;
    cont.input.colorValue = colorValue;
    cont.firstElementChild.appendChild(colorValue);
    processUIF(att.uiF, cont);
    parent.appendChild(cont);
  }

  checkbox(id, att, parent) {
    const cont = this.getContainer(id, att, 'checkbox');
    cont.input.checked = att.value;
    processUIF(att.uiF, cont);
    parent.appendChild(cont);
  }
}
const createCont = new SettingsContainer();


//settings

function saveSettings() {
  chrome.storage.sync.set(settings, () => {
    const saveStatus = document.querySelector('#saveStatus')
    saveStatus.textContent = 'Сохранено'
  })
};

function getBackup(obj){
  for (e in obj){
    if (typeof obj[e] === 'object' && obj[e]){
      if (obj[e].backup) {
        obj[e].value = obj[e].backup
      };
      getBackup(obj[e]);
    }
  }
}

function defaultSettings() {
  getBackup(settings)
  document.querySelector('div#checkboxGrid').replaceChildren();
  setContent();
};


//page process
function setContent() {

  const checkboxGrid = document.querySelector('div#checkboxGrid');
  const fragment = document.createDocumentFragment();
  Object.entries(settings.checkbox).forEach(e => { createCont.checkbox(...e, fragment) });
  checkboxGrid.appendChild(fragment);


  document.querySelector('button#save').addEventListener('mouseup', saveSettings);
  document.querySelector('button#default').addEventListener('mouseup', defaultSettings);
};

async function processStart() {
  try {
    settings = await chrome.storage.sync.get();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setContent);
    } else {
      setContent();
    }
  } catch (error) {
    console.error(error);
  }
};

processStart();
