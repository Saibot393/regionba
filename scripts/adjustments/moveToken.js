import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAmoveToken extends regionbaBasic {
	static type = cModuleName + ".moveToken";
	
	static Settings = {
		movementModus : {
			default : () => {return "relative"},
			configDialog : true,
			options : () => {return ["relative", "fromCenter"].map(vKey => {return {id : vKey, name : `${cModuleName}.BehaviourSettings.movementModus.options.${vKey}`}})},
		},
		movementDirection : {
			default : () => {return 0},
			configDialog : true,
			isDirection : true,
			showinDialog : (pFlags) => {return pFlags.movementModus == "relative"}
		},
		movementDistance : {
			default : () => {return 0},
			configDialog : true
		},
		movementType : {
			default : () => {return "RBAcurrentMovement"},
			configDialog : true,
			options : () => {
				return Object.keys(CONFIG.Token.movement.actions).concat("RBAcurrentMovement").map(vKey => {
					return {id : vKey, name : vKey == "RBAcurrentMovement" ? `${cModuleName}.BehaviourSettings.movementModus.options.${vKey}` : CONFIG.Token.movement.actions[vKey].label}
				}).filter(vItem => vItem.id != "displace")
			}
		},
		movementTypeExclusion : {
			default : () => {return []},
			configDialog : true,
			isMultiSelect : true,
			options : () => {return Object.keys(CONFIG.Token.movement.actions).map(vKey => {return {id : vKey, name : CONFIG.Token.movement.actions[vKey].label}}).filter(vItem => vItem.id != "displace")},
			scChangeAll : true
		}
	}
	
	static Support() {
		return {
			movementScale : (pRegion) => {
				const cGrid = pRegion.parent.grid;
				
				return cGrid.size/cGrid.distance;
			},
			GMOverride : () => {
				return game.user.isGM && game.settings.get("core", "unconstrainedMovement");
			}
		}
	}
	
	static overrideMethods() {
		const cBehaviourType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		const cAngleOffset = 90;
		
		cBehaviourType.targetPosition = function(pEvent) {
			const cToken = pEvent.data.token;
			const cDistanceScale = this.regionba.Support.movementScale(this.region);
			const cTokenCenter = cToken.object.center;
			
			switch (this.regionba.movementModus) {
				case "relative":
					const cMoveAngle = (this.regionba.movementDirection + cAngleOffset)/180 * Math.PI;
					
					return {x : cToken.x + Math.cos(cMoveAngle) * cDistanceScale * this.regionba.movementDistance, y : cToken.y + Math.sin(cMoveAngle) * cDistanceScale * this.regionba.movementDistance}
					break;
				case "fromCenter":
					let vDirection = {x : cTokenCenter.x - this.region.object.center.x, y : cTokenCenter.y - this.region.object.center.y};
					const cDirectionLength = Math.sqrt(vDirection.x * vDirection.x + vDirection.y * vDirection.y);
					vDirection = {x : vDirection.x/cDirectionLength, y : vDirection.y/cDirectionLength};
					
					return {x : cToken.x + vDirection.x * cDistanceScale * this.regionba.movementDistance, y : cToken.y + vDirection.y * cDistanceScale * this.regionba.movementDistance};
					break;
			}
		}
		
		cBehaviourType._handleRegionEvent = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			if (this.regionba.Support.GMOverride()) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.movementTypeExclusion.includes(cToken.movementAction)) return;
			
			cToken.stopMovement();
			
			const cTargetPosition = this.targetPosition(pEvent);
			
			const cMovementType = this.regionba.movementType == "RBAcurrentMovement" ? cToken.movementAction : this.regionba.movementType;
			
			cToken.move({...cTargetPosition, action : cMovementType});
		}
	}
}