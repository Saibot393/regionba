import {cModuleName, utils} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAchangeLevel extends regionbaBasic {
	static type = "changeLevel";
	
	static Settings = {
		autoSkipConfirmDialogue : {
			default : () => {return false},
			worldDefault : () => {return true},
			configDialog : true
		},
		continueMovement : {
			default : () => {return false},
			worldDefault : () => {return true},
			configDialog : true
		},
		targetLevelChoice : {
			default : () => {return "default"},
			configDialog : true,
			options : () => {return ["default", "upElevation", "downElevation", "neighbourElevation", "levelChoice"]}
		},
		chosenLevels : {
			default : () => {return []},
			configDialog : true,
			isLevelSelect : true,
			showinDialog : (pFlags) => {return pFlags.targetLevelChoice.includes("levelChoice")},
			scChangeAll : true
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
			upNeighbourLevels : (region, token) => {
				let vTokenLevel = region.parent.levels.get(token.level);
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
				let vTokenLevel = region.parent.levels.get(token.level);
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
	}
	
	static overrideMethods() {
		const ChangeLevelRegionBehaviorType = CONFIG.RegionBehavior.dataModels.changeLevel.prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		//The following functions are copied and adapted from foundry.mjs with the goal of altering the logic according to the above defined options
		//the function "replace" '#functionName' with 'RBAfunctionName'
		ChangeLevelRegionBehaviorType.RBAonTokenMoveIn = async function(event) {
			const user = event.user;
			if ( !user.isSelf ) return;

			// Displacement does not trigger level change
			const movement = event.data.movement;
			if ( movement.passed.waypoints.at(-1).action === "displace" ) return;

			// If the region doesn't span multiple levels, there's nothing to do
			const token = event.data.token;
			//!!! CUSTOM BEHAVIOUR
			if (this.regionba.movementTypeExclusion.includes(token.movementAction)) return;
			//!!! CUSTOM BEHAVIOUR
			const levels = this.RBAgetDestinationLevels(this.region, token);
			if ( !levels.length ) return;

			// Pause movement while the user decides whether to change the level
			const resumeMovement = token.pauseMovement();
						
			// When the browser tab is/becomes hidden, don't wait for the movement animation and
			// proceed immediately. Otherwise wait for the movement animation to complete.
			if ( token.rendered && token.object.movementAnimationPromise ) {
			  await game.raceWithWindowHidden(token.object.movementAnimationPromise);
			}

			// Confirm the level change
			const levelId = await this.RBAconfirmDialog(this.region, token);
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

			//!!! CUSTOM BEHAVIOUR
			if (this.regionba.continueMovement && event.data.movement.pending?.waypoints?.length) {
				const cExcludedWPKeys = ["elevation", "level"];
				
				let vNewWaypoints = event.data.movement.pending.waypoints.map(pPoint => {
					let vNewPoint = {...pPoint};
					
					for (const cKey of cExcludedWPKeys) {
						delete vNewPoint[cKey];
					}
					
					vNewPoint.level = levelId;
					
					return vNewPoint;
				});
				
				token.move(vNewWaypoints);
			}
			//!!! CUSTOM BEHAVIOUR
		}
		
		ChangeLevelRegionBehaviorType.RBAmoveToken = async function(token, destinationLevel, action, snap) {
			const {x, y, elevation, width, height, depth, shape, level} = token._source;
			const originLevel = token.parent.levels.get(level);

			// First move the token such that its center is inside the region
			const waypoints = [];
			const center = token.getCenterPoint(token._source);
			const closestToCenter = this.region.polygonTree.findClosestPoint(center);
			const closestWaypoint = {
			  x: Math.round(closestToCenter.x - (center.x - x)),
			  y: Math.round(closestToCenter.y - (center.y - y)),
			  elevation, width, height, depth, shape, level, action
			};
			if ( token.testInsideRegion(this.region, closestWaypoint) ) waypoints.push(closestWaypoint);

			// Then snap the token if the original movement was snapped
			if ( snap && !token.parent.grid.isGridless ) {
			  let found = false;
			  const {x, y} = waypoints.at(-1) ?? token._source;
			  for ( const dx of [0, 1, -1] ) {
				for ( const dy of [0, 1, -1] ) {
				  const snappedPosition = token.getSnappedPosition({x: x + dx, y: y + dy, width, height, shape});
				  const snappedWaypoint = {
					x: Math.round(snappedPosition.x),
					y: Math.round(snappedPosition.y),
					elevation, width, height, depth, shape, level, action, snapped: true
				  };
				  if ( token.testInsideRegion(this.region, snappedWaypoint) ) {
					waypoints.push(snappedWaypoint);
					found = true;
					break;
				  }
				}
				if ( found ) break;
			  }
			}

			// Try to move the token into position before changing the level.
			// Note that we might move the token out of the region here if this movement is not fully contained
			// within the region and is constrained outside of the region. This is probably unlikely to occur in
			// practice though.
			if ( waypoints.length ) {
			  await token.move(waypoints);
			  if ( token.level !== originLevel.id ) return;
			}

			// Try to keep the same relative elevation to the level the token is in
			const relativeElevation = token._source.elevation - (Number.isFinite(originLevel?.elevation.bottom)
			  ? originLevel.elevation.bottom : 0);
			const destinationElevation = destinationLevel.clampElevation(relativeElevation + (Number.isFinite(
			  destinationLevel.elevation.bottom) ? destinationLevel.elevation.bottom : 0), token._source.depth);

			// Move the token to the destination level. Ignore surfaces.
			await token.move({elevation: destinationElevation, level: destinationLevel.id, action}, {animate: false, constrainOptions: {ignoreWalls: true}});
		}
		
		ChangeLevelRegionBehaviorType.RBAgetDestinationLevels = function(region, token) {
			if (this.regionba.targetLevelChoice == "default") {
				//!!! CUSTOM BEHAVIOUR
				if ( !region.levels.size ) return region.parent.levels.contents.filter(l => l.id !== token.level);
				return region._source.levels.reduce((arr, id) => {
				  const level = region.parent.levels.get(id);
				  if ( level && (id !== token.level) ) arr.push(level);
				  return arr;
				}, []);
				//!!! CUSTOM BEHAVIOUR
			}
			else {
				let vAvailableLevels = region.parent.levels.filter(l => l.id !== token.level);
				let vValidLevels = [];
				
				switch(this.regionba.targetLevelChoice) {
					case "upElevation":
						return this.regionba.Support.upNeighbourLevels(region, token);
						break;
					case "downElevation":
						return this.regionba.Support.downNeighbourLevels(region, token);
						break;
					case "neighbourElevation":
						return this.regionba.Support.downNeighbourLevels(region, token).concat(this.regionba.Support.upNeighbourLevels(region, token));
						break;
					case "reachingElevation":
						break;
					case "bottomElevation":
						break;
					case "topElevation":
						break;
					case "levelChoice":
						const cSetLevels = this.regionba.chosenLevels.length ? this.regionba.chosenLevels : region.parent.levels;
						
						return cSetLevels.filter(pID => pID !== token.level).map(pID => region.parent.levels.get(pID));
						break;
				}
			}
		}
		
		ChangeLevelRegionBehaviorType.RBAconfirmDialog = async function(region, token) {
			const levels = this.RBAgetDestinationLevels(region, token);
			if ( !levels.length ) return null;
			
			/*!!! CHANGE*/ if (this.regionba.autoSkipConfirmDialogue && levels.length == 1) {return levels[0].id} /*!!! CHANGE*/ 
			
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
		
		CONFIG.RegionBehavior.dataModels.changeLevel.events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = CONFIG.RegionBehavior.dataModels.changeLevel.prototype.RBAonTokenMoveIn;
	}
}

/* Code the above code is directly based on, for comparison to spot changes easier

  static async #onTokenMoveIn(event) {
    const user = event.user;
    if ( !user.isSelf ) return;

    // Displacement does not trigger level change
    const movement = event.data.movement;
    if ( movement.passed.waypoints.at(-1).action === "displace" ) return;

    // If the region doesn't span multiple levels, there's nothing to do
    const token = event.data.token;
    const levels = ChangeLevelRegionBehaviorType.#getDestinationLevels(this.region, token);
    if ( !levels.length ) return;

    // Pause movement while the user decides whether to change the level
    const resumeMovement = token.pauseMovement();

    // When the browser tab is/becomes hidden, don't wait for the movement animation and
    // proceed immediately. Otherwise wait for the movement animation to complete.
    if ( token.rendered && token.object.movementAnimationPromise ) {
      await game.raceWithWindowHidden(token.object.movementAnimationPromise);
    }

    // Confirm the level change
    const levelId = await ChangeLevelRegionBehaviorType.#confirmDialog(this.region, token);
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
    await this.#moveToken(token, level, action, snap);

    // The view isn't automatically changed for GM users
    if ( !game.user.isGM || !token.parent.isView ) return;
    await token.parent.view({level: levelId, controlledTokens: [token.id]});
  }
  
  async #moveToken(token, destinationLevel, action, snap) {
    const {x, y, elevation, width, height, depth, shape, level} = token._source;
    const originLevel = token.parent.levels.get(level);

    // First move the token such that its center is inside the region
    const waypoints = [];
    const center = token.getCenterPoint(token._source);
    const closestToCenter = this.region.polygonTree.findClosestPoint(center);
    const closestWaypoint = {
      x: Math.round(closestToCenter.x - (center.x - x)),
      y: Math.round(closestToCenter.y - (center.y - y)),
      elevation, width, height, depth, shape, level, action
    };
    if ( token.testInsideRegion(this.region, closestWaypoint) ) waypoints.push(closestWaypoint);

    // Then snap the token if the original movement was snapped
    if ( snap && !token.parent.grid.isGridless ) {
      let found = false;
      const {x, y} = waypoints.at(-1) ?? token._source;
      for ( const dx of [0, 1, -1] ) {
        for ( const dy of [0, 1, -1] ) {
          const snappedPosition = token.getSnappedPosition({x: x + dx, y: y + dy, width, height, shape});
          const snappedWaypoint = {
            x: Math.round(snappedPosition.x),
            y: Math.round(snappedPosition.y),
            elevation, width, height, depth, shape, level, action, snapped: true
          };
          if ( token.testInsideRegion(this.region, snappedWaypoint) ) {
            waypoints.push(snappedWaypoint);
            found = true;
            break;
          }
        }
        if ( found ) break;
      }
    }

    // Try to move the token into position before changing the level.
    // Note that we might move the token out of the region here if this movement is not fully contained
    // within the region and is constrained outside of the region. This is probably unlikely to occur in
    // practice though.
    if ( waypoints.length ) {
      await token.move(waypoints);
      if ( token.level !== originLevel.id ) return;
    }

    // Try to keep the same relative elevation to the level the token is in
    const relativeElevation = token._source.elevation - (Number.isFinite(originLevel?.elevation.bottom)
      ? originLevel.elevation.bottom : 0);
    const destinationElevation = destinationLevel.clampElevation(relativeElevation + (Number.isFinite(
      destinationLevel.elevation.bottom) ? destinationLevel.elevation.bottom : 0), token._source.depth);

    // Move the token to the destination level. Ignore surfaces.
    await token.move({elevation: destinationElevation, level: destinationLevel.id, action}, {animate: false,
      constrainOptions: {ignoreWalls: true}});
  }
  
*/