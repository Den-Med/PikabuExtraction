const noPauseVideo = function (){
    const pauseF = HTMLMediaElement.prototype.pause;
    if (!pauseF.toString().includes('native code')) return;
    function newPause(){
      const meta = !!document.querySelector('meta#noPauseVideo');
      const vf = '_onVisibilityChange';
      let e = new Error;
      let visibilityChange = e.stack.includes(vf);
      if (visibilityChange && meta) return;
      pauseF.apply(this);
    };
    HTMLMediaElement.prototype.pause = newPause;
}
noPauseVideo();
