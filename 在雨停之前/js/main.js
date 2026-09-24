/* ============================================================
 * 入口
 * ============================================================ */
(function () {
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.GAME_DATA) {
      document.body.innerHTML = '<div style="color:#c88;padding:2em;font-family:serif">剧本数据缺失，请先运行 node tools/parse.js</div>';
      return;
    }
    VN.UI.init();

    // 首次点击时解锁 AudioContext（浏览器自动播放策略）
    document.addEventListener('click', function unlock() {
      const cfg = VN.Engine.getCfg();
      if (cfg.rain) VN.UI.rainAudio.start(cfg.vol);
      document.removeEventListener('click', unlock);
    }, { once: true });
  });
})();
