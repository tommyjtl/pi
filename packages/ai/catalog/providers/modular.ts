import type { OpenAICompletionsCompat, ThinkingLevelMap } from "../../src/types.ts";
import { defineProvider, modelsDevModels } from "../define.ts";

const BASE_COMPAT: OpenAICompletionsCompat = {
	supportsStore: false,
	supportsDeveloperRole: false,
	maxTokensField: "max_tokens",
	supportsLongCacheRetention: false,
};
// Effort models take a nested reasoning.effort and reject values they don't list.
const EFFORT_COMPAT: OpenAICompletionsCompat = {
	...BASE_COMPAT,
	thinkingFormat: "openrouter",
	supportsReasoningEffort: true,
};
// Toggle models take reasoning.enabled and ignore reasoning.effort.
const TOGGLE_COMPAT: OpenAICompletionsCompat = {
	...BASE_COMPAT,
	thinkingFormat: "together",
	supportsReasoningEffort: false,
};

// The DeepSeek family rule sets DeepSeek V4's format (thinking.type plus a
// top-level reasoning_effort), which Modular's API accepts.
const DEEPSEEK_COMPAT: OpenAICompletionsCompat = { ...BASE_COMPAT, supportsReasoningEffort: true };

// Levels each model honours on Modular's API. MiniMax M3.1 Flash always
// reasons, so it has no off level.
const EFFORT_MODELS: Record<string, { compat: OpenAICompletionsCompat; levels: ThinkingLevelMap }> = {
	"MiniMaxAI/MiniMax-M3.1-Flash": {
		compat: EFFORT_COMPAT,
		levels: { off: null, minimal: null, low: "low", medium: "medium", high: "high", xhigh: "xhigh", max: "max" },
	},
	"deepseek/deepseek-v4.1-flash": {
		compat: DEEPSEEK_COMPAT,
		levels: { off: "none", minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: "max" },
	},
};
const TOGGLE_LEVELS: ThinkingLevelMap = {
	off: "off",
	minimal: null,
	low: null,
	medium: null,
	high: "high",
	xhigh: null,
	max: null,
};

export default defineProvider({
	id: "modular",
	models: (ctx) =>
		modelsDevModels(ctx, "modular", {
			api: "openai-completions",
			baseUrl: "https://api.modular.com/v1",
			skipDeprecated: true,
			map: (model) => {
				if (!model.reasoning) return { ...model, compat: BASE_COMPAT };
				const effort = EFFORT_MODELS[model.id];
				if (effort) return { ...model, compat: effort.compat, thinkingLevelMap: { ...effort.levels } };
				return { ...model, compat: TOGGLE_COMPAT, thinkingLevelMap: { ...TOGGLE_LEVELS } };
			},
		}),
	compat: {
		"openai-completions": {
			supportsStore: false,
			supportsDeveloperRole: false,
			maxTokensField: "max_tokens",
			supportsLongCacheRetention: false,
		},
	},
});
