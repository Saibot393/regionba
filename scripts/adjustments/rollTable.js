import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBArollTable extends regionbaBasic {
	static type = cModuleName + ".rollTable";
	
	static Settings = {
		rollTable : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["RollTable"].includes(pPlaceable.documentName)}
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
			const cDocuments = this.regionba.rollTable.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(cDocuments)];
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			for (const cDocument of this.validDocuments()) {
				console.log(cDocument);
				cDocument.draw();
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}