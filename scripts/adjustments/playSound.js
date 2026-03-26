import {cModuleName, Translate, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAplaySound extends regionbaBasic {
	static type = cModuleName + ".playSound";
	
	static Settings = {
		soundSource : {
			default : () => {return ""},
			configDialog : true,
			isFile : true,
			type : "audio"
		},
		soundPosition : {
			default : () => {return "trigger"},
			configDialog : true,
			options : () => {return ["trigger", "custom", "global"]}
		},
		soundCustomPosition : {
			default : () => {return []},
			configDialog : true,
			showinDialog : (pFlags) => {return pFlags.soundPosition.includes("custom")},
			objectType : "position",
			positionType : "localxylevel"
		},
		soundVolume : {
			default : () => {return 1},
			configDialog : true,
			range : {
				min : 0.0,
				max : 1.0,
				step : 0.01
			}
		},
		soundRadius : {
			default : () => {return 10},
			showinDialog : (pFlags) => {return !pFlags.soundPosition.includes("global")},
			configDialog : true
		},
		soundEasing : {
			default : () => {return true},
			showinDialog : (pFlags) => {return !pFlags.soundPosition.includes("global")},
			configDialog : true
		},
		soundThroughWalls : {
			default : () => {return false},
			showinDialog : (pFlags) => {return !pFlags.soundPosition.includes("global")},
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
		
		cBehaviorType._handleRegionEvent = async function(pEvent) {
			if (!game.user.isSelf) return;
			
			switch(this.regionba.soundPosition) {
				case "trigger":
					let vTriggerPosition = pEvent.data.position || pEvent.data.movement.passed.waypoints.at(-1);
					vTriggerPosition = {...vTriggerPosition};
					canvas.sounds.emitAtPosition(
						this.regionba.soundSource, 
						vTriggerPosition, 
						this.regionba.soundRadius, 
						{volume : this.regionba.soundVolume, easing : this.regionba.soundEasing, gmAlways : false, walls : !this.regionba.soundThroughWalls}
					);
					break;
				case "custom":
					if (this.regionba.soundCustomPosition.length == 3) {
						let vTriggerPosition = {level : this.regionba.soundCustomPosition[0], x : this.regionba.soundCustomPosition[1], y : this.regionba.soundCustomPosition[2]};
						canvas.sounds.emitAtPosition(
							this.regionba.soundSource, 
							vTriggerPosition, 
							this.regionba.soundRadius, 
							{volume : this.regionba.soundVolume, easing : this.regionba.soundEasing, gmAlways : false, walls : !this.regionba.soundThroughWalls}
						);
					}
					break;
				case "global":
					foundry.audio.AudioHelper.play({src : this.regionba.soundSource, volume : this.regionba.soundVolume}, {recipients : [...game.users].map(user => user.id)});
					break;
			}
		/*	
   * const sound = new Sound("modules/my-module/sounds/spring-trap.ogg", {context: game.audio.environment});
   * await sound.load();
   * const origin = {x: 5200, y: 3700};  // The origin point for the sound
   * const radius = 30;                  // Audible in a 30-foot radius
   * await sound.playAtPosition(origin, radius);*/
		}
	}
}