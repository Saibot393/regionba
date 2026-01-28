import {RBAchangeLevel} from ".behaviours/changeLevel.js";

const cBehaviours = [RBAchangeLevel];

Hooks.once("init", () => {
	for (const cBehaviour of cBehaviours) {
		cBehaviours.onInit();
	}
});