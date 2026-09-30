import z from "@deepseek-ai/schemastery";

const NAMESPACE = "ui-background";
const DEFAULTS = {
  enabled: false,
  preset: "aurora",
  image: "",
  fileName: "",
  opacity: 0.46,
  overlay: 0.54,
  blur: 0,
  fit: "cover",
  position: "center"
};

/**
 * Background preferences.
 *
 * DSH 0.2.x serves one settings namespace per profile entry, so the hosting
 * entry's id (`ui-background`) is the namespace key and this exported `Config`
 * is the schema the settings document reads and writes. Every field is
 * `volatile()` so the browser can edit it live without remounting the plugin.
 */
const BackgroundSettingsSchema = z.object({
  enabled: z.boolean().default(DEFAULTS.enabled).volatile(),
  preset: z.union(["aurora", "ember", "paper"]).default(DEFAULTS.preset).volatile(),
  image: z.string().default(DEFAULTS.image).volatile(),
  fileName: z.string().default(DEFAULTS.fileName).volatile(),
  opacity: z.number().min(0.12).max(0.82).step(0.01).default(DEFAULTS.opacity).volatile(),
  overlay: z.number().min(0.12).max(0.82).step(0.01).default(DEFAULTS.overlay).volatile(),
  blur: z.number().min(0).max(12).step(1).default(DEFAULTS.blur).volatile(),
  fit: z.union(["cover", "contain", "100% 100%"]).default(DEFAULTS.fit).volatile(),
  position: z.union(["center", "center top", "center bottom", "left center", "right center"]).default(DEFAULTS.position).volatile()
});

/** The Loader reads this exported schema as the entry's settings Config. */
const Config = BackgroundSettingsSchema;

/**
 * Host plugin body. The background row owns its own surface in
 * Settings -> General, so the automatic settings page stays off.
 * @param ctx - host plugin context.
 */
function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber));
  });
}

export {
  NAMESPACE,
  DEFAULTS,
  Config,
  BackgroundSettingsSchema,
  apply
};
