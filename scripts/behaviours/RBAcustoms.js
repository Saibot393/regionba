import {cModuleName} from "../utils/utils.js";

//I know that there is a really nice way to add custom behaviours directly, however:
//1) I already have a nice "adjust behaviour" workflow so i want to use it
//2) I need special input types for have of these and implementing the foundry way will limit me in certain ways
export class ping extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_ANIMATE_IN
				CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-bullseye";
	}
}

export class pullCamera extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_ANIMATE_IN
				CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-bullseye";
	}
}

export class stopMovement extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
	static events = {};
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-ban";
	}
}

export class changeMovement extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-person-walking";
	}
}

export class changeVisibility extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_ANIMATE_IN
				CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}
   
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-eye";
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

export class changeCombatant extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];
	
    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_ANIMATE_IN
				CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-shield";
	}
}

export class conditionalTrigger extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_ANIMATE_IN
				CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}
	
	static events = {};
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-question";
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

    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_ANIMATE_IN
				CONST.REGION_EVENTS.TOKEN_ANIMATE_OUT
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
	
	static Icon() {
		return "fa-solid fa-table-list";
	}
}

export class changeWall extends foundry.data.regionBehaviors.RegionBehaviorType {
    static LOCALIZATION_PREFIXES = [];

    static defineSchema() {
		return {
			events: this._createEventsField({events: [
				CONST.REGION_EVENTS.TOKEN_MOVE_IN,
				CONST.REGION_EVENTS.TOKEN_MOVE_OUT,
				CONST.REGION_EVENTS.TOKEN_TURN_START,
				CONST.REGION_EVENTS.TOKEN_TURN_END,
				CONST.REGION_EVENTS.TOKEN_ROUND_START,
				CONST.REGION_EVENTS.TOKEN_ROUND_END
			]})
		} 
	}

    static defineSchema() {return {} }
	
    static events = {};
	
	get isRBAcustom() {
		return true;
	}
}

//CONFIG.statusEffects

export function initCustoms() {
	for (const cBehaviour of [ping, stopMovement, changeMovement, changeVisibility, changeCombatant, rollTable, conditionalTrigger]) {
		const cName = cBehaviour.name;
		
		Object.assign(CONFIG.RegionBehavior.dataModels, {[`${cModuleName}.${cName}`]: cBehaviour});
		Object.assign(CONFIG.RegionBehavior.typeIcons, {[`${cModuleName}.${cName}`]: cBehaviour.Icon()});
	}
	//CONFIG.RegionBehavior.dataModels[cModuleName+".test"] = test;
	//game.model.RegionBehavior[cModuleName+".test"] = {};
}