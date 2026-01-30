import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeVisibility extends regionbaBasic {
	static type = cModuleName + ".changeVisibility";
	
	static Settings = {
		visibilityDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return ["Tile", "Token"].includes(pPlaceable.documentName)}
		},
		visibilityChange : {
			default : () => {return "toggle"},
			configDialog : true,
			options : () => {return ["toggle", "show", "hide"]}
		}
	}
	
	static Support() {
		return {
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		cBehaviorType.RBAonTokenMovementIn = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cDocuments = this.regionba.visibilityDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			for (const cDocument of cDocuments) {
				switch (visibilityChange) {
					case "toggle" :
						await cDocument.update({hidden : !cDocument.hidden});
						break;
					case "show" :
						if (cDocument.hidden) await cDocument.update({hidden : false});
						break;
					case "hide" :
						if (!cDocument.hidden) await cDocument.update({hidden : true});
						break;
			}
		}
		
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}