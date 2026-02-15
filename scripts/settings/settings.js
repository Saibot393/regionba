import {cModuleName, utils, Translate} from "../utils/utils.js";

import {RBAchangeLevel} from "../adjustments/changeLevel.js";
import {RBAteleportToken} from "../adjustments/teleportToken.js";

import {RBAping} from "../adjustments/ping.js";
import {RBAstopMovement} from "../adjustments/stopMovement.js";
import {RBAchangeMovement} from "../adjustments/changeMovement.js";
import {RBAchangeVisibility} from "../adjustments/changeVisibility.js";
import {RBAchangeCombatant} from "../adjustments/changeCombatant.js";
import {RBArollTable} from "../adjustments/rollTable.js";
import {RBAconditionalTrigger} from "../adjustments/conditionalTrigger.js";
import {RBAchangeItem} from "../adjustments/changeItem.js";
import {RBAdelayTrigger} from "../adjustments/delayTrigger.js";
import {RBAchangeWall} from "../adjustments/changeWall.js";
import {RBAchangeDoorState} from "../adjustments/changeDoorState.js";
import {RBAmoveToken} from "../adjustments/moveToken.js";

const cCoreAdjustments = [RBAchangeLevel, RBAteleportToken];
const cCustomAdjustments = [RBAping, RBAstopMovement, RBAchangeMovement, RBAchangeVisibility, RBAchangeCombatant, RBArollTable, RBAconditionalTrigger, RBAchangeItem, RBAdelayTrigger, RBAchangeWall, RBAchangeDoorState, RBAmoveToken];

export function registerSettings() {
	for (const cAdjustment of cCoreAdjustments) {
		game.settings.register(cModuleName, `${cAdjustment.name}_active`, {
			name: `${cModuleName}.Settings.${cAdjustment.name}.active.name`,
			hint: `${cModuleName}.Settings.${cAdjustment.name}.active.hint`,
			scope: "world",       
			config: cAdjustment.canInit(),        
			requiresReload: true,
			type: Boolean,
			default: true	
		})
	}
	
	for (const cAdjustment of cCoreAdjustments.concat(cCustomAdjustments)) {
		const cSettings = cAdjustment.Settings;
		const cValidTypes = ["boolean"];
		const cIsCustom = cCustomAdjustments.includes(cAdjustment);
		
		for (const cKey of Object.keys(cSettings)) {
			if (cSettings[cKey].worldDefault && cSettings[cKey].worldDefault() && cValidTypes.includes(typeof cSettings[cKey].default())) {
				game.settings.register(cModuleName, `${cAdjustment.name}_${cKey}_default`, {
					name: `${cModuleName}.Settings.${cAdjustment.name}.${cKey}_default.name`,
					hint: `${cModuleName}.Settings.${cAdjustment.name}.${cKey}_default.hint`,
					scope: "world",       
					config: cAdjustment.canInit() && (cIsCustom || game.settings.get(cModuleName, `${cAdjustment.name}_active`)),        
					requiresReload: false,
					type: Boolean,
					default: cSettings[cKey].default()	
				})
			}
		}
	}
}

function activeCoreAdjustments() {
	return cCoreAdjustments.filter(vAdjustment => game.settings.get(cModuleName, `${vAdjustment.name}_active`));
}

export function activeAdjustments() {
	return activeCoreAdjustments().concat(cCustomAdjustments);
}