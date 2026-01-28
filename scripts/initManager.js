import {RBAchangeLevel} from "./behaviours/changeLevel.js";

Hooks.once("init", () => {
	RBAchangeLevel.onInit();
});