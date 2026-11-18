const copyButton = document.querySelector("#discord-copy");

if (copyButton && navigator.clipboard?.writeText) {
  const handle = document.querySelector("#discord-handle");
  const status = document.querySelector("#discord-status");
  let resetCopyText;
  copyButton.hidden = false;

  copyButton.addEventListener("click", async () => {
    clearTimeout(resetCopyText);
    try {
      await navigator.clipboard.writeText(handle.textContent);
      copyButton.textContent = "Скопировано";
      status.textContent = "Ник Discord скопирован.";
    } catch {
      copyButton.textContent = "Повторить";
      status.textContent = "Не удалось скопировать ник. Можно выделить его вручную.";
    }

    resetCopyText = setTimeout(() => {
      copyButton.textContent = "Копировать";
      status.textContent = "";
    }, 2200);
  });
}

const lightbox = document.querySelector("#lightbox");

if (lightbox && typeof lightbox.showModal === "function") {
  const caption = document.querySelector("#lightbox-caption");
  const fullImage = document.createElement("img");
  fullImage.draggable = false;
  const viewport = document.querySelector("#lightbox-image");
  viewport.append(fullImage);
  const fullSizeLink = document.querySelector("#lightbox-full-size");
  const shots = [...document.querySelectorAll(".shot")];
  const zoomOut = document.querySelector("#zoom-out");
  const zoomReset = document.querySelector("#zoom-reset");
  const zoomIn = document.querySelector("#zoom-in");
  const minZoom = 1;
  const maxZoom = 4;
  const zoomStep = 0.25;
  let currentShot = 0;
  let zoom = minZoom;
  let drag = null;
  let swipeStart = null;

  function setZoom(value, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
    const nextZoom = Math.min(maxZoom, Math.max(minZoom, value));
    if (nextZoom === zoom) return;

    const relativeX = (viewport.scrollLeft + x) / Math.max(1, viewport.scrollWidth);
    const relativeY = (viewport.scrollTop + y) / Math.max(1, viewport.scrollHeight);
    zoom = nextZoom;
    viewport.style.setProperty("--zoom", zoom);
    viewport.classList.toggle("is-zoomed", zoom > minZoom);
    viewport.tabIndex = zoom > minZoom ? 0 : -1;
    viewport.scrollLeft = relativeX * viewport.scrollWidth - x;
    viewport.scrollTop = relativeY * viewport.scrollHeight - y;

    const percent = Math.round(zoom * 100) + "%";
    zoomReset.textContent = percent;
    zoomReset.setAttribute("aria-label", "Сбросить масштаб. Сейчас " + percent);
    zoomOut.disabled = zoom === minZoom;
    zoomIn.disabled = zoom === maxZoom;
  }

  function showShot(index) {
    swipeStart = null;
    setZoom(minZoom);
    currentShot = (index + shots.length) % shots.length;
    const shot = shots[currentShot];
    fullImage.alt = shot.querySelector("img").dataset.fullAlt;
    fullImage.src = shot.href;
    fullSizeLink.href = shot.href;
    caption.textContent = shot.dataset.caption
      ? (currentShot + 1) + " / " + shots.length + " · " + shot.dataset.caption
      : "";
  }

  shots.forEach((shot, index) => {
    shot.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showShot(index);
      lightbox.showModal();
    });
  });

  zoomOut.addEventListener("click", () => setZoom(zoom - zoomStep));
  zoomReset.addEventListener("click", () => setZoom(minZoom));
  zoomIn.addEventListener("click", () => setZoom(zoom + zoomStep));

  viewport.addEventListener("touchstart", (event) => {
    swipeStart = null;
    if (zoom !== minZoom || event.touches.length !== 1) return;
    const touch = event.touches[0];
    swipeStart = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
  }, { passive: true });

  viewport.addEventListener("touchend", (event) => {
    const start = swipeStart;
    swipeStart = null;
    if (!start || zoom !== minZoom || event.touches.length !== 0) return;

    const touch = Array.from(event.changedTouches).find((item) => item.identifier === start.id);
    if (!touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;

    showShot(currentShot + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  viewport.addEventListener("touchcancel", () => {
    swipeStart = null;
  }, { passive: true });

  viewport.addEventListener("wheel", (event) => {
    if (event.ctrlKey || event.shiftKey || event.deltaY === 0) return;
    event.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    setZoom(zoom - Math.sign(event.deltaY) * zoomStep, event.clientX - bounds.left, event.clientY - bounds.top);
  }, { passive: false });

  viewport.addEventListener("pointerdown", (event) => {
    if (zoom === minZoom || event.target !== fullImage || event.pointerType !== "mouse" || event.button !== 0) return;
    event.preventDefault();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-panning");
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    viewport.scrollLeft = drag.left + drag.x - event.clientX;
    viewport.scrollTop = drag.top + drag.y - event.clientY;
  });
  viewport.addEventListener("lostpointercapture", () => {
    drag = null;
    viewport.classList.remove("is-panning");
  });

  document.querySelector("#previous-shot").addEventListener("click", () => showShot(currentShot - 1));
  document.querySelector("#next-shot").addEventListener("click", () => showShot(currentShot + 1));
  lightbox.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target === viewport && zoom > minZoom) return;
    event.preventDefault();
    showShot(currentShot + (event.key === "ArrowLeft" ? -1 : 1));
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      lightbox.close();
    }
  });
  lightbox.addEventListener("close", () => fullImage.removeAttribute("src"));
}
