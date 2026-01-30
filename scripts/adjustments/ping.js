import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeLevel extends regionbaBasic {
	static type = "changeLevel";
	
	static Settings = {
		autoSkipConfirmDialogue : {
			default : () => {return false},
			configDialog : true
		},
		continueMovement : {
			default : () => {return false},
			configDialog : true
		},
		targetLevelChoice : {
			default : () => {return "default"},
			configDialog : true,
			options : () => {return ["default", "upElevation", "downElevation", "neighbourElevation", "levelChoice"]}
		},
		chosenLevels : {
			default : () => {return []},
			configDialog : true,
			isLevelSelect : true,
			showinDialog : (pFlags) => {return pFlags.targetLevelChoice.includes("levelChoice")},
			scChangeAll : true
		},
		movementTypeExclusion : {
			default : () => {return []},
			configDialog : true,
			isMultiSelect : true,
			options : () => {return Object.keys(CONFIG.Token.movement.actions).map(vKey => {return {id : vKey, name : CONFIG.Token.movement.actions[vKey].label}}).filter(vItem => vItem.id != "displace")},
			scChangeAll : true
		}
	}

	static Support() {
		return {
			upNeighbourLevels : (region, token) => {
				let vTokenLevel = region.parent.levels.get(token.level);
				let vAvailableLevels = region.parent.levels.filter(l => l.id !== token.level);
				let vValidLevels = [];
				
				let vBottom = vTokenLevel.elevation.bottom;
				for (let vCheckLevel of vAvailableLevels) {
					if (vCheckLevel.elevation.bottom > vBottom) {
						if (vValidLevels.length) {
							if (vCheckLevel.elevation.bottom == vValidLevels[0].elevation.bottom) {
								vValidLevels.push(vCheckLevel);
							}
							if (vCheckLevel.elevation.bottom < vValidLevels[0].elevation.bottom) {
								vValidLevels = [vCheckLevel]
							}
						}
						else {
							vValidLevels.push(vCheckLevel);
						}
					}
				}
				
				return vValidLevels;
			},
			downNeighbourLevels : (region, token) => {
				let vTokenLevel = region.parent.levels.get(token.level);
				let vAvailableLevels = region.parent.levels.filter(l => l.id !== token.level);
				let vValidLevels = [];
				
				let vBottom = vTokenLevel.elevation.bottom;
				for (let vCheckLevel of vAvailableLevels) {
					if (vCheckLevel.elevation.bottom < vBottom) {
						if (vValidLevels.length) {
							if (vCheckLevel.elevation.bottom == vValidLevels[0].elevation.bottom) {
								vValidLevels.push(vCheckLevel);
							}
							if (vCheckLevel.elevation.bottom > vValidLevels[0].elevation.bottom) {
								vValidLevels = [vCheckLevel]
							}
						}
						else {
							vValidLevels.push(vCheckLevel);
						}
					}
				}
				
				return vValidLevels;
			}
		}
	}
	
	static overrideMethods() {
		const PingRegionBehaviorType = CONFIG.RegionBehavior.dataModels.changeLevel.prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		PingRegionBehaviorType.RBAonTokenMoveIn = async function(event) {
			const user = event.user;
			
		}
		
		CONFIG.RegionBehavior.dataModels.ping.events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = PingRegionBehaviorType.RBAonTokenMoveIn;
	}
}