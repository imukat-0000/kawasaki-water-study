(() => {
  const video = document.querySelector('.water-video');
  const fishVideo = document.querySelector('.fish-video');
  const water = document.querySelector('.water');
  const canvas = document.createElement('canvas');
  canvas.className = 'ripple-water';
  canvas.setAttribute('aria-hidden', 'true');
  water.append(canvas);
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  if (!gl) { canvas.remove(); return; }
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D waterVideo; uniform sampler2D fishVideo; uniform vec2 fishCrop; uniform float fishReady;
    uniform vec2 viewport; uniform vec2 crop; uniform vec4 waves[24]; uniform int waveCount;
    void main(){
      vec2 p=vec2(uv.x,1.-uv.y)*viewport;
      vec2 displacement=vec2(0.); float light=0.;
      for(int i=0;i<24;i++){
        if(i>=waveCount)break;
        vec4 w=waves[i]; float age=w.z;
        vec2 delta=p-w.xy; float d=length(delta);
        float radius=age*115.; float band=d-radius;
        if(abs(band)>160.)continue;
        float envelope=exp(-band*band/1700.)*exp(-age*.72)*w.w;
        float phase=band*.15;
        float slope=cos(phase)*envelope;
        displacement+=delta/max(d,1.)*slope*11.;
        light+=slope*.095;
      }
      vec2 sampleUV=(uv+vec2(displacement.x,-displacement.y)/viewport-.5)*crop+.5;
      vec3 color=texture2D(waterVideo,clamp(sampleUV,vec2(.001),vec2(.999))).rgb;
      color+=clamp(light,-.17,.17);
      color=(color*1.05-.5)*1.02+.5;
      float grey=dot(color,vec3(.2126,.7152,.0722));
      color=mix(vec3(grey),color,.30);
      // Isolate the vermilion fish already rendered in the supplied film.
      // Neutral water is excluded, leaving the existing water background intact.
      vec2 fishUV=(uv+vec2(displacement.x,-displacement.y)/viewport*.65-.5)*fishCrop+.5;
      vec3 fish=texture2D(fishVideo,clamp(fishUV,vec2(.001),vec2(.999))).rgb;
      float warmth=fish.r-max(fish.g,fish.b);
      float alpha=smoothstep(.025,.12,warmth)*fishReady;
      color=mix(color,fish+light*.18,alpha*.94);
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(result));
    return result;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('Water renderer unavailable');
  } catch (error) { canvas.remove(); return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const fishTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fishTexture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([200,200,200]));
  gl.uniform1i(gl.getUniformLocation(program,'waterVideo'),0);
  gl.uniform1i(gl.getUniformLocation(program,'fishVideo'),1);
  const fishCropUniform=gl.getUniformLocation(program,'fishCrop');
  const fishReadyUniform=gl.getUniformLocation(program,'fishReady');
  const viewport = gl.getUniformLocation(program, 'viewport');
  const crop = gl.getUniformLocation(program, 'crop');
  const waveUniform = gl.getUniformLocation(program, 'waves[0]');
  const waveCountUniform = gl.getUniformLocation(program, 'waveCount');
  const values = new Float32Array(24 * 4), waves = [];
  let width, height, pointer = null, lastPoint, lastDrop = 0, time = 0, previous = 0, stopped = false;
  let needsDraw = true, drawnWaves = 0, fishWasReady = false, shown = false;
  // video.currentTime is a continuous clock and changes on every animation frame, so it
  // cannot tell whether a new picture exists. requestVideoFrameCallback reports each
  // decoded frame (24/s for these films). If a browser stops reporting frames for a
  // playing video, fall back to the clock so the water never freezes.
  const frameClock = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  let waterFrames = 0, fishFrames = 0, waterFrameAt = -1e9, fishFrameAt = -1e9;
  if (frameClock) {
    const count = (source, tick) => { const next = (at) => { tick(at); source.requestVideoFrameCallback(next); }; source.requestVideoFrameCallback(next); };
    count(video, at => { waterFrames++; waterFrameAt = at; });
    if (fishVideo) count(fishVideo, at => { fishFrames++; fishFrameAt = at; });
  }
  const frameKey = (source, frames, at, now) => frameClock && now - at < 250 ? 'f' + frames : 't' + source.currentTime;
  // Always texImage2D: Safari/WebKit has a GPU fast path only for full video uploads;
  // texSubImage2D from a <video> falls back to a CPU copy there (measured ~3x slower).
  function upload(source) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height); waves.length = 0; needsDraw = true;
  }
  resize(); window.addEventListener('resize', resize);
  function drop(x, y, strength) {
    if (waves.length === 24) waves.shift();
    waves.push({ x, y, born: time, strength });
    canvas.dataset.rippleCount = String(Number(canvas.dataset.rippleCount || 0) + 1);
  }
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('a,button,input,textarea,select') || paused || window.backgroundSuspended) return;
    pointer = event.pointerId; lastPoint = { x: event.clientX, y: event.clientY }; lastDrop = time;
    drop(event.clientX, event.clientY, 1.15);
    if (event.pointerType === 'mouse') event.preventDefault();
  });
  document.addEventListener('pointermove', event => {
    if (paused || window.backgroundSuspended || (event.pointerType !== 'mouse' && pointer !== event.pointerId)) return;
    if (event.target.closest('.controls')) { lastPoint = null; return; }
    if (!lastPoint) {
      lastPoint = { x: event.clientX, y: event.clientY }; lastDrop = time;
      drop(event.clientX, event.clientY, .8); return;
    }
    const distance = Math.hypot(event.clientX-lastPoint.x, event.clientY-lastPoint.y);
    if (time-lastDrop < .045 || distance < 9) return;
    drop(event.clientX, event.clientY, Math.min(1.15, .65+distance/120));
    lastPoint = { x: event.clientX, y: event.clientY }; lastDrop = time;
  });
  function release() { pointer = null; lastPoint = null; }
  document.addEventListener('pointerup', release); document.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);
  document.documentElement.addEventListener('pointerleave', release);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); stopped = true; canvas.style.visibility = 'hidden'; video.style.opacity = '1';
  });
  let frame=0,waterStamp=-1,fishStamp=-1;
  function active(){return !stopped && !paused && !window.backgroundSuspended;}
  function wake(){
    if(!active()){cancelAnimationFrame(frame);frame=0;previous=0;release();return;}
    if(!frame)frame=requestAnimationFrame(render);
  }
  window.addEventListener('backgroundactivity',wake);
  new MutationObserver(wake).observe(document.querySelector('#motion'),{attributes:true,attributeFilter:['aria-pressed']});
  function render(now) {
    frame=0;
    if (!active()){previous=0;return;}
    const dt = previous ? Math.min((now-previous)/1000, .05) : 0; previous = now;
    if (!paused) time += dt;
    while(waves.length && time-waves[0].born>4.5)waves.shift();
    window.FloatingLeaves?.update(time, paused ? 0 : dt, waves, width, height);
    if (video.readyState >= 2) {
      try {
        let changed = needsDraw;
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
        const waterKey=frameKey(video,waterFrames,waterFrameAt,now);
        if(waterStamp!==waterKey){upload(video);waterStamp=waterKey;changed=true;}
        const fishReady=fishVideo&&fishVideo.readyState>=2;
        if(fishReady!==fishWasReady){fishWasReady=fishReady;changed=true;}
        if(fishReady){
          gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fishTexture);
          const fishKey=frameKey(fishVideo,fishFrames,fishFrameAt,now);
          if(fishStamp!==fishKey){upload(fishVideo);fishStamp=fishKey;changed=true;}
        }
        if (changed || waves.length || drawnWaves) {
          if(fishReady){
            const fishAspect=fishVideo.videoWidth/fishVideo.videoHeight;
            const screenAspect=width/height;
            gl.uniform2f(fishCropUniform,Math.min(1,screenAspect/fishAspect)*.72,Math.min(1,fishAspect/screenAspect)*.72);
          }
          gl.uniform1f(fishReadyUniform,fishReady?1:0);
          const viewAspect = width/height, videoAspect = video.videoWidth/video.videoHeight;
          gl.uniform2f(crop, Math.min(1, viewAspect/videoAspect), Math.min(1, videoAspect/viewAspect));
          gl.uniform2f(viewport, width, height); values.fill(0);
          waves.forEach((wave, i) => {
            const age = time-wave.born;
            values.set([wave.x, wave.y, age, age < 4.5 ? wave.strength : 0], i*4);
          });
          gl.uniform4fv(waveUniform, values); gl.uniform1i(waveCountUniform, waves.length);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
          needsDraw = false; drawnWaves = waves.length;
          if (!shown) { canvas.style.opacity = '1'; video.style.opacity = '0'; shown = true; }
        }
      } catch (error) { stopped = true; canvas.remove(); video.style.opacity = '1'; return; }
    }
    frame=requestAnimationFrame(render);
  }
  wake();
})();
