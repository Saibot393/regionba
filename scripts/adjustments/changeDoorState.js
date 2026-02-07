import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeDoorState extends regionbaBasic {
	static type = cModuleName + ".changeDoorState";
	
	static Settings = {
		changeDoorDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return utils.isDoor(pPlaceable)}
		},
		playerTokensTriggeronly : {
			default : () => {return true},
			configDialog : true
		},	
		changeDoorType : {
			default : () => {return "unlock"},
			configDialog : true,
			options : () => {return ["lock", "unlock", "open", "togglelock", "toggleopen"]}
		},
		once : {
			default : () => {return false},
			configDialog : true
		}
	}
	
	static Support() {
		return {
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		cBehaviorType.validDocuments = function() {
			let vDocuments = this.regionba.changeDoorDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviorType.targetState = function(pDoor) {
			switch (this.regionba.changeDoorType) {
				case "lock":
					return 2;
					break;
				case "unlock":
					return 0;
					break;
				case "open":
					return 1;
					break;
				case "togglelock":
					return pDoor?.ds == 2 ? 0 : 2;
					break;
				case "toggleopen":
					return pDoor?.ds == 1 ? 0 : 1;
					break;
			}
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.playerTokensTriggeronly) {
				if (!utils.isPlayerToken(cToken)) return;
			}
			
			if (this.regionba.once) {
				this.parent.update({
					disabled: true
				});
			}
			
			const cDoors = this.validDocuments();
			
			
			for (const cDoor of cDoors) {
				console.log(cDoor);
				const cTargetds = this.targetState(cDoor);
				console.log(cTargetds);
				if (cDoor && [0,1,2].includes(cTargetds)) {
					await cDoor.update({ds : cTargetds})
				}
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}