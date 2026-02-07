import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

const cThresholdValues = ["30", "40"]

export class RBAchangeWall extends regionbaBasic {
	static type = cModuleName + ".changeWall";
	
	static Settings = {
		wallChangemove : {
			default : () => {return "20"},
			configDialog : true,
			options : () => {return Object.keys(CONST.WALL_MOVEMENT_TYPES).map(vKey => {return {id : CONST.WALL_MOVEMENT_TYPES[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangelight : {
			default : () => {return "20"},
			configDialog : true,
			options : () => {return Object.keys(CONST.WALL_SENSE_TYPES).map(vKey => {return {id : CONST.WALL_SENSE_TYPES[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangelightthreshold : {
			default : () => {return 0},
			configDialog : true,
			subSetting : "wallChangelight",
			showinDialog : (pFlags) => {return cThresholdValues.includes(pFlags.wallChangelight)}
		},
		wallChangesight : {
			default : () => {return "20"},
			configDialog : true,
			options : () => {return Object.keys(CONST.WALL_SENSE_TYPES).map(vKey => {return {id : CONST.WALL_SENSE_TYPES[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangesightthreshold : {
			default : () => {return 0},
			configDialog : true,
			subSetting : "wallChangesight",
			showinDialog : (pFlags) => {return cThresholdValues.includes(pFlags.wallChangesight)}
		},
		wallChangesound : {
			default : () => {return "20"},
			configDialog : true,
			options : () => {return Object.keys(CONST.WALL_SENSE_TYPES).map(vKey => {return {id : CONST.WALL_SENSE_TYPES[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangesoundthreshold : {
			default : () => {return 0},
			configDialog : true,
			subSetting : "wallChangesound",
			showinDialog : (pFlags) => {return cThresholdValues.includes(pFlags.wallChangesound)}
		},
		wallChangePTA : {
			default : () => {return false},
			configDialog : true
		}
	}

	static Support() {
		return {
		
		}
	}
	
	static overrideMethods() {
		const PingRegionBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		PingRegionBehaviorType._handleRegionEvent = function(pEvent) {

		}
	}
}