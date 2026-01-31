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
		},
		addPlayerTokens : {
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
			let vDocuments = this.regionba.combatantDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			if (this.regionba.addTokensonRegion) {
				vDocuments = vDocuments.concat([...this.region.tokens]);
			}
			
			if (this.regionba.addPlayerTokens) {
				vDocuments = vDocuments.concat([...this.region.parent.tokens].filter(vToken => [...game.users].find(vUser => vUser.character == vToken.actor)));
			}
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			if (this.regionba.once) {
				this.parent.update({
					disabled: true
				});
			}
			
			//this.lockTemporary is a bit meh, but the most reliable method i found so far
			if (!this.lockTemporary) {
				this.lockTemporary = true;
				
				const cDocuments = this.validDocuments().filter(vDocument => !vDocument.inCombat);
				
				if (cDocuments.length) {
					/*
					if (!game.combats.viewed) {
						const cCombatClass = foundry.utils.getDocumentClass("Combat");
						await cCombatClass.create({active: true}, {render: false});
					}
					*/
					
					await cDocuments[0].constructor.createCombatants(cDocuments);
				}
				
				/*
				for (const cDocument of cDocuments) {
					if (!cDocument.inCombat) await cDocument.toggleCombatant();
				}
				*/
				this.lockTemporary = false;
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}