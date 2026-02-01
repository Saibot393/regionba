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
		const cBehaviourType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		cBehaviourType.conditionalItemsValue = async function(pEvent) {
			let vValues = [];
			
			const cItems = pEvent.data.token?.actor?.items;
			
			if (cItems) {
				const cInventory = [...cItems];
				
				vValues = vValues.concat(this.regionba.conditionalItems.map(vItemCondition => Boolean(cInventory.find(vItem => vItem._stats.compendiumSource == vItemCondition))));
			}
			
			return vValues;
		}
		
		cBehaviourType.conditionalMacroValue = async function(pEvent) {
			let vValues = [];
			
			const cMacros = this.regionba.conditionalMacros.map(vMacro => fromUuidSync(vMacro)).filter(vMacro => vMacro);
			
		    const {scene, region, behavior} = this;
			const cToken = pEvent.data.token;
			const cSpeaker = cToken ? {scene: cToken.parent?.id ?? null, actor: cToken.actor?.id ?? null, token: cToken.id, alias: cToken.name} : {scene: scene.id, actor: null, token: null, alias: region.name};
			
			for (cMacro of cMacros) {
				try {
					const cMacroResult = await cMacro.execute({speaker : cSpeaker, actor: cToken?.actor, token: cToken?.object, scene, region, behavior, event : pEvent});
				} catch(err) {
					console.error(err);
				}
			
				vValues.push(cMacroResult);
			}
			
			return vValues;
		}
		
		cBehaviourType.conditionalScriptValue = async function(pEvent) {
			let vValues = [];
			
			try {
				const cFunction = new foundry.utils.AsyncFunction("scene", "region", "behavior", "event", "token", "actor", `{${this.regionba.conditionalScript}\n}`);
				const cResult = await cFunction.call(globalThis, this.scene, this.region, this.behavior, pEvent, pEvent.data.token, pEvent.data.token?.actor);
			  
				if (Array.isArray(cResult)) vValues.push(...cResult);
				else vValues.push(cResult);
			} catch(err) {
				console.error(err);
			}
			
			return vValues;
		}
		
		cBehaviourType.validtriggerBehaviours = function() {
			let vDocuments = this.regionba.triggerBehaviours.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviourType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			let vConditionValues = [];
			
			vConditionValues = vConditionValues.concat(await this.conditionalItemsValue(pEvent));
			
			vConditionValues = vConditionValues.concat(await this.conditionalMacroValue(pEvent));
			
			vConditionValues = vConditionValues.concat(await this.conditionalScriptValue(pEvent));
			
			vConditionValues = vConditionValues.filter(vValue => [true, false].includes(vValue));
			
			let vConditionsResult;
			switch (this.regionba.logicMode) {
				case "AND":
					vConditionsResult = vConditionValues.find(vValue => !vValue) == undefined;
					break;
				case "OR":
					vConditionsResult = vConditionValues.find(vValue => vValue);
					break;
			}
			
			if (this.regionba.invertResult) vConditionsResult = !vConditionsResult;
		
			if (vConditionsResult) {
				for (const cBehaviour of this.validtriggerBehaviours()) {
					if (!cBehaviour.disabled || this.regionba.ignoreDisabled) {
						cBehaviour._handleRegionEvent(pEvent);
					}
				}
			}
		}
	}
}