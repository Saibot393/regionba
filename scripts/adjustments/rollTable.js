import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBArollTable extends regionbaBasic {
	static type = cModuleName + ".rollTable";
	
	static Settings = {
		rollTable : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pDocument) => {return ["RollTable"].includes(pDocument.documentName)}
		},
		playerTokensTriggeronly : {
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
			const cDocuments = this.regionba.rollTable.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(cDocuments)];
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			const cToken = pEvent.data.token;
			
			if (utils.isPlayerToken(cToken, true) && game.user.isGM) return; //GMs should not play for player tokens
			
			if (this.regionba.playerTokensTriggeronly) {
				if (!utils.isPlayerToken(cToken)) return;
			}
			
			if (this.regionba.once) {
				this.parent.update({
					disabled: true
				});
			}
			
			for (const cDocument of this.validDocuments()) {
				cDocument.draw();
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}