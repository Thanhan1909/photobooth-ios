'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const camera = $('camera'), result = $('result'), canvas = $('canvas');
  const status = $('status'), start = $('start'), shoot = $('shoot');
  const retake = $('retake'), download = $('download'), switchBtn = $('switch');
  const placeholder = $('placeholder'), fallback = $('fallback');
  const presets = [
    ['plain','None','none'],['antique','Antique','sepia(.7) contrast(1.13) brightness(.93)'],
    ['aqua','Aqua','hue-rotate(145deg) saturate(1.7)'],['blue','Blue','sepia(.4) hue-rotate(165deg) saturate(1.7)'],
    ['blur','Blur','blur(2px)'],['color','Color','saturate(1.6) contrast(1.05)'],
    ['cool','Cool','hue-rotate(15deg) saturate(1.15)'],['everglow','Everglow','brightness(1.18) saturate(1.25)'],
    ['grayscale','Grayscale','grayscale(1)'],['green','Green','sepia(.45) hue-rotate(65deg) saturate(1.5)'],
    ['negate','Negate','invert(1)'],['pink','Pink','sepia(.3) hue-rotate(285deg) saturate(1.4)'],
    ['red','Red','sepia(.5) hue-rotate(300deg) saturate(1.5)'],['retro','Retro','sepia(.45) contrast(1.12) saturate(.8)'],
    ['sepia-light','Sepia light','sepia(.55)'],['sepia-dark','Sepia dark','sepia(.9) contrast(1.15) brightness(.8)'],
    ['smooth','Smooth','contrast(.94) brightness(1.04)'],['summer','Summer','sepia(.18) saturate(1.4) brightness(1.08)'],
    ['vintage','Vintage','sepia(.55) contrast(.88) brightness(.96)'],['washed','Washed','contrast(.75) brightness(1.14)'],
    ['yellow','Yellow','sepia(.4) saturate(1.5) hue-rotate(345deg)']
  ];
  let selected = presets[0], stream = null, facing = 'user';
  let captured = null, sourceFile = null, objectUrl = null, downloadUrl = null;
  const setStatus = text => { status.textContent = text; };
  const isSecure = window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
  function renderFilters() {
    const list = $('filterList');
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = p[1]; btn.dataset.filter = p[0];
      btn.addEventListener('click', () => {
        selected = p;
        Array.from(list.children).forEach(b => b.classList.toggle('active', b === btn));
        updateFilter();
      });
      list.appendChild(btn);
    });
    list.firstElementChild.classList.add('active');
  }
  function updateFilter() {
    camera.style.filter = selected[2];
    result.style.filter = selected[2];
    if (captured || sourceFile) makeDownload();
  }
  function stopStream() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    camera.srcObject = null;
  }
  async function openCamera() {
    if (!isSecure) {
      fallback.style.display = 'block';
      setStatus('Camera trực tiếp cần HTTPS trên iPhone (hoặc localhost trên PC). Dùng link HTTPS để chụp trực tiếp.');
      return;
    }
    start.disabled = true;
    stopStream();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      camera.srcObject = stream;
      await camera.play();
      camera.classList.toggle('mirror', facing === 'user');
      placeholder.hidden = true;
      camera.style.display = 'block';
      result.style.display = 'none';
      captured = null;
      if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
      sourceFile = null;
      shoot.disabled = false; switchBtn.disabled = false;
      retake.hidden = true; download.hidden = true;
      setStatus('Đã mở camera. Chọn filter rồi bấm Chụp ảnh.');
    } catch (err) {
      fallback.style.display = 'block';
      setStatus('Không thể mở camera: ' + (err?.message || 'Chưa được cấp quyền.'));
    } finally { start.disabled = false; }
  }
  function capture() {
    if (!stream || !camera.videoWidth) { setStatus('Camera chưa sẵn sàng.'); return; }
    const max = 2400;
    const factor = Math.min(1, max / Math.max(camera.videoWidth, camera.videoHeight));
    canvas.width = Math.round(camera.videoWidth * factor);
    canvas.height = Math.round(camera.videoHeight * factor);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    if (facing === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    captured = document.createElement('canvas');
    captured.width = canvas.width; captured.height = canvas.height;
    captured.getContext('2d').drawImage(canvas, 0, 0);
    showResult();
  }
  function showResult() {
    stopStream();
    const current = captured ? captured.toDataURL('image/jpeg', .95) : objectUrl;
    result.src = current;
    result.style.display = 'block';
    camera.style.display = 'none';
    shoot.disabled = true; switchBtn.disabled = true;
    retake.hidden = false;
    placeholder.hidden = true;
    setStatus('Đã chụp. Có thể đổi filter, Download ảnh hoặc Chụp lại.');
    updateFilter();
  }
  function makeDownload() {
    const source = captured || result;
    if (!(source instanceof HTMLCanvasElement) && !source.complete) return;
    canvas.width = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth;
    canvas.height = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight;
    if (!canvas.width || !canvas.height) return;
    const ctx = canvas.getContext('2d');
    // Use native canvas filters, same visual CSS pipeline when available.
    if ('filter' in ctx) ctx.filter = selected[2];
    else { setStatus('Trình duyệt này chưa hỗ trợ lưu filter qua Canvas. Hãy cập nhật Safari.'); return; }
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    canvas.toBlob(blob => {
      if (!blob) { setStatus('Không thể tạo ảnh tải xuống.'); return; }
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(blob);
      download.href = downloadUrl;
      download.download = 'photobooth-' + new Date().toISOString().replace(/[:.]/g, '-') + '.jpg';
      download.hidden = false;
    }, 'image/jpeg', .95);
  }
  const handlePickedImage = e => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      setStatus('Chỉ chấp nhận ảnh nhỏ hơn 20 MB.'); return;
    }
    sourceFile = file; captured = null; stopStream();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    result.onload = () => { result.onload = null; showResult(); };
    result.onerror = () => setStatus('Không đọc được ảnh.');
    result.src = objectUrl;
  };
  $('pick').addEventListener('change', handlePickedImage);
  $('nativeCamera').addEventListener('change', handlePickedImage);
  start.addEventListener('click', openCamera);
  shoot.addEventListener('click', capture);
  switchBtn.addEventListener('click', () => { facing = facing === 'user' ? 'environment' : 'user'; openCamera(); });
  retake.addEventListener('click', openCamera);
  window.addEventListener('pagehide', () => { stopStream(); if (objectUrl) URL.revokeObjectURL(objectUrl); if (downloadUrl) URL.revokeObjectURL(downloadUrl); });
  renderFilters();
  if (!isSecure) fallback.style.display = 'block';
})();
