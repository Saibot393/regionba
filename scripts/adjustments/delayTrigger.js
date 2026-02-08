import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAdelayTrigger extends regionbaBasic {
	static type = cModuleName + ".delayTrigger";
	
	static Settings = {
		triggerDelay : {
			default : () => {return 0},
			configDialog : true,
			range : {
				min : 0,
				max : 600,
				step : 0.1
			}
		},
		triggerBehaviours : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["RegionBehavior"].includes(pPlaceable.documentName)}
		},
		ignoreDisabled : {
			default : () => {return true},
			configDialog : true
		}
	}
	
	static Support() {
		return {
		}
	}
	
	static overrideMethods() {
		const cBehaviourType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		cBehaviourType.validtriggerBehaviours = function() {
			let vDocuments = this.regionba["triggerBehaviours"].map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)].filter(vBehaviour => vBehaviour != this);
		}
		
		cBehaviourType.handleRegionEvent = async function(pEvent) {
			//if ( !game.user.isActiveGM ) return;
			if (!pEvent[cModuleName]?.triggerHistory) pEvent[cModuleName] = {triggerHistory : {}};
			if (!pEvent[cModuleName]?.triggerHistory[game.user.id]) pEvent[cModuleName].triggerHistory[game.user.id] = [];
			
			if (pEvent[cModuleName].triggerHistory[game.user.id].includes(this.id)) return; //prevent recursion
			
			utils.wait(this.regionba.triggerDelay * 1000).then(() => {
				for (const cBehaviour of this.validtriggerBehaviours()) {
					if (!cBehaviour.disabled || this.regionba.ignoreDisabled) {
						cBehaviour._handleRegionEvent(pEvent);
					}
				}
			});
		}
		
		const cTriggerEvents = [CONST.REGION_EVENTS.TOKEN_ANIMATE_IN,
								CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT,
								CONST.REGION_EVENTS.TOKEN_MOVE_IN,
								CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
								CONST.REGION_EVENTS.TOKEN_TURN_START,
								CONST.REGION_EVENTS.TOKEN_TURN_END,
								CONST.REGION_EVENTS.TOKEN_ROUND_START,
								CONST.REGION_EVENTS.TOKEN_ROUND_END];
							
		for (const cEvent of cTriggerEvents) {
			CONFIG.RegionBehavior.dataModels[this.type].events[cEvent] = cBehaviourType.handleRegionEvent;
		}
	}
}