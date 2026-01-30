import {readyCanvasClick} from "./helpers/canvasClick.js";
import {initCustoms} from "./behaviours/RBAcustoms.js";

import {RBAchangeLevel} from "./adjustments/changeLevel.js";
import {RBAstopMovement} from "./adjustments/stopMovement.js";
import {RBAchangeMovement} from "./adjustments/changeMovement.js";
import {RBAchangeVisibility} from "./adjustments/changeVisibility.js";

Hooks.once("init", () => {
	initCustoms();
	
	for (let vRBA of [RBAchangeLevel, RBAstopMovement, RBAchangeMovement, RBAchangeVisibility]) {
		try {
			vRBA.onInit();
		} 
		catch (pError) {
		}
	}
	RBAchangeLevel.onInit();
	RBAstopMovement.onInit();
});

Hooks.once("ready", function() {
	readyCanvasClick();
});