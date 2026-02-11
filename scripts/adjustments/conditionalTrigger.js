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
		conditionTypes : {
			default : () => {return []},
			configDialog : true,
			isMultiSelect : true,
			options : () => {return ["ItemsinToken", "DoorState", "TokeninRegions", "TokennotinRegions", "Macros", "Script"].map(vKey => {return {id : vKey, name : `${cModuleName}.BehaviourSettings.conditionTypes.options.${vKey}`}})},
			scChangeAll : true
		},
		conditionalItemsinToken : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pDocument) => {return ["Item"].includes(pDocument.documentName) && !pDocument.actor},
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("ItemsinToken")}
		},
		checkIteminTokenZero : {
			default : () => {return false},
			configDialog : true,
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("ItemsinToken")}
		},
		conditionalDoors : {
			default : () => {return []},
			configDialog : true,
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("DoorState")},
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return utils.isDoor(pPlaceable)}
		},
		conditionalDoorState : {
			default : () => {return "locked"},
			configDialog : true,
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("DoorState")},
			options : () => {return ["locked", "unlocked", "opened", "closed", "unlockedclosed"].map(vKey => {return {id : vKey, name : `${cModuleName}.BehaviourSettings.conditionalDoorState.options.${vKey}`}})}
		},
		conditionalTokeninRegions : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["Region"].includes(pPlaceable.documentName)},
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("TokeninRegions")}
		},
		conditionalTokennotinRegions : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["Region"].includes(pPlaceable.documentName)},
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("TokennotinRegions")}
		},
		conditionalMacros : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["Macro"].includes(pPlaceable.documentName)},
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("Macros")}
		},
		conditionalScript : {
			default : () => {return ""},
			configDialog : true,
			isScript : true,
			showinDialog : (pFlags) => {return pFlags.conditionTypes.includes("Script")}
		},
		invertResult : {
			default : () => {return false},
			configDialog : true
		},
		triggerBehavioursTRUE : {
			default : () => {return []},
			configDialog : true,
			objectType : "documents",
			validSelectable : (pPlaceable) => {return ["RegionBehavior"].includes(pPlaceable.documentName)}
		},
		triggerBehavioursFALSE : {
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
		
		cBehaviourType.conditionalItemsinTokenValue = async function(pEvent) {
			let vValues = [];
			
			const cItems = pEvent.data.token?.actor?.items;
			
			if (cItems) {
				let vInventory = [...cItems];
				
				if (this.regionba.checkIteminTokenZero) {
					vInventory = vInventory.filter(vItem => utils.getItemQuantity(vItem)/*vItem.system?.quantity*/ > 0);
				}
				
				vValues = vValues.concat(this.regionba.conditionalItemsinToken.map(vItemCondition => Boolean(vInventory.find(vItem => vItem._stats.compendiumSource == vItemCondition))));
			}
			
			return vValues;
		}
		
		cBehaviourType.conditionalDoorStateValue = async function(pEvent) {
			const cDoors = this.regionba.conditionalDoors.map(vDoor => fromUuidSync(vDoor)).filter(vDoor => vDoor);
			
		    let vChecker = () => {};
			
			switch (this.regionba.conditionalDoorState) {
				case "locked" :
					vChecker = (pDoor) => {return pDoor.ds == 2};
					break;
				case "unlocked" :
					vChecker = (pDoor) => {return [0, 1].includes(pDoor.ds)};
					break;
				case "opened" :
					vChecker = (pDoor) => {return pDoor.ds == 1};
					break;
				case "closed" :
					vChecker = (pDoor) => {return [0, 2].includes(pDoor.ds)};
					break;
				case "unlockedclosed" : 
					vChecker = (pDoor) => {return pDoor.ds == 0};
					break;
			}
			
			return cDoors.map(cDoor => vChecker(cDoor));
		}
		
		cBehaviourType.conditionalTokeninRegionsValue = async function(pEvent, pCheckRegions = undefined) {
			let vValues = [];
			
			const cToken = pEvent.data.token;
			
			if (cToken) {
				const cCheckRegions = (pCheckRegions || this.regionba.conditionalTokeninRegions).map(vRegion => fromUuidSync(vRegion)).filter(vRegion => vRegion);
				
				vValues = cCheckRegions.map(vRegion => cToken.regions.has(vRegion));
			}
			
			return vValues;
		}
		
		cBehaviourType.conditionalTokennotinRegionsValue = async function(pEvent, pCheckRegions) {
			return (await this.conditionalTokeninRegionsValue(pEvent, this.regionba.conditionalTokennotinRegions)).map(vValue => utils.strictBooleanInverter(vValue));
		}
		
		cBehaviourType.conditionalMacrosValue = async function(pEvent) {
			let vValues = [];
			
			const cMacros = this.regionba.conditionalMacros.map(vMacro => fromUuidSync(vMacro)).filter(vMacro => vMacro);
			
		    const {scene, region, behavior} = this;
			const cToken = pEvent.data.token;
			const cSpeaker = cToken ? {scene: cToken.parent?.id ?? null, actor: cToken.actor?.id ?? null, token: cToken.id, alias: cToken.name} : {scene: scene.id, actor: null, token: null, alias: region.name};
			
			for (cMacro of cMacros) {
				let vMacroResult;
				
				try {
					let vMacroResult = await cMacro.execute({speaker : cSpeaker, actor: cToken?.actor, token: cToken?.object, scene, region, behavior, event : pEvent});
				} catch(err) {
					console.error(err);
				}
			
				if (Array.isArray(vMacroResult)) vValues.push(...vMacroResult);
				else vValues.push(vMacroResult);
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
		
		cBehaviourType.validtriggerBehaviours = function(pType) {
			let vDocuments = this.regionba["triggerBehaviours"+(pType ? "TRUE" : "FALSE")].map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)].filter(vBehaviour => vBehaviour != this);
		}
		
		cBehaviourType.handleRegionEvent = async function(pEvent) {
			//if ( !game.user.isActiveGM ) return;
			if (!pEvent[cModuleName]?.triggerHistory) pEvent[cModuleName] = {triggerHistory : {}};
			if (!pEvent[cModuleName]?.triggerHistory[game.user.id]) pEvent[cModuleName].triggerHistory[game.user.id] = [];
			
			if (pEvent[cModuleName].triggerHistory[game.user.id].includes(this.id)) return; //prevent recursion
			
			pEvent[cModuleName].triggerHistory[game.user.id].push(this.id);
			
			let vConditionValues = [];
			
			/*
			vConditionValues = vConditionValues.concat(await this.conditionalItemsValue(pEvent));
			
			vConditionValues = vConditionValues.concat(await this.conditionalMacroValue(pEvent));
			
			vConditionValues = vConditionValues.concat(await this.conditionalScriptValue(pEvent));
			*/
			for (const cConditional of this.regionba.conditionTypes) {
				vConditionValues = vConditionValues.concat(await this[`conditional${cConditional}Value`](pEvent));
			}
			
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
		
			for (const cBehaviour of this.validtriggerBehaviours(vConditionsResult)) {
				if (!cBehaviour.disabled || this.regionba.ignoreDisabled) {
					cBehaviour._handleRegionEvent(pEvent);
				}
			}
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