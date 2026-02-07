import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

const cThresholdValues = ["30", "40"];

const cRBAunchanged = "-10";
const cRBAMovementTypes = {RBAunchanged :cRBAunchanged, ...CONST.WALL_MOVEMENT_TYPES};
const cRBASenseTypes = {RBAunchanged : cRBAunchanged, ...CONST.WALL_SENSE_TYPES};

export class RBAchangeWall extends regionbaBasic {
	static type = cModuleName + ".changeWall";
	
	static Settings = {
		changeWallDocuments : {
			default : () => {return []},
			configDialog : true,
			objectType : "placeables",
			validSelectable : (pPlaceable) => {return ["Wall"].includes(pPlaceable.documentName)}
		},
		playerTokensTriggeronly : {
			default : () => {return true},
			configDialog : true
		},
		wallChangemove : {
			default : () => {return cRBAunchanged},
			configDialog : true,
			options : () => {return Object.keys(cRBAMovementTypes).map(vKey => {return {id : cRBAMovementTypes[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangelight : {
			default : () => {return cRBAunchanged},
			configDialog : true,
			options : () => {return Object.keys(cRBASenseTypes).map(vKey => {return {id : cRBASenseTypes[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangelightthreshold : {
			default : () => {return 0},
			configDialog : true,
			subSettingof : "wallChangelight",
			showinDialog : (pFlags) => {return cThresholdValues.includes(pFlags.wallChangelight)}
		},
		wallChangesight : {
			default : () => {return cRBAunchanged},
			configDialog : true,
			options : () => {return Object.keys(cRBASenseTypes).map(vKey => {return {id : cRBASenseTypes[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangesightthreshold : {
			default : () => {return 0},
			configDialog : true,
			subSettingof : "wallChangesight",
			showinDialog : (pFlags) => {return cThresholdValues.includes(pFlags.wallChangesight)}
		},
		wallChangesound : {
			default : () => {return cRBAunchanged},
			configDialog : true,
			options : () => {return Object.keys(cRBASenseTypes).map(vKey => {return {id : cRBASenseTypes[vKey], name : Translate("WALL.SenseTypes."+vKey)}})}
		},
		wallChangesoundthreshold : {
			default : () => {return 0},
			configDialog : true,
			subSettingof : "wallChangesound",
			showinDialog : (pFlags) => {return cThresholdValues.includes(pFlags.wallChangesound)}
		},
		wallChangePTA : {
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
		const cBehaviourType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;

		cBehaviourType.validDocuments = function() {
			let vDocuments = this.regionba.changeWallDocuments.map(vUuid => fromUuidSync(vUuid)).filter(vDocument => vDocument);
			
			return [...new Set(vDocuments)];
		}
		
		cBehaviourType.wallUpdates = function() {
			let vUpdate = {threshold : {}};
			
			vUpdate.threshold.attenuation = this.regionba.wallChangePTA;
			
			for (const cRestriction of CONST.WALL_RESTRICTION_TYPES) {
				if (this.regionba[`wallChange${cRestriction}`] != cRBAunchanged) vUpdate[cRestriction] = this.regionba[`wallChange${cRestriction}`];
				
				if (cRestriction != "move") {
					vUpdate.threshold[cRestriction] = this.regionba[`wallChange${cRestriction}threshold`] > 0 ? this.regionba[`wallChange${cRestriction}threshold`] : null;
				}
			}
			
			console.log(vUpdate);
			
			return vUpdate;
		}
		
		cBehaviourType._handleRegionEvent = async function(pEvent) {
			if ( !game.user.isActiveGM ) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.playerTokensTriggeronly) {
				if (!utils.isPlayerToken(cToken)) return;
			}
			
			if (this.regionba.once) {
				this.parent.update({
					disabled: true
				});
			}
			
			const cUpdate = this.wallUpdates();
			
			for (const cDocument of this.validDocuments()) {
				await cDocument.update(cUpdate);
			}
		}
	}
}