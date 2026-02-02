import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeVisibility extends regionbaBasic {
	static type = cModuleName + ".changeVisibility";
	
	static Settings = {
		visibilityDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return ["Tile", "Token"].includes(pPlaceable.documentName) || utils.isDoor(pPlaceable)}
		},
		playerTokensTriggeronly : {
			default : () => {return true},
			configDialog : true
		},	
		visibilityChange : {
			default : () => {return "show"},
			configDialog : true,
			options : () => {return ["toggle", "show", "hide"]}
		},
		addTokensonRegion : {
			default : () => {return false},
			configDialog : true
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
			let vDocuments = this.regionba.visibilityDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			if (this.regionba.addTokensonRegion) {
				vDocuments = vDocuments.concat([...this.region.tokens]);
			}
			
			return [...new Set(vDocuments)];
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
			
			if (!this.lockTemporary) {
				this.lockTemporary = true;
				
				for (const cDocument of this.validDocuments()) {
					switch (this.regionba.visibilityChange) {
						case "toggle" :
							if (utils.isDoor(cDocument)) utils.setDoorHidden(cDocument, !utils.doorHidden(cDocument)); 
							else cDocument.update({hidden : !cDocument.hidden});
							break;
						case "show" :
							if (utils.isDoor(cDocument)) utils.setDoorHidden(cDocument, false); 
							else if (cDocument.hidden) cDocument.update({hidden : false});
							break;
						case "hide" :
							if (utils.isDoor(cDocument)) utils.setDoorHidden(cDocument, true); 
							else if (!cDocument.hidden) cDocument.update({hidden : true});
							break;
					}
				}
				
				this.lockTemporary = false;
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}