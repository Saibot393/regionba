import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeItem extends regionbaBasic {
	static type = cModuleName + ".changeItem";
	
	static Settings = {
		changeItemDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pDocument) => {return ["Item"].includes(pDocument.documentName)}
		},
		changeItemMode : {
			default : () => {return "give"},
			configDialog : true,
			options : () => {return ["give", "remove", "setto"]}
		},
		itemQuantity : {
			default : () => {return 1},
			configDialog : true,
			range : {
				min : 0
			}
		},
		deleteItemonZero : {
			default : () => {return false},
			configDialog : true
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
		
		cBehaviorType.validItems = function() {
			const cDocuments = this.regionba.changeItemDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(cDocuments)];
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cToken = pEvent.data.token;
			
			if (cToken?.actor) {
				const cActor = cToken.actor;
				
				for (const cItemDocument of this.validItems()) {

					const cHasQuantity = cItemDocument.system?.hasOwnProperty("quantity");
					
					let vTokenItem = utils.findIteminActor(cActor, cItemDocument);
					
					const cCurrentQuantity = cHasQuantity ? (vTokenItem?.system.quantity || 0) : (vTokenItem ? 1 : 0);
					
					let vChange = 0;
					
					switch (this.regionba.changeItemMode) {
						case "give":
							vChange = this.regionba.itemQuantity;
							break;
						case "remove":
							vChange = -this.regionba.itemQuantity;
							break;
						case "setto":
							vChange = this.regionba.itemQuantity - cCurrentQuantity;
							break;
					}
					
					const cTargetQuantity = Math.max(0, cCurrentQuantity + vChange);
					
					if (cCurrentQuantity != cTargetQuantity) {
						if (!vTokenItem) {
							vTokenItem = await utils.giveItemtoActor(cActor, cItemDocument);
						}
						
						if (cHasQuantity && vTokenItem) await vTokenItem.update({system : {quantity : cTargetQuantity}})
					}
					
					if (cHasQuantity && vTokenItem && cTargetQuantity == 0 && this.regionba.deleteItemonZero) {
						await cActor.deleteEmbeddedDocuments("Item", [vTokenItem.id]);
					}
				}
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}