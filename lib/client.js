window.__ModuleLoader__.load({
  id: "dsh-background-plugin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const React = require("react");
    const h = React.createElement;

    const NAMESPACE = "ui-background";
    const SETTINGS_NS = "settings.background";
    const LAYER_ID = "dsh-background-layer";
    const STYLE_ID = "dsh-background-plugin-style";
    const MAX_FILE_SIZE = 8 * 1024 * 1024;
    const MAX_EDGE = 1600;
    const DEFAULTS = Object.freeze({
      enabled: false,
      preset: "aurora",
      image: "",
      fileName: "",
      opacity: 0.46,
      overlay: 0.54,
      blur: 0,
      fit: "cover",
      position: "center"
    });
    const FIELDS = Object.keys(DEFAULTS);
    let pendingDomReadyApply = false;
    const PRESETS = Object.freeze({
      aurora: {
        label: "极光",
        css: "radial-gradient(circle at 18% 16%, rgba(115,181,188,.58), transparent 32%), radial-gradient(circle at 84% 78%, rgba(91,74,145,.42), transparent 35%), linear-gradient(135deg,#07151d 0%,#182536 48%,#0a0b13 100%)"
      },
      ember: {
        label: "余烬",
        css: "radial-gradient(circle at 74% 18%, rgba(218,136,74,.54), transparent 28%), radial-gradient(circle at 16% 80%, rgba(132,50,44,.42), transparent 36%), linear-gradient(140deg,#171014 0%,#38221e 48%,#0b0b10 100%)"
      },
      paper: {
        label: "宣纸",
        css: "radial-gradient(circle at 78% 18%, rgba(232,205,143,.3), transparent 27%), linear-gradient(125deg,#27251f 0%,#5d5140 45%,#19191b 100%)"
      }
    });

    const CSS = String.raw`
      #${LAYER_ID}{position:fixed;inset:-28px;z-index:0;pointer-events:none;opacity:0;visibility:hidden;background:#0b0d12 center/cover no-repeat;transform:scale(1.04);filter:blur(0);transition:opacity .55s ease,visibility .55s ease,filter .4s ease}
      #${LAYER_ID}::after{content:"";position:absolute;inset:0;background:rgba(6,7,11,var(--dsh-background-overlay,.54))}
      #${LAYER_ID}[data-active=true]{opacity:var(--dsh-background-opacity,.46);visibility:visible}
      body[data-dsh-background-active]{--dsw-alias-bg-base:transparent!important;background:transparent!important}
      body[data-dsh-background-active]>#${LAYER_ID}~#root,body[data-dsh-background-active]>#${LAYER_ID}~#app{position:relative;z-index:1}
      body[data-dsh-background-active]>#${LAYER_ID}~#root,body[data-dsh-background-active]>#${LAYER_ID}~#app{background:transparent!important}
      body[data-dsh-background-active]>#${LAYER_ID}~#root>[class*="_frame"],body[data-dsh-background-active]>#${LAYER_ID}~#app>[class*="_frame"]{background:transparent!important}
      .dsh-background-row{box-sizing:border-box;color:var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l2);padding:18px 0 20px;display:flex;flex-direction:column;gap:14px}
      .dsh-background-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}
      .dsh-background-title{font-size:14px;font-weight:600;line-height:22px}
      .dsh-background-description{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;margin-top:3px}
      .dsh-background-toggle{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;border-radius:999px;display:inline-flex;align-items:center;gap:7px;padding:5px 9px 5px 6px;font-size:12px;white-space:nowrap;transition:background .16s,border-color .16s,color .16s}
      .dsh-background-toggle:hover{border-color:var(--dsw-alias-label-dimmed);color:var(--dsw-alias-label-primary)}
      .dsh-background-toggle[data-on=true]{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
      .dsh-background-toggle i{width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-label-tertiary);display:block;position:relative;transition:background .16s,transform .16s}
      .dsh-background-toggle i::after{content:"";position:absolute;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-bg-layer-2);left:6px;top:6px}
      .dsh-background-toggle[data-on=true] i{background:var(--dsw-alias-state-success-primary)}
      .dsh-background-toggle[data-on=true] i::after{background:var(--dsw-alias-bg-layer-2)}
      .dsh-background-preview{min-height:154px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;overflow:hidden;position:relative;isolation:isolate;background:var(--dsw-alias-bg-layer-1)}
      .dsh-background-preview-art,.dsh-background-preview-wash,.dsh-background-preview-grid{position:absolute;inset:0}
      .dsh-background-preview-art{background-position:center;background-size:cover;transition:background .25s,opacity .25s}
      .dsh-background-preview-wash{z-index:1;background:rgba(6,7,11,.54);transition:background .25s}
      .dsh-background-preview-grid{z-index:2;opacity:.28;background-image:linear-gradient(rgba(255,255,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.13) 1px,transparent 1px);background-size:24px 24px;mask-image:linear-gradient(135deg,#000,transparent 72%)}
      .dsh-background-preview-copy{position:absolute;z-index:3;left:16px;bottom:14px}
      .dsh-background-preview-kicker{color:var(--dsw-alias-brand-primary);font-size:10px;letter-spacing:.18em;line-height:16px}
      .dsh-background-preview-name{font-size:18px;font-weight:600;line-height:26px;letter-spacing:.06em;margin-top:3px}
      .dsh-background-preview-badge{position:absolute;z-index:3;top:12px;right:12px;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l2);border-radius:5px;padding:3px 7px;font-size:9px;letter-spacing:.12em}
      .dsh-background-section{display:flex;flex-direction:column;gap:8px}
      .dsh-background-section-label{display:flex;align-items:baseline;justify-content:space-between;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
      .dsh-background-section-label small{color:var(--dsw-alias-label-tertiary);font-size:10px;letter-spacing:.12em}
      .dsh-background-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .dsh-background-preset{appearance:none;position:relative;overflow:hidden;min-height:65px;text-align:left;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;padding:8px;transition:border-color .16s,transform .16s,box-shadow .16s}
      .dsh-background-preset::before{content:"";position:absolute;inset:0;background:var(--dsh-background-preset);transition:transform .3s}
      .dsh-background-preset::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 20%,rgba(0,0,0,.72))}
      .dsh-background-preset:hover{border-color:var(--dsw-alias-label-dimmed);transform:translateY(-1px)}
      .dsh-background-preset:hover::before{transform:scale(1.08)}
      .dsh-background-preset[data-selected=true]{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 25%,transparent)}
      .dsh-background-preset span{position:relative;z-index:1;font-size:12px;line-height:18px}
      .dsh-background-preset b{position:absolute;z-index:1;right:8px;top:7px;width:16px;height:16px;border-radius:50%;border:1px solid rgba(255,255,255,.52);font-size:10px;line-height:14px;text-align:center;color:transparent;font-weight:500}
      .dsh-background-preset[data-selected=true] b{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-3)}
      .dsh-background-upload{position:relative;display:flex;align-items:center;gap:11px;min-height:64px;border:1px dashed color-mix(in srgb,var(--dsw-alias-brand-primary) 58%,var(--dsw-alias-border-l2));border-radius:10px;padding:10px 12px;cursor:pointer;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 5%,transparent);transition:border-color .16s,background .16s}
      .dsh-background-upload:hover,.dsh-background-upload[data-dragging=true]{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,transparent)}
      .dsh-background-upload-icon{display:grid;place-items:center;width:30px;height:30px;border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 55%,transparent);border-radius:8px;color:var(--dsw-alias-brand-primary);font-size:16px}
      .dsh-background-upload-title{font-size:12px;line-height:18px}
      .dsh-background-upload-meta{display:block;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px;margin-top:1px}
      .dsh-background-upload input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}
      .dsh-background-controls{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}
      .dsh-background-control{display:grid;grid-template-columns:1fr 42px;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:17px}
      .dsh-background-control input[type=range]{grid-column:1/-1;width:100%;height:3px;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
      .dsh-background-control output{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;text-align:right}
      .dsh-background-select{grid-column:1/-1;width:100%;height:32px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:0 9px;outline:none}
      .dsh-background-select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:2px solid color-mix(in srgb,var(--dsw-alias-brand-primary) 18%,transparent)}
      .dsh-background-status{min-height:18px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;margin:0}
      .dsh-background-status[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
      .dsh-background-status[data-tone=success]{color:var(--dsw-alias-state-success-primary)}
      .dsh-background-actions{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--dsw-alias-border-l2);padding-top:12px}
      .dsh-background-action{appearance:none;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;padding:6px 12px;font-size:12px;line-height:18px;transition:border-color .16s,color .16s,background .16s}
      .dsh-background-action:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed);color:var(--dsw-alias-label-primary)}
      .dsh-background-action:disabled{opacity:.42;cursor:default}
      .dsh-background-action-primary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3);border-color:var(--dsw-alias-label-primary)}
      .dsh-background-action-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-layer-3)}
      .dsh-background-footnote{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:16px;margin:0}
      @media (max-width:680px){.dsh-background-controls{grid-template-columns:1fr}.dsh-background-head{gap:10px}.dsh-background-toggle{padding-right:7px}.dsh-background-title{font-size:13px}}
      @media (prefers-reduced-motion:reduce){#${LAYER_ID},.dsh-background-preset,.dsh-background-action{transition:none}}
    `;

    const zh = {
      title: "背景",
      description: "上传图片，打造属于你的 DSH 工作空间。",
      enabled: "已启用",
      disabled: "未启用",
      presets: "预设氛围",
      quickStart: "QUICK START",
      upload: "上传图片",
      localOnly: "LOCAL ONLY",
      uploadTitle: "拖入图片，或点击选择",
      uploadMeta: "JPG / PNG / WEBP · 最大 8 MB",
      replaceMeta: "已载入 · 点击可更换图片",
      tuning: "细节调校",
      imagePresence: "图像存在感",
      overlay: "暗色遮罩",
      blur: "柔焦",
      fit: "图片适配",
      cover: "铺满屏幕",
      contain: "完整显示",
      stretch: "拉伸铺满",
      position: "焦点位置",
      center: "居中",
      top: "顶部",
      bottom: "底部",
      left: "左侧",
      right: "右侧",
      save: "保存背景",
      discard: "放弃修改",
      reset: "恢复默认",
      ready: "选择预设，或上传你的图片。",
      changed: "实时预览已更新，点击保存后下次自动恢复。",
      saved: "已保存。下次打开 DSH 时会自动恢复。",
      resetDone: "已恢复默认背景。",
      processing: "正在优化图片…",
      uploaded: "图片已载入，调整参数后保存即可。",
      uploadError: "图片处理失败，请重试。",
      invalidType: "请选择 JPG、PNG、WEBP 或 GIF 图片。",
      tooLarge: "图片超过 8 MB，请先压缩后再上传。",
      storageError: "保存失败：DSH 设置空间不足，请换一张更小的图片。",
      footnote: "图片会在浏览器本地压缩后写入 DSH 设置，不会上传到服务器。"
    };
    const en = {
      title: "Background",
      description: "Upload an image and make your DSH workspace yours.",
      enabled: "Enabled",
      disabled: "Disabled",
      presets: "Presets",
      quickStart: "QUICK START",
      upload: "Upload image",
      localOnly: "LOCAL ONLY",
      uploadTitle: "Drop an image or click to choose",
      uploadMeta: "JPG / PNG / WEBP · 8 MB max",
      replaceMeta: "Loaded · click to replace",
      tuning: "Fine tuning",
      imagePresence: "Image presence",
      overlay: "Dark overlay",
      blur: "Soft focus",
      fit: "Image fit",
      cover: "Fill screen",
      contain: "Show full image",
      stretch: "Stretch to fill",
      position: "Focal position",
      center: "Center",
      top: "Top",
      bottom: "Bottom",
      left: "Left",
      right: "Right",
      save: "Save background",
      discard: "Discard",
      reset: "Restore default",
      ready: "Choose a preset or upload your image.",
      changed: "Preview updated. Save to restore it next time.",
      saved: "Saved. DSH will restore it next time.",
      resetDone: "Default background restored.",
      processing: "Optimizing image…",
      uploaded: "Image loaded. Tune it, then save.",
      uploadError: "Could not process the image. Try again.",
      invalidType: "Choose a JPG, PNG, WEBP, or GIF image.",
      tooLarge: "Image is over 8 MB. Compress it and try again.",
      storageError: "Could not save: DSH settings are full. Try a smaller image.",
      footnote: "The image is compressed locally and written to DSH settings. Nothing is uploaded."
    };

    function installStyle() {
      if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.dataset.plugin = "dsh-background-plugin";
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    function layerElement() {
      if (typeof document === "undefined" || !document.body) return null;
      let layer = document.getElementById(LAYER_ID);
      if (!layer) {
        layer = document.createElement("div");
        layer.id = LAYER_ID;
        layer.dataset.active = "false";
        layer.setAttribute("aria-hidden", "true");
        document.body.prepend(layer);
      }
      return layer;
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function valueOf(raw) {
      const value = { ...DEFAULTS, ...(raw && typeof raw === "object" ? raw : {}) };
      value.enabled = value.enabled === true;
      value.preset = Object.prototype.hasOwnProperty.call(PRESETS, value.preset) ? value.preset : DEFAULTS.preset;
      value.image = typeof value.image === "string" && value.image.startsWith("data:image/") ? value.image : "";
      value.fileName = typeof value.fileName === "string" ? value.fileName.slice(0, 80) : "";
      value.opacity = clamp(Number(value.opacity) || DEFAULTS.opacity, .12, .82);
      value.overlay = clamp(Number(value.overlay) || DEFAULTS.overlay, .12, .82);
      value.blur = clamp(Number(value.blur) || 0, 0, 12);
      value.fit = ["cover", "contain", "100% 100%"].includes(value.fit) ? value.fit : DEFAULTS.fit;
      value.position = ["center", "center top", "center bottom", "left center", "right center"].includes(value.position) ? value.position : DEFAULTS.position;
      return value;
    }

    function artFor(value) {
      return value.image ? `url("${value.image}")` : PRESETS[value.preset].css;
    }

    function applyBackground(raw) {
      const value = valueOf(raw);
      if (typeof document === "undefined") return;
      if (!document.body) {
        if (!pendingDomReadyApply) {
          pendingDomReadyApply = true;
          document.addEventListener("DOMContentLoaded", () => {
            pendingDomReadyApply = false;
            applyBackground(value);
          }, { once: true });
        }
        return;
      }
      const layer = layerElement();
      if (!layer) return;
      const active = value.enabled && Boolean(value.image || value.preset);
      layer.style.backgroundImage = artFor(value);
      layer.style.backgroundRepeat = "no-repeat";
      layer.style.backgroundSize = value.fit;
      layer.style.backgroundPosition = value.position;
      layer.style.setProperty("--dsh-background-opacity", String(value.opacity));
      layer.style.setProperty("--dsh-background-overlay", String(value.overlay));
      layer.style.filter = `blur(${value.blur}px)`;
      layer.dataset.active = String(active);
      if (active) document.body.setAttribute("data-dsh-background-active", "true");
      else document.body.removeAttribute("data-dsh-background-active");
    }

    function readFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
    }

    function loadImage(src) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("decode"));
        image.src = src;
      });
    }

    async function optimizeImage(file) {
      if (!file || !file.type.startsWith("image/")) throw new Error("type");
      if (file.size > MAX_FILE_SIZE) throw new Error("size");
      const source = await readFile(file);
      const image = await loadImage(source);
      const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return source;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL("image/webp", .82);
      return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", .8);
    }

    function useScope(scope) {
      const subscribe = React.useCallback((listener) => scope.subscribe(listener), [scope]);
      const getSnapshot = React.useCallback(() => scope.getSnapshot(), [scope]);
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    }

    function controlRange(label, value, min, max, step, onChange, suffix = "%") {
      const output = suffix === "%" ? `${Math.round(value * 100)}%` : `${value}${suffix}`;
      return h("label", { className: "dsh-background-control", key: label },
        h("span", null, label),
        h("output", null, output),
        h("input", { type: "range", min, max, step, value, onChange: (event) => onChange(Number(event.currentTarget.value)), "aria-label": label })
      );
    }

    function BackgroundRow({ t, scope, runtime }) {
      const snapshot = useScope(scope);
      const effective = valueOf(snapshot.value);
      const [draft, setDraft] = React.useState(effective);
      const [dirty, setDirty] = React.useState(false);
      const [busy, setBusy] = React.useState(false);
      const [message, setMessage] = React.useState(t("ready"));
      const [tone, setTone] = React.useState("");

      React.useEffect(() => {
        if (!dirty) setDraft(effective);
      }, [snapshot.revision, dirty]);
      React.useEffect(() => {
        runtime.preview(draft);
      }, [draft, runtime]);

      const edit = (field, value) => {
        setDraft((previous) => ({ ...previous, [field]: value }));
        setDirty(true);
        setTone("");
        setMessage(t("changed"));
      };
      const selectPreset = (preset) => {
        const next = {
          ...draft,
          enabled: true,
          preset,
          image: "",
          fileName: ""
        };
        setDraft(next);
        runtime.preview(next);
        setDirty(true);
        setTone("");
        setMessage(t("changed"));
      };
      const save = async () => {
        if (busy || !dirty || snapshot.writable === false) return;
        setBusy(true);
        setTone("");
        try {
          const ordered = [...FIELDS].sort((a, b) => a === "enabled" ? 1 : b === "enabled" ? -1 : 0);
          for (const field of ordered) {
            const live = valueOf(scope.getSnapshot().value);
            if (draft[field] === live[field]) continue;
            await scope.set(field, draft[field]);
          }
          setDirty(false);
          setMessage(t("saved"));
          setTone("success");
          runtime.preview(draft);
        } catch {
          setMessage(t("storageError"));
          setTone("error");
        } finally {
          setBusy(false);
        }
      };
      const discard = () => {
        setDraft(effective);
        setDirty(false);
        setTone("");
        setMessage(t("ready"));
      };
      const reset = async () => {
        if (busy || snapshot.writable === false) return;
        setBusy(true);
        setTone("");
        try {
          for (const field of FIELDS) await scope.unset(field);
          setDraft({ ...DEFAULTS });
          setDirty(false);
          setMessage(t("resetDone"));
          setTone("success");
          runtime.preview(DEFAULTS);
        } catch {
          setMessage(t("storageError"));
          setTone("error");
        } finally {
          setBusy(false);
        }
      };
      const upload = async (file) => {
        if (!file || busy) return;
        setBusy(true);
        setTone("");
        setMessage(t("processing"));
        try {
          const image = await optimizeImage(file);
          const fileName = file.name;
          setDraft((previous) => ({ ...previous, enabled: true, image, fileName, preset: "aurora" }));
          setDirty(true);
          runtime.preview({ ...draft, enabled: true, image, fileName, preset: "aurora" });
          for (const field of ["enabled", "image", "fileName", "preset"]) {
            await scope.set(field, field === "image" ? image : field === "fileName" ? fileName : field === "enabled" ? true : "aurora");
          }
          setMessage(t("uploaded"));
          setTone("success");
        } catch (error) {
          setMessage(error.message === "size" ? t("tooLarge") : error.message === "type" ? t("invalidType") : t("uploadError"));
          setTone("error");
        } finally {
          setBusy(false);
        }
      };
      const active = draft.enabled;
      const previewStyle = {
        backgroundImage: artFor(draft),
        backgroundSize: draft.fit,
        backgroundPosition: draft.position,
        opacity: active ? 1 : .42
      };
      const uploadTitle = draft.image && draft.fileName ? draft.fileName : t("uploadTitle");
      const uploadMeta = draft.image && draft.fileName ? t("replaceMeta") : t("uploadMeta");

      return h("div", { className: "dsh-background-row" },
        h("div", { className: "dsh-background-head" },
          h("div", null,
            h("div", { className: "dsh-background-title" }, t("title")),
            h("div", { className: "dsh-background-description" }, t("description"))
          ),
          h("button", { className: "dsh-background-toggle", type: "button", "data-on": active, "aria-pressed": active, onClick: () => edit("enabled", !active) },
            h("i", null), active ? t("enabled") : t("disabled")
          )
        ),
        h("div", { className: "dsh-background-preview" },
          h("div", { className: "dsh-background-preview-art", style: previewStyle }),
          h("div", { className: "dsh-background-preview-wash", style: { background: `rgba(6,7,11,${draft.overlay})` } }),
          h("div", { className: "dsh-background-preview-grid" }),
          h("div", { className: "dsh-background-preview-copy" },
            h("div", { className: "dsh-background-preview-kicker" }, "PERSONAL SPACE / 2025"),
            h("div", { className: "dsh-background-preview-name" }, "你的背景，正在发生")
          ),
          h("span", { className: "dsh-background-preview-badge" }, "LIVE PREVIEW")
        ),
        h("div", { className: "dsh-background-section" },
          h("div", { className: "dsh-background-section-label" }, h("span", null, t("presets")), h("small", null, t("quickStart"))),
          h("div", { className: "dsh-background-presets" }, Object.entries(PRESETS).map(([id, preset]) => h("button", {
            className: "dsh-background-preset",
            key: id,
            type: "button",
            "data-selected": active && !draft.image && draft.preset === id,
            style: { "--dsh-background-preset": preset.css },
            onClick: () => selectPreset(id)
          }, h("span", null, preset.label), h("b", null, "✓"))))
        ),
        h("div", { className: "dsh-background-section" },
          h("div", { className: "dsh-background-section-label" }, h("span", null, t("upload")), h("small", null, t("localOnly"))),
          h("label", { className: "dsh-background-upload" },
            h("span", { className: "dsh-background-upload-icon" }, "↥"),
            h("span", null, h("span", { className: "dsh-background-upload-title" }, uploadTitle), h("span", { className: "dsh-background-upload-meta" }, uploadMeta)),
            h("input", { type: "file", accept: "image/jpeg,image/png,image/webp,image/gif", onChange: (event) => upload(event.currentTarget.files?.[0]), "aria-label": t("upload") })
          )
        ),
        h("div", { className: "dsh-background-section" },
          h("div", { className: "dsh-background-section-label" }, h("span", null, t("tuning")), h("small", null, "TUNING")),
          h("div", { className: "dsh-background-controls" },
            controlRange(t("imagePresence"), draft.opacity, .12, .82, .01, (value) => edit("opacity", value)),
            controlRange(t("overlay"), draft.overlay, .12, .82, .01, (value) => edit("overlay", value)),
            controlRange(t("blur"), draft.blur, 0, 12, 1, (value) => edit("blur", value), "px"),
            h("label", { className: "dsh-background-control", key: "fit" }, h("span", null, t("fit")), h("span", null), h("select", { className: "dsh-background-select", value: draft.fit, onChange: (event) => edit("fit", event.currentTarget.value) }, h("option", { value: "cover" }, t("cover")), h("option", { value: "contain" }, t("contain")), h("option", { value: "100% 100%" }, t("stretch")))),
            h("label", { className: "dsh-background-control", key: "position" }, h("span", null, t("position")), h("span", null), h("select", { className: "dsh-background-select", value: draft.position, onChange: (event) => edit("position", event.currentTarget.value) }, h("option", { value: "center" }, t("center")), h("option", { value: "center top" }, t("top")), h("option", { value: "center bottom" }, t("bottom")), h("option", { value: "left center" }, t("left")), h("option", { value: "right center" }, t("right"))))
          )
        ),
        h("p", { className: "dsh-background-status", "data-tone": tone, role: "status", "aria-live": "polite" }, message),
        h("div", { className: "dsh-background-actions" },
          h("button", { className: "dsh-background-action", type: "button", disabled: busy || !dirty, onClick: discard }, t("discard")),
          h("button", { className: "dsh-background-action", type: "button", disabled: busy, onClick: reset }, t("reset")),
          h("button", { className: "dsh-background-action dsh-background-action-primary", type: "button", disabled: busy || !dirty || snapshot.writable === false, onClick: save }, busy ? "…" : t("save"))
        ),
        h("p", { className: "dsh-background-footnote" }, t("footnote"))
      );
    }

    const inject = ["slots", "locale", "connection", "remote", "settingsScope"];

    function apply(ctx) {
      installStyle();
      const scope = ctx.settingsScope.bind({ namespace: NAMESPACE });
      const runtime = { preview: applyBackground };
      ctx.effect(() => {
        const update = () => applyBackground(scope.getSnapshot().value);
        update();
        return scope.subscribe(update);
      }, "dsh-background: apply persisted background");
      ctx.effect(() => ctx.locale.register(SETTINGS_NS, { zh, en }), "dsh-background: dictionaries");
      ctx.slots.inject("settings.general.item", () => ctx.slots.register({
        name: "settings.general.item",
        id: "background",
        order: 20,
        locale: SETTINGS_NS,
        inject: () => ({ scope, runtime })
      }, BackgroundRow));
      ctx.effect(() => () => {
        document.body?.removeAttribute("data-dsh-background-active");
        document.getElementById(LAYER_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
      }, "dsh-background: cleanup");
    }

    exports.NAMESPACE = NAMESPACE;
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
