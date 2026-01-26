import {cModuleName, utils} from "./utils/utils.js";

class RBAchangeLevel {
	static onInit() {
		this.registerFlagAccess();
		this.registerSettingDialog();
		this.registerSupport();
		this.overrideMethods();
	}
	
	static type = "changeLevel";

	
	static registerFlagAccess() {
		for (const cFlag of Object.keys(this.Settings)) {
			Object.defineProperty(CONFIG.RegionBehavior.dataModels.changeLevel.prototype, `${cModuleName}_${cFlag}`, {
				get() {
					if (this.parent.flags[cModuleName]?.[cFlag] != undefined) {
						if (typeof this.parent.flags[cModuleName][cFlag] == typeof RBAchangeLevel.Settings[cFlag].default()) {
							return this.parent.flags[cModuleName][cFlag];
						}
					}
				
					return RBAchangeLevel.Settings[cFlag].default();
				},
				set(value) {
					console.log(value);
				}
			})
		}
	}
	
	static registerSettingDialog() {
		let test = (vForm, pDocument) => {
			vForm.querySelector(`button[type="submit"]`).onclick = (pEvent) => {
				let vFieldSet = vForm.querySelector(`fieldset.${cModuleName}`);
				
				let vFlagUpdate = {};
				
				for (const cFlag of Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog)) {
					let vInput = vFieldSet.querySelector(`[id="${cModuleName}.${cFlag}"]`);
					if (typeof this.Settings[cFlag].default() == "boolean") {
						vFlagUpdate[cFlag] = Boolean(vInput.checked);
					}
					else {
						vFlagUpdate[cFlag] = vInput.value;
					}
				}
				
				pDocument.update({flags : {[cModuleName] : vFlagUpdate}});
			}
		}
		
