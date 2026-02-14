import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAstopMovement extends regionbaBasic {
	static type = cModuleName + ".stopMovement";
	
	static Settings = {
		movementTypeBlocked : {
			default : () => {return []},
			configDialog : true,
			isMultiSelect : true,
			options : () => {return Object.keys(CONFIG.Token.movement.actions).map(vKey => {return {id : vKey, name : CONFIG.Token.movement.actions[vKey].label}}).filter(vItem => vItem.id != "displace")},
			scChangeAll : true
		},
		blockDirectionOnly : {
			default : () => {return false},
			configDialog : true
		},
		blockDirection : {
			default : () => {return 0},
			configDialog : true,
			isDirection : true,
			showinDialog : (pFlags) => {return pFlags.blockDirectionOnly}
		}
		/*,
		movementTypeTrapped : {
			default : () => {return []},
			configDialog : true,
			isMultiSelect : true,
			options : () => {return Object.keys(CONFIG.Token.movement.actions).map(vKey => {return {id : vKey, name : CONFIG.Token.movement.actions[vKey].label}}).filter(vItem => vItem.id != "displace")},
			scChangeAll : true
		}*/
	}
	
	static Support() {
		return {
			GMOverride : () => {
				return game.user.isGM && game.settings.get("core", "unconstrainedMovement");
			},
			stickyDistance : (pRegion) => {
				return pRegion.parent.grid.type == "0" ? 1 : pRegion.parent.grid.distance
			},
			CenterWaypoint : (pWaypoint, pToken) => {
				return {
					...pWaypoint,
					x : Math.round(pWaypoint.x + pToken.width * pToken.parent.grid.size/2),
					y : Math.round(pWaypoint.y + pToken.height * pToken.parent.grid.size/2),
				}
			}
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		const cAngleOffset = 90;
		const cDirectionThreshold = 1e-13; //Foundry WASD movement includes a very small orthogonal displacement which is smaller than 1e-13
		
		cBehaviorType.ignoreMovementDirection = function(pEvent) {
			if (!this.regionba.blockDirectionOnly) return false;
			
			const cMovementDelta = {x : pEvent.data.movement.destination.x - pEvent.data.movement.origin.x, y : pEvent.data.movement.destination.y - pEvent.data.movement.origin.y};
			
			const cBlockAngle = (this.regionba.blockDirection + cAngleOffset)/180 * Math.PI;
			
			return (Math.cos(cBlockAngle) * cMovementDelta.x + Math.sin(cBlockAngle) * cMovementDelta.y) <= cDirectionThreshold;
		}
		
		cBehaviorType.RBAonTokenMovementIn = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			if (this.ignoreMovementDirection(pEvent)) return;
			
			if (this.regionba.Support.GMOverride()) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.movementTypeBlocked.includes(cToken.movementAction)  && pEvent.data.movement.passed.waypoints.at(-1).action != "displace") {
				cToken.stopMovement();
				
				/*
				const cMovementDelta = {x : pEvent.data.movement.destination.x - pEvent.data.movement.origin.x, y : pEvent.data.movement.destination.y - pEvent.data.movement.origin.y};
				const cMovementLength = Math.sqrt(cMovementDelta.x * cMovementDelta.x + cMovementDelta.y * cMovementDelta.y);
				const cMovementDirection = {x : cMovementDelta.x/cMovementLength, y : cMovementDelta.y/cMovementLength};
				const cTargetPoint = cToken.layer.getSnappedPoint({x : pEvent.data.movement.destination.x -cMovementDirection.x * this.regionba.Support.stickyDistance(this.region), y : pEvent.data.movement.destination.y -cMovementDirection.y * this.regionba.Support.stickyDistance(this.region)});
				console.log({x : cToken.x, y : cToken.y})
				console.log(cTargetPoint);
				cToken.move({...cTargetPoint, action : "displace"});
				*/
			}
		}
		
		cBehaviorType.RBAonTokenMovementWithin = async function(pEvent) {
			const cUser = pEvent.user;
			
			if (this.ignoreMovementDirection(pEvent)) return;
			
			if (this.regionba.Support.GMOverride()) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.movementTypeBlocked.includes(cToken.movementAction) && pEvent.data.movement.passed.waypoints.at(-1).action != "displace") {
				if (this.region.testPoint(this.regionba.Support.CenterWaypoint(pEvent.data.movement.passed.waypoints.at(-1), cToken)) || pEvent.data.movement.passed.distance > this.regionba.Support.stickyDistance(this.region)) {
					cToken.object?.stopAnimation();
					
					if ( !cUser.isSelf ) return;
					
					cToken.move([{...pEvent.data.movement.origin, action : "displace"}]);
				}
			}
		}
	
		/*
		cBehaviorType.RBAonTokenMovementOut = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			if (this.regionba.Support.GMOverride()) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.movementTypeTrapped.includes(cToken.movementAction)  && pEvent.data.movement.passed.waypoints.at(-1).action != "displace") cToken.stopMovement();
		}
		*/
		
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_WITHIN] = cBehaviorType.RBAonTokenMovementWithin;
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_OUT] = CONFIG.RegionBehavior.dataModels[this.type].prototype.RBAonTokenMovementOut;
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_ENTER] = CONFIG.RegionBehavior.dataModels[this.type].prototype.RBAonTokenMovement;
		//CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_EXIT] = CONFIG.RegionBehavior.dataModels[this.type].prototype.RBAonTokenMovement;
	}
}