import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeCombatant extends regionbaBasic {
	static type = cModuleName + ".changeCombatant";
	
	static Settings = {
		combatantDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return ["Token"].includes(pPlaceable.documentName)}
		},
		addTokensonRegion : {
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
			let vDocuments = this.regionba.combatantDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			if (this.regionba.addTokensonRegion) {
				vDocuments = vDocuments.concat([...this.region.tokens]);
			}
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviorType.RBAonTokenMovementIn = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cDocuments = this.validDocuments();
			for (const cDocument of cDocuments) {
				cDocument.toggleCombatant();
			}
		}
		
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}