		Hooks.on("renderRegionBehaviorConfig", (vRBC, vForm, vData, vOptions) => {
			if (vData.document.type == this.type) {
				test(vForm, vData.document);
				this.addSettingstoDialog(vRBC, vForm, vData, vOptions, vData.document);
			}
		});
	}
	
	static addSettingstoDialog(pRBC, pForm, pData, pOptions, pDocument) {
		let vFieldSet = document.createElement("fieldset");
		vFieldSet.classList.add(cModuleName);
		let vLegend = document.createElement("legend");
		vLegend.innerHTML = cModuleName;
		vFieldSet.appendChild(vLegend);
		
		
		for (const cFlag of Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog)) {
			const cSettingType = this.Settings[cFlag].hasOwnProperty("options") ? "selection" : typeof this.Settings[cFlag].default();
			
			let vFormGroup = document.createElement("div");
			vFormGroup.classList.add("form-group");
			
			let vLabel = document.createElement("label");
			vLabel.innerHTML = "HERE NAME";
			
			let vFormField = document.createElement("div");
			vFormField.classList.add("form-fields");
			
			let vContent;
			switch(cSettingType) {
				case "boolean":
					vContent = document.createElement("input");
					vContent.type = "checkbox";
					vContent.checked = Boolean(pDocument.system[`${cModuleName}_${cFlag}`])
					break;
				case "number":
					vContent = document.createElement("input");
					vContent.type = "number";
					break;
				case "string":
					vContent = document.createElement("input");
					vContent.type = "text";
					break;
				case "selection":
					vContent = document.createElement("select");
					for (let vOptionValue of this.Settings[cFlag].options) {
						let vOption = document.createElement("option");
						vOption.value = vOptionValue;
						vOption.innerHTML = vOptionValue;
						vContent.appendChild(vOption);
					}
					break;
			}
			
			if (!["boolean"].includes(cSettingType)) vContent.value = pDocument.system[`${cModuleName}_${cFlag}`];
			vContent.id = `${cModuleName}.${cFlag}`;//`system.${cModuleName}.${cFlag}`;
			
			let vHint = document.createElement("p");
			vHint.classList.add("hint");
			vHint.innerHTML = "HERE HINT";

			vFormField.appendChild(vContent)

			vFormGroup.appendChild(vLabel);
			vFormGroup.appendChild(vFormField);
			vFormGroup.appendChild(vHint);
			
			vFieldSet.appendChild(vFormGroup);
		}
		
		pForm.querySelector('section.standard-form[data-application-part="form"]').appendChild(vFieldSet);
	}	
	
	static Settings = {
		autoSkipConfirmDialogue : {
			default : () => {return false},
			configDialog : true
		},
		targetLevelChoice : {
			default : () => {return "default"},
			configDialog : true,
			options : ["default", "upElevation", "downElevation", "neighbourElevation", "reachingElevation"]
		},
		specificLevels : {
			default : () => {return []},
			configDialog : false
		}
	}
	
	static registerSupport() {
		Object.defineProperty(CONFIG.RegionBehavior.dataModels.changeLevel.prototype, cModuleName + "Support", 
			{get() {
				return {
					upNeighbourLevels : (region, token) => {
						let vTokenLevel = region._source.levels.get(token.level);
						let vAvailableLevels = region.parent.levels.filter(l => l.id !== token.level);
						let vValidLevels = [];
						
						let vBottom = vTokenLevel.elevation.bottom;
						for (let vCheckLevel of vAvailableLevels) {
							if (vCheckLevel.elevation.bottom > vBottom) {
								if (vValidLevels.length) {
									if (vCheckLevel.elevation.bottom == vValidLevels[0].elevation.bottom) {
										vValidLevels.push(vCheckLevel);
									}
									if (vCheckLevel.elevation.bottom < vValidLevels[0].elevation.bottom) {
										vValidLevels = [vCheckLevel]
									}
								}
								else {
									vValidLevels.push(vCheckLevel);
								}
							}
						}
						
						return vValidLevels;
					},
					downNeighbourLevels : (region, token) => {
						let vTokenLevel = region._source.levels.get(token.level);
						let vAvailableLevels = region.parent.levels.filter(l => l.id !== token.level);
						let vValidLevels = [];
						
						let vBottom = vTokenLevel.elevation.bottom;
						for (let vCheckLevel of vAvailableLevels) {
							if (vCheckLevel.elevation.bottom < vBottom) {
								if (vValidLevels.length) {
									if (vCheckLevel.elevation.bottom == vValidLevels[0].elevation.bottom) {
										vValidLevels.push(vCheckLevel);
									}
									if (vCheckLevel.elevation.bottom > vValidLevels[0].elevation.bottom) {
										vValidLevels = [vCheckLevel]
									}
								}
								else {
									vValidLevels.push(vCheckLevel);
								}
							}
						}
						
						return vValidLevels;
					}
				}
			}}
		);
	}
	
	static overrideMethods() {
		const ChangeLevelRegionBehaviorType = CONFIG.RegionBehavior.dataModels.changeLevel.prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		//The following functions are copied and adapted from foundry.mjs with the goal of altering the logic according to the above defined options
		//the function replace '#functionName' with 'RBAfunctionName'
		CONFIG.RegionBehavior.dataModels.changeLevel.prototype.RBAonTokenMoveIn = async function(event) {
			console.log("works");
			
			const user = event.user;
			if ( !user.isSelf ) return;

			// Displacement does not trigger level change
			const movement = event.data.movement;
			if ( movement.passed.waypoints.at(-1).action === "displace" ) return;

			// If the region doesn't span multiple levels, there's nothing to do
			const token = event.data.token;
			const levels = ChangeLevelRegionBehaviorType.RBAgetDestinationLevels(this.region, token);
			if ( !levels.length ) return;

			// Pause movement while the user decides whether to change the level
			const resumeMovement = token.pauseMovement();

			// When the browser tab is/becomes hidden, don't wait for the movement animation and
			// proceed immediately. Otherwise wait for the movement animation to complete.
			if ( token.rendered && token.object.movementAnimationPromise ) {
			  await game.raceWithWindowHidden(token.object.movementAnimationPromise);
			}

			// Confirm the level change
			const levelId = await ChangeLevelRegionBehaviorType.RBAconfirmDialog(this.region, token);
			if ( !levelId || (levelId === token.level) ) {
			  resumeMovement();
			  return;
			}
			const level = token.parent.levels.get(levelId);
			if ( !level ) return;

			// Move the token to the destination level unless the token has been moved in the meantime
			if ( token.movement.id !== movement.id ) return;
			const action = movement.passed.waypoints.at(-1).action;
			const snap = movement.pending.waypoints.at(0)?.snapped ?? movement.passed.waypoints.at(-1).snapped;
			await this.RBAmoveToken(token, level, action, snap);

			// The view isn't automatically changed for GM users
			if ( !game.user.isGM || !token.parent.isView ) return;
			await token.parent.view({level: levelId, controlledTokens: [token.id]});
		}
		
		CONFIG.RegionBehavior.dataModels.changeLevel.prototype.RBAmoveToken = async function(token, destinationLevel, action, snap) {
			const originLevel = token.parent.levels.get(token._source.level);

			// Snap the token first if the original movement was snapped
			if ( snap ) {
			  const {x, y, elevation, width, height, depth, shape, level} = token._source;
			  const snappedPosition = {...token.getSnappedPosition({x, y, elevation, width, height, shape}),
				width, height, depth, shape, level};
			  if ( token.testInsideRegion(this.region, snappedPosition) ) {
				await token.move({...snappedPosition, action, snapped: true});
				if ( token.level !== originLevel.id ) return;
			  }
			}

			// Try to keep the same relative elevation to the level the token is in
			const relativeElevation = token._source.elevation - (originLevel?._source.elevation.bottom ?? 0);
			const elevation = destinationLevel.clampElevation(relativeElevation
			  + (destinationLevel._source.elevation.bottom ?? 0), token._source.depth);

			// Move the token to the destination level. Ignore surfaces.
			await token.move({elevation, level: destinationLevel.id, action}, {animate: false,
			  constrainOptions: {ignoreWalls: true}});
		}
		
		CONFIG.RegionBehavior.dataModels.changeLevel.events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = CONFIG.RegionBehavior.dataModels.changeLevel.prototype.RBAonTokenMoveIn;
		
		CONFIG.RegionBehavior.dataModels.changeLevel.prototype.RBAgetDestinationLevels = function(region, token) {
			if (this.regionba_targetLevelChoice == "default") {
				//!!!Original Code
				if ( !region.levels.size ) return region.parent.levels.contents.filter(l => l.id !== token.level);
				return region._source.levels.reduce((arr, id) => {
				  const level = region.parent.levels.get(id);
				  if ( level && (id !== token.level) ) arr.push(level);
				  return arr;
				}, []);
				//!!!
			}
			else {
				let vTokenLevel = region._source.levels.get(token.level);
				let vAvailableLevels = region.parent.levels.filter(l => l.id !== token.level);
				let vValidLevels = [];
				
				switch(this.regionba_targetLevelChoice) {
					case "upElevation":
						return this.RBASupport.upNeighbourLevels(region, token);
						break;
					case "downElevation":
						return this.RBASupport.downNeighbourLevels(region, token);
						break;
					case "neighbourElevation":
						return this.RBASupport.downNeighbourLevels(region, token).concat(this.RBASupport.upNeighbourLevels(region, token));
						break;
					case "reachingElevation":
						break;
				}
			}
		}
		
		CONFIG.RegionBehavior.dataModels.changeLevel.prototype.RBAconfirmDialog = async function(region, token) {
			const levels = ChangeLevelRegionBehaviorType.RBAgetDestinationLevels(region, token);
			if ( !levels.length ) return null;
			
			/*!!! CHANGE*/ if (this.regionba_autoSkipConfirmDialogue && levels.length == 1) {return levels[0]} /*!!! CHANGE*/ 
			
			levels.sort((a, b) => a.sort - b.sort);
			const originLevel = token.parent.levels.get(token.level);
			const getLabel = destinationLevel => {
			  if ( !originLevel ) return "BEHAVIOR.TYPES.changeLevel.Move";
			  if ( originLevel.elevation.bottom > destinationLevel.elevation.bottom ) return "BEHAVIOR.TYPES.changeLevel.MoveDown";
			  if ( originLevel.elevation.bottom < destinationLevel.elevation.bottom ) return "BEHAVIOR.TYPES.changeLevel.MoveUp";
			  return "BEHAVIOR.TYPES.changeLevel.Move";
			};
			return DialogV2.confirm({
			  window: {title: CONFIG.RegionBehavior.typeLabels.changeLevel},
			  content: levels.length === 1 ? _loc("BEHAVIOR.TYPES.changeLevel.Confirm",
				{token: foundry.utils.escapeHTML(token.name), level: foundry.utils.escapeHTML(levels[0].name)})
				: `
				  <p>
					${_loc("BEHAVIOR.TYPES.changeLevel.ConfirmSelect", {token: foundry.utils.escapeHTML(token.name)})}
				  </p>
				  <select name="level">
					${levels.map(l => `<option value="${l.id}">${foundry.utils.escapeHTML(l.name)}</option>`).join("")}
				  </select>
				`,
			  yes: {
				label: getLabel(levels[0]),
				callback: (event, button) => levels.length === 1 ? levels[0].id : button.form.elements.level.value
			  },
			  no: {label: "COMMON.Cancel"},
			  render: levels.length === 1 ? undefined : (event, dialog) => {
				dialog.element.querySelector('[name="level"]').addEventListener("change", e => {
				  const span = dialog.element.querySelector('[data-action="yes"] > span');
				  span.textContent = _loc(getLabel(token.parent.levels.get(e.target.value)));
				});
			  }
			});
		}
	}
}

Hooks.once("init", () => {
	RBAchangeLevel.onInit();
});