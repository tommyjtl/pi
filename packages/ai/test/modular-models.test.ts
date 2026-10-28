import { afterEach, describe, expect, it } from "vitest";
import { getModel } from "../src/compat.ts";
import { findEnvKeys, getEnvApiKey } from "../src/env-api-keys.ts";

const originalModularApiKey = process.env.MODULAR_API_KEY;

afterEach(() => {
	if (originalModularApiKey === undefined) {
		delete process.env.MODULAR_API_KEY;
	} else {
		process.env.MODULAR_API_KEY = originalModularApiKey;
	}
});

describe("Modular models", () => {
	it("registers the default MiniMax M3.1 Flash model via OpenAI-compatible Chat Completions API", () => {
		const model = getModel("modular", "MiniMaxAI/MiniMax-M3.1-Flash");

		expect(model).toBeDefined();
		expect(model.api).toBe("openai-completions");
		expect(model.provider).toBe("modular");
		expect(model.baseUrl).toBe("https://api.modular.com/v1");
		expect(model.reasoning).toBe(true);
		expect(model.input).toEqual(["text", "image"]);
		expect(model.contextWindow).toBe(1048576);
	});

	it("models each reasoning control Modular's API honours", () => {
		const flash = getModel("modular", "MiniMaxAI/MiniMax-M3.1-Flash");
		expect(flash.compat).toMatchObject({ thinkingFormat: "openrouter", supportsReasoningEffort: true });
		expect(flash.thinkingLevelMap).toMatchObject({ off: null, low: "low", max: "max" });

		const deepseek = getModel("modular", "deepseek/deepseek-v4.1-flash");
		expect(deepseek.compat).toMatchObject({
			thinkingFormat: "deepseek",
			supportsReasoningEffort: true,
			requiresReasoningContentOnAssistantMessages: true,
		});
		expect(deepseek.thinkingLevelMap).toMatchObject({
			off: "none",
			low: "low",
			medium: null,
			high: "high",
			max: "max",
		});

		for (const id of ["minimax/minimax-m3", "google/gemma-4-31b-it"] as const) {
			const model = getModel("modular", id);
			expect(model.compat).toMatchObject({ thinkingFormat: "together", supportsReasoningEffort: false });
			expect(model.thinkingLevelMap).toMatchObject({ off: "off", low: null, high: "high" });
		}
	});

	it("resolves MODULAR_API_KEY", () => {
		process.env.MODULAR_API_KEY = "test-modular-key";

		expect(getEnvApiKey("modular")).toBe("test-modular-key");
		expect(findEnvKeys("modular")).toEqual(["MODULAR_API_KEY"]);
	});
});
