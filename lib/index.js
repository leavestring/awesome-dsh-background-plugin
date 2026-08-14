import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

const NAMESPACE = "ui-background";
const BACKGROUND_NAMESPACE = settingsNamespace(NAMESPACE);
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

const BackgroundSettingsSchema = z.object({
  enabled: z.boolean().default(DEFAULTS.enabled),
  preset: z.union(["aurora", "ember", "paper"]).default(DEFAULTS.preset),
  image: z.string().default(DEFAULTS.image),
  fileName: z.string().default(DEFAULTS.fileName),
  opacity: z.number().min(0.12).max(0.82).step(0.01).default(DEFAULTS.opacity),
  overlay: z.number().min(0.12).max(0.82).step(0.01).default(DEFAULTS.overlay),
  blur: z.number().min(0).max(12).step(1).default(DEFAULTS.blur),
  fit: z.union(["cover", "contain", "100% 100%"]).default(DEFAULTS.fit),
  position: z.union(["center", "center top", "center bottom", "left center", "right center"]).default(DEFAULTS.position)
});

function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(BACKGROUND_NAMESPACE, BackgroundSettingsSchema);
  });
}

export {
  NAMESPACE,
  DEFAULTS,
  BackgroundSettingsSchema,
  apply
};
