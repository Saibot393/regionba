import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAconditionalTrigger extends regionbaBasic {
	static type = cModuleName + ".conditionalTrigger";
	
	static Settings = {
		logicMode : {
			default : () => {return "AND"},
			configDialog : true,
			options : () => {return ["AND", "OR"]}
		},
		conditionalItems : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["Item"].includes(pPlaceable.documentName)}
		},
		conditionalMacros : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["Macro"].includes(pPlaceable.documentName)}
		},
		conditionalScript : {
			default : () => {return ""},
			configDialog : true,
			isScript : true
		},
		invertResult : {
			default : () => {return false},
			configDialog : true
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
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		cBehaviourType.conditionalItemsValue = async function(pEvent) {
			let vValue = [];
			
			const cItems = pEvent.data.token?.actor?.items;
			
			if (cItems) {
				const cInventory = [...cItems];
				
				vValue = vValue.concat(this.regionba.conditionalItems.map(vItemCondition => Boolean(cInventory.find(vItem => vItem._stats.compendiumSource == vItemCondition)));
			}
			return vValue;
		}
		
		cBehaviourType.conditionalMacroValue = async function(pEvent) {
			let vValues = [];
			
			const cMacros = this.regionba.conditionalMacros.map(vMacro => fromUuidSync(vMacro)).filter(vMacro => vMacro);
			
		    const {scene, region, behavior} = this;
			const cToken = event.data.token;
			const cSpeaker = token ? {scene: token.parent?.id ?? null, actor: token.actor?.id ?? null, token: token.id, alias: token.name} : {scene: scene.id, actor: null, token: null, alias: region.name};
			
			for (cMacro of cMacros) {
				const cMacroResult = await cMacro.execute({speaker : cSpeaker, actor: token?.actor, token: token?.object, scene, region, behavior, event : pEvent});
				
				vValues.push(cMacroResult);
			}
			
			return vValue;
		}
		
		cBehaviourType.conditionalScriptValue = async function(pEvent) {
			let vValue = [];
			
			try {
			  const cFunction = new AsyncFunction("scene", "region", "behavior", "event", `{${this.regionba.conditionalScript}\n}`);
			  vValue.push(await cFunction.call(globalThis, this.scene, this.region, this.behavior, pEvent));
			} catch(err) {
				console.error(err);
			}
			
			return vValue;
		}
		
		cBehaviorType.validtriggerBehaviours = function() {
			let vDocuments = this.regionba.triggerBehaviours.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			let vConditionValues = [];
			
			vConditionValues = vConditionValues.concat(await this.conditionalItemsValue(pEvent));
			
			vConditionValues = vConditionValues.concat(await this.conditionalMacroValue(pEvent));
			
			vConditionValues = vConditionValues.concat(await this.conditionalScriptValue(pEvent));
			
			vConditionValues = vConditionValues.filter(vValue => [true, false].includes(vValue));
			
			let vConditionsResult;
			switch (this.regionba.logicMode) {
				case "AND":
					vConditionsResult = !vConditionValues.find(vValue => !vValue);
					break;
				case "OR":
					vConditionsResult = vConditionValues.find(vValue => vValue);
					break;
			}
			
			if (this.regionba.invertResult) vConditionsResult = !vConditionsResult;
		
			if (vConditionsResult) {
				for (const cBehaviour of this.validtriggerBehaviours()) {
					cBehaviour._handleRegionEvent(pEvent)
				}
			}
		}
		
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
	}
}