'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const camera = $('camera'), result = $('result'), canvas = $('canvas');
  const status = $('status'), start = $('start'), shoot = $('shoot');
  const retake = $('retake'), download = $('download'), switchBtn = $('switch');
  const placeholder = $('placeholder'), fallback = $('fallback');
  const engine = window.PhotoboothFilters;
  if (!engine) { status.textContent = 'Thiếu thư viện bộ lọc.'; return; }
  const presets = engine.presets;
  let selected = presets[0], stream = null, facing = 'user';
  let captured = null, imageUrl = null, downloadUrl = null, renderVersion = 0;
  const setStatus = text => { status.textContent = text; };
  const isSecure = window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

  function renderFilters() {
    const list = $('filterList');
    presets.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = p.label;
      btn.dataset.filter = p.id;
      btn.title = p.source === 'base' ? 'Photobooth' : 'Reference: ' + p.source;
      btn.addEventListener('click', () => {
        selected = p;
        Array.from(list.children).forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        updateFilter();
      });
      btn.setAttribute('aria-pressed', String(p === selected));
      list.appendChild(btn);
    });
    list.firstElementChild.classList.add('active');
  }
  function updateFilter() {
    camera.style.filter = selected.css;
    if (captured) renderPhoto();
  }
  function stopStream() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    camera.srcObject = null;
  }
  async function openCamera() {
    if (!isSecure) {
      fallback.style.display = 'block';
      setStatus('Camera live cần HTTPS trên iPhone. Bạn vẫn có thể dùng nút Chụp bằng camera iPhone bên dưới.');
      return;
    }
    start.disabled = true;
    stopStream();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false, video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 }, height: { ideal: 1080 }
        }
      });
      camera.srcObject = stream;
      await camera.play();
      camera.classList.toggle('mirror', facing === 'user');
      camera.style.display = 'block';
      result.style.display = 'none';
      placeholder.hidden = true;
      captured = null;
      shoot.disabled = false; switchBtn.disabled = false;
      retake.hidden = true; download.hidden = true;
      setStatus('Chọn filter để xem trước, sau đó nhấn Chụp ảnh.');
    } catch (err) {
      fallback.style.display = 'block';
      setStatus('Không mở được camera: ' + (err?.message || 'Chưa được cấp quyền'));
    } finally { start.disabled = false; }
  }
  function capture() {
    if (!stream || !camera.videoWidth) { setStatus('Camera chưa sẵn sàng.'); return; }
    const factor = Math.min(1, 2048 / Math.max(camera.videoWidth, camera.videoHeight));
    const w = Math.max(1, Math.round(camera.videoWidth * factor));
    const h = Math.max(1, Math.round(camera.videoHeight * factor));
    captured = document.createElement('canvas');
    captured.width = w; captured.height = h;
    const ctx = captured.getContext('2d');
    if (facing === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(camera, 0, 0, w, h);
    showResult();
  }
  function showResult() {
    stopStream();
    camera.style.display = 'none';
    result.style.display = 'block';
    shoot.disabled = true; switchBtn.disabled = true;
    retake.hidden = false; placeholder.hidden = true;
    setStatus('Chọn filter và nhấn Download ảnh. Ảnh được xử lý ngay trên thiết bị.');
    updateFilter();
  }
  function renderPhoto() {
    const version = ++renderVersion;
    download.hidden = true;
    try {
      engine.apply(canvas, captured, selected);
      canvas.toBlob(blob => {
        if (version !== renderVersion) return;
        if (!blob) { setStatus('Không tạo được ảnh tải xuống.'); return; }
        const newUrl = URL.createObjectURL(blob);
        const oldUrl = imageUrl;
        imageUrl = newUrl;
        result.onload = () => {
          result.onload = null;
          if (oldUrl) URL.revokeObjectURL(oldUrl);
        };
        result.src = newUrl;
        result.style.filter = 'none';
        if (downloadUrl && downloadUrl !== oldUrl && downloadUrl !== newUrl) URL.revokeObjectURL(downloadUrl);
        downloadUrl = newUrl;
        download.href = newUrl;
        download.download = 'photobooth-' + new Date().toISOString().replace(/[:.]/g, '-') + '.jpg';
        download.hidden = false;
      }, 'image/jpeg', .94);
    } catch (err) {
      setStatus('Lỗi xử lý filter: ' + (err?.message || String(err)));
    }
  }
  function handlePickedImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) {
      setStatus('Chỉ chấp nhận ảnh nhỏ hơn 20 MB.'); return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const factor = Math.min(1, 2048 / Math.max(img.naturalWidth, img.naturalHeight));
      captured = document.createElement('canvas');
      captured.width = Math.round(img.naturalWidth * factor);
      captured.height = Math.round(img.naturalHeight * factor);
      captured.getContext('2d').drawImage(img, 0, 0, captured.width, captured.height);
      URL.revokeObjectURL(url);
      showResult();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus('Không thể đọc định dạng ảnh này. Hãy thử JPEG hoặc PNG.');
    };
    img.src = url;
  }
  $('pick').addEventListener('change', handlePickedImage);
  $('nativeCamera').addEventListener('change', handlePickedImage);
  start.addEventListener('click', openCamera);
  shoot.addEventListener('click', capture);
  switchBtn.addEventListener('click', () => {
    facing = facing === 'user' ? 'environment' : 'user';
    openCamera();
  });
  retake.addEventListener('click', openCamera);
  window.addEventListener('pagehide', () => {
    stopStream();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (downloadUrl && downloadUrl !== imageUrl) URL.revokeObjectURL(downloadUrl);
  });
  renderFilters();
  if (!isSecure) fallback.style.display = 'block';
})();
