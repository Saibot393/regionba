import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeMovement extends regionbaBasic {
	static type = cModuleName + ".changeMovement";
	
	static Settings = {
		movementTypeEnter : {
			default : () => {return ""},
			configDialog : true,
			options : () => {return Object.keys(CONFIG.Token.movement.actions).map(vKey => {return {id : vKey, name : Translate(CONFIG.Token.movement.actions[vKey].label)}}).filter(vItem => vItem.id != "displace")}
		},
		movementTypeLeave : {
			default : () => {return ""},
			configDialog : true,
			options : () => {return Object.keys(CONFIG.Token.movement.actions).map(vKey => {return {id : vKey, name : Translate(CONFIG.Token.movement.actions[vKey].label)}}).filter(vItem => vItem.id != "displace")}
		},
	}
	
	static Support() {
		return {
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		cBehaviorType.RBAonTokenMovementIn = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.movementTypeEnter != "") {
				cToken.pauseMovement();
				
				let vNewWaypoints = pEvent.data.movement.pending.waypoints.map(pPoint => {
					let vNewPoint = {...pPoint};
					
					vNewPoint.action = this.regionba.movementTypeEnter;
					
					return vNewPoint;
				});

				await cToken.update({movementAction : this.regionba.movementTypeEnter})
				
				cToken.move(vNewWaypoints)
			}
		}
	
		cBehaviorType.RBAonTokenMovementOut = async function(pEvent) {
			const cUser = pEvent.user;
			if ( !cUser.isSelf ) return;
			
			const cToken = pEvent.data.token;
			
			if (this.regionba.movementTypeLeave != "") {
				cToken.pauseMovement();
				
				let vNewWaypoints = pEvent.data.movement.pending.waypoints.map(pPoint => {
					let vNewPoint = {...pPoint};
					
					vNewPoint.action = this.regionba.movementTypeLeave;
					
					return vNewPoint;
				});

				await cToken.update({movementAction : this.regionba.movementTypeLeave})
				
				cToken.move(vNewWaypoints)
			}
		}
		
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMovementIn;
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_OUT] = cBehaviorType.RBAonTokenMovementOut;
	}
}