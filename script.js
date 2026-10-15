'use strict';
const navigation = document.querySelector('.navigation');
const menuButton = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
navigation.classList.add('enhanced');
menuButton.hidden = false;
function closeMenu() { links.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => { const open = links.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); });
links.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && links.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
const video = document.getElementById('hero-video');
const playButton = document.getElementById('play-video');
const muteButton = document.getElementById('mute-video');
const videoStatus = document.getElementById('video-status');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let videoFailed = false;
function syncControls() { playButton.textContent = video.paused ? 'Play video' : 'Pause video'; muteButton.textContent = video.muted ? 'Enable sound' : 'Mute sound'; muteButton.setAttribute('aria-pressed', String(!video.muted)); }
function fallback() { videoFailed = true; video.classList.remove('ready'); playButton.disabled = true; muteButton.disabled = true; videoStatus.textContent = 'Video unavailable · showing portrait background'; }
async function play() { if (videoFailed) return; try { await video.play(); videoStatus.textContent = 'Portfolio introduction video'; } catch { videoStatus.textContent = 'Select Play video to watch the introduction'; } syncControls(); }
video.addEventListener('loadeddata', () => { video.classList.add('ready'); playButton.disabled = false; muteButton.disabled = false; syncControls(); });
video.addEventListener('error', fallback);
video.addEventListener('play', syncControls);
video.addEventListener('pause', syncControls);
video.addEventListener('volumechange', syncControls);
playButton.addEventListener('click', () => { if (video.paused) play(); else video.pause(); });
muteButton.addEventListener('click', () => { video.muted = !video.muted; syncControls(); });
video.muted = true;
video.src = 'gemini_generated_video_fd623309.mp4';
// Reduced-motion visitors choose whether to load and play the moving background.
if (motionPreference.matches) { playButton.disabled = false; video.preload = 'none'; videoStatus.textContent = 'Motion reduced · select Play video to watch'; }
else { video.autoplay = true; play(); }
motionPreference.addEventListener('change', event => { if (event.matches) { video.pause(); videoStatus.textContent = 'Motion reduced · background paused'; } });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => { if (!entries[0].isIntersecting) video.pause(); }, { threshold: 0 }).observe(document.getElementById('home'));
  const navAnchors = [...links.querySelectorAll('a')];
  const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.isIntersecting) navAnchors.forEach(anchor => { const active = anchor.hash === '#' + entry.target.id; anchor.classList.toggle('active', active); if (active) anchor.setAttribute('aria-current', 'location'); else anchor.removeAttribute('aria-current'); }); }); }, { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}

