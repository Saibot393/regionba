import {cModuleName} from "../utils/utils.js";

//I know that there is a really nice way to add custom behaviours directly, however:
//1) I already have a nice "adjust behaviour" workflow so i want to use it
//2) I need special input types for have of these and implementing the foundry way will limit me in certain ways
export class ping extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = ["enhanced-region-behavior.Regions.VisualEffect"];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class stopMovement extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
	static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class changeMovement extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class changeVisibility extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
	static events = {};
   
	get isRBAcustom() {
		return true;
	}
}

export class changeLockState extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class addtoCombat extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class conditional extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class chatMessage extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export class rollTable extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

export function initCustoms() {
	Object.assign(CONFIG.RegionBehavior.dataModels, {[cModuleName+".stopMovement"]: stopMovement});
	Object.assign(CONFIG.RegionBehavior.typeIcons, {[cModuleName+".stopMovement"]: 'fa-solid fa-ban'});
	
	Object.assign(CONFIG.RegionBehavior.dataModels, {[cModuleName+".changeMovement"]: changeMovement});
	Object.assign(CONFIG.RegionBehavior.typeIcons, {[cModuleName+".changeMovement"]: 'fa-solid fa-person-walking'});
	//CONFIG.RegionBehavior.dataModels[cModuleName+".test"] = test;
	//game.model.RegionBehavior[cModuleName+".test"] = {};
}