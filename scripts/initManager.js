import {readyCanvasClick} from "./helpers/canvasClick.js";
import {initCustoms} from "./behaviours/RBAcustoms.js";

import {RBAping} from "./adjustments/ping.js";
import {RBAchangeLevel} from "./adjustments/changeLevel.js";
import {RBAstopMovement} from "./adjustments/stopMovement.js";
import {RBAchangeMovement} from "./adjustments/changeMovement.js";
import {RBAchangeVisibility} from "./adjustments/changeVisibility.js";
import {RBAchangeCombatant} from "./adjustments/changeCombatant.js";
import {RBArollTable} from "./adjustments/rollTable.js";
import {RBAconditionalTrigger} from "./adjustments/conditionalTrigger.js";

Hooks.once("init", () => {
	initCustoms();
	
	for (let vRBA of [RBAping, RBAchangeLevel, RBAstopMovement, RBAchangeMovement, RBAchangeVisibility, RBAchangeCombatant, RBArollTable, RBAconditionalTrigger]) {
		try {
			vRBA.onInit();
		} 
		catch (pError) {
			console.error(`Error while initialising ${vRBA.name}`);
			console.error(pError);
		}
	}
});

Hooks.once("ready", function() {
	readyCanvasClick();
});