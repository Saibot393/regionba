import {cModuleName, utils, Translate} from "../utils/utils.js";
import {regionbaBasic} from "./regionbaBasic.js";

export class RBAteleportToken extends regionbaBasic {
	static type = "teleportToken";
	
	static Settings = {
		teleportPosition : {
			default : () => {return []},
			configDialog : true,
			objectType : "position",
			positionType : "globalxy"
		}
	}
	
	static Support() {
		return {
			GMOverride : () => {
				return game.user.isGM && game.settings.get("core", "unconstrainedMovement");
			},
			canTeleporttoPosition(pToken, pPosition, pUser) {
				const cDestinationScene = game.scenes.get(pPosition.sceneID);
				
				const cUserCanTeleport = (pToken.parent === cDestinationScene) || (pUser.can("TOKEN_CREATE") && pUser.can("TOKEN_DELETE"));
				if ( cUserCanTeleport ) return pUser.isSelf;
				return game.user.isDesignated(u => u.active && u.can("TOKEN_CREATE") && u.can("TOKEN_DELETE") && (!this.choice || u.can("QUERY_USER")));
			},
			TeleportToken : async (pToken, pPosition, pOptions = {}) => {
				//adapted from region.teleportToken
				if ( !pToken.isOwner ) throw new Error("You must be an owner of the Token in order to teleport it.");
				
				const cDestinationScene = game.scenes.get(pPosition.sceneID);
				const cOriginScene = pToken.parent;
				let vDestinationToken;
				
				if ( !cDestinationScene ) throw new Error("Invalid teleport scene position");
				
				if ( (cOriginScene !== cDestinationScene) && !(game.user.can("TOKEN_CREATE") && game.user.can("TOKEN_DELETE")) ) {
					throw new Error("You must have TOKEN_CREATE and TOKEN_DELETE permissions to teleport the Token to a different Scene.");
				}
    
				if (cOriginScene === cDestinationScene) vDestinationToken = pToken;
				else {
					const cOriginTokenData = pToken.toObject();
					delete cOriginTokenData._id;
					vDestinationToken = foundry.documents.TokenDocument.implementation.fromSource(cOriginTokenData, {parent: cDestinationScene});
				}
				


				// If the origin and destination scene are the same
				if ( vDestinationToken === pToken ) {
				  await pToken.move({...pPosition, action: "displace"}, pOptions);
				  return {destinationToken : pToken, destinationScene : cDestinationScene, destinationLevel : cDestinationScene?.levels?.get(pPosition.level)};
				}

				// Otherwise teleport the token to the different scene
				vDestinationToken.updateSource({x : pPosition.x + pToken.object.width/2, y : pPosition.y  + pToken.object.height/2, elevation : pToken.elevation, level : pPosition.level});

				// Create the new token
				const cDestinationTokenData = vDestinationToken.toObject();
				if ( cDestinationScene.tokens.has(pToken.id) ) delete cDestinationTokenData._id;
				else cDestinationTokenData._id = pToken.id;
				vDestinationToken = await foundry.documents.TokenDocument.implementation.create(cDestinationTokenData, {parent: cDestinationScene, keepId: true});
				if ( !vDestinationToken ) throw new Error("Failed to create Token in destination Scene");

				// Delete the old token
				await pToken.delete({replacements: {[pToken.id]: vDestinationToken.uuid}});

				return {destinationToken : vDestinationToken, destinationScene : cDestinationScene, destinationLevel : cDestinationScene?.levels?.get(pPosition.level)};
			}	
		}
	}
	
	static overrideMethods() {
		const cBehaviorType = CONFIG.RegionBehavior.dataModels[this.type].prototype;
		const DialogV2 = foundry.applications.api.DialogV2;
		
		//The following functions are copied and adapted from foundry.mjs with the goal of altering the logic according to the above defined options
		//the function "replace" '#functionName' with 'RBAfunctionName' (and potentially a version number)
		cBehaviorType.RBAonTokenMoveInv13 = async function(event) {
			const cDestinationPosition = utils.toPositionObject(this.regionba.teleportPosition); //!!!
			
			if ( (!this.destination && !cDestinationPosition.RBAvalid) || (event.data.movement.passed.waypoints.at(-1).action === "displace") ) return;
			
			cDestinationPosition.RBAoverride = cDestinationPosition.RBAvalid && !this.destination; //!!!
			
			const destination = fromUuidSync(this.destination);
			if ( !(destination instanceof RegionDocument) && !cDestinationPosition.RBAvalid ) {
			  console.error(`${this.destination} does not exist`);
			  return;
			}
			
			const token = event.data.token;
			const user = event.user;
			
			cDestinationPosition.RBAoverride = cDestinationPosition.RBAoverride || !(destination instanceof RegionDocument); //!!!
			cDestinationPosition.RBAoverride = cDestinationPosition.RBAoverride && this.regionba.Support.canTeleporttoPosition(token, cDestinationPosition, user)
			
			if ( user.isSelf ) token.stopMovement();
			if ( (destination && !this.RBAshouldTeleport(token, destination, user)) && !cDestinationPosition.RBAoverride ) return; //!!!

			// When the browser tab is/becomes hidden, don't wait for the movement animation and
			// proceed immediately. Otherwise wait for the movement animation to complete.
			if ( token.rendered && token.object.movementAnimationPromise && !window.document.hidden ) {
			  let visibilitychange;
			  await Promise.race([token.object.movementAnimationPromise, new Promise(resolve => {
				visibilitychange = event => {
				  if ( window.document.hidden ) resolve();
				};
				window.document.addEventListener("visibilitychange", visibilitychange);
			  }).finally(() => {
				window.document.removeEventListener("visibilitychange", visibilitychange);
			  })]);
			}

			if ( this.choice ) {
			  let confirmed;
			  
			  //!!!
			  let vDestinationInfo;
			  if (cDestinationPosition.RBAoverride) vDestinationInfo = {name : Translate(cModuleName + ".Titles.genericPosition", cDestinationPosition), parent : game.scenes.get(cDestinationPosition.sceneID)}
			  else vDestinationInfo = destination;
			  //!!!
			  
			  if ( user.isSelf ) confirmed = await cBehaviorType.RBAconfirmDialogv13(token, vDestinationInfo);
			  else confirmed = await user.query("confirmTeleportToken", {behaviorUuid: this.parent.uuid, tokenUuid: token.uuid});
			  if ( !confirmed ) return;
			}
			
			if (cDestinationPosition.RBAoverride) { //!!!
				const cTeleport = await this.regionba.Support.TeleportToken(token, cDestinationPosition);
				
				if (cTeleport) {
					if ( token.parent !== cTeleport.destinationScene ) {
					  if ( user.isSelf ) {
						console.log(cTeleport);
						if ( token.parent.isView ) await cTeleport.destinationScene.view();
						} else {
						if ( token.parent.id === user.viewedScene ) await game.socket.emit("pullToScene", cTeleport.destinationScene.id, user.id);
					  }
					}
				}
			}
			else {
				await destination.teleportToken(token);
				
				// View destination scene / Pull the user to the destination scene only if the user is currently viewing the origin
				// scene
				if ( token.parent !== destination.parent ) {
				  if ( user.isSelf ) {
					if ( token.parent.isView ) await destination.parent.view();
					} else {
					if ( token.parent.id === user.viewedScene ) await game.socket.emit("pullToScene", destination.parent.id, user.id);
				  }
				}
			}
		}
		
		cBehaviorType.RBAonTokenMoveInv14 = async function(event) {
			const cDestinationPosition = utils.toPositionObject(this.regionba.teleportPosition); //!!!
			console.log(cDestinationPosition);
			const movement = event.data.movement;
			// Displacement does not trigger teleportation
			if ( movement.passed.waypoints.at(-1).action === "displace" ) return;

			// Get destination regions
			const destinations = [];
			for ( const regionUuid of this.destinations ) {
			  const destination = fromUuidSync(regionUuid, {relative: this.parent});
			  if ( !(destination instanceof RegionDocument) ) {
				console.error(`${regionUuid} does not exist`);
				continue;
			  }
			  destinations.push(destination);
			}
			if ( destinations.length === 0 && !cDestinationPosition.RBAvalid) return;

			if (destinations.length !== 0) {//!!! relevant logic split, region teleport or RBA teleport
				const token = event.data.token;
				const user = event.user;
				if ( user.isSelf ) {
				  if ( this.choice ) token.pauseMovement(this.parent.uuid);
				  else token.stopMovement();
				}
				if ( !this.RBAshouldTeleport(token, destinations, user) ) return;

				// When the browser tab is/becomes hidden, don't wait for the movement animation and
				// proceed immediately. Otherwise wait for the movement animation to complete.
				if ( token.rendered && token.object.movementAnimationPromise ) {
				  await game.raceWithWindowHidden(token.object.movementAnimationPromise);
				}

				// Confirm the destination if choice
				let result;
				if ( this.choice ) {
				  if ( user.isSelf ) {
					result = await cBehaviorType.RBAconfirmDialogv14(this.dialog, token, destinations, this.revealed);
				  }
				  else result = await user.query("confirmTeleportToken", {behaviorUuid: this.parent.uuid, tokenUuid: token.uuid});
				  if ( !result ) {
					token.resumeMovement(movement.id, this.parent.uuid);
					return;
				  }
				}

				// Select the destination
				let destination;
				if ( typeof result === "string" ) destination = destinations.find(d => d.uuid === result);
				else destination = destinations[Math.floor(Math.random() * destinations.length)];
				if ( !destination ) {
				  if ( this.choice ) token.resumeMovement(movement.id, this.parent.uuid);
				  return;
				}
				if ( token.movement.id !== movement.id ) return;

				// Calculate of offset for relative placement
				const center = token.getCenterPoint(event.data.movement.destination);
				const offset = {
				  x: (center.x - this.region.bounds.left) / this.region.bounds.width,
				  y: (center.y - this.region.bounds.top) / this.region.bounds.height
				};

				// Teleport token to destination
				const originLevel = token.level;
				const destinationToken = await destination.teleportToken(token, {placement: this.placement, snap: this.snap, offset,
				  pan: {transitionType: this.transition.type, duration: this.transition.duration, force: true}});
				const destinationLevel = destinationToken.level;

				// Only control the teleported token in the destination scene and override transition animation
				const viewOptions = {level: destinationLevel, controlledTokens: [destinationToken.id], transition: this.transition};

				// View destination scene / Pull the user to the destination scene only if the user is currently viewing the origin
				// scene
				if ( token.parent === destination.parent ) {

				  // The view isn't automatically changed for GM users
				  if ( user.isGM && (originLevel !== destinationLevel) && token.parent.isView
				   && (canvas.level.id === originLevel) ) await token.parent.view(viewOptions);
				  return;
				}

				// View the destination scene or pull the user that moved the token to the destination scene
				const viewPromises = [];
				if ( user.isSelf ) {
				  if ( token.parent.isView ) viewPromises.push(destination.parent.view(viewOptions));
				} else {
				  if ( token.parent.id === user.viewedScene ) {
					viewPromises.push(game.socket.emit("pullToScene", destination.parent.id, user.id, viewOptions));
				  }
				}

				// Pull all active non-GM users that don't own a token in this scene (anymore) and observe the teleported token
				if ( game.user.isGM ) {
				  for ( const user of this.RBAgetUsersToPull(token) ) {
					viewPromises.push(game.socket.emit("pullToScene", destination.parent.id, user.id, viewOptions));
				  }
				}

				await Promise.all(viewPromises);
			}
			else {//RBA teleport based on foundry v13 teleport behaviour
				const cToken = event.data.token;
				const cUser = event.user;
				
				if ( cUser.isSelf ) cToken.stopMovement();

				// When the browser tab is/becomes hidden, don't wait for the movement animation and
				// proceed immediately. Otherwise wait for the movement animation to complete.
				if ( cToken.rendered && cToken.object.movementAnimationPromise && !window.document.hidden ) {
				  let visibilitychange;
				  await Promise.race([cToken.object.movementAnimationPromise, new Promise(resolve => {
					visibilitychange = event => {
					  if ( window.document.hidden ) resolve();
					};
					window.document.addEventListener("visibilitychange", visibilitychange);
				  }).finally(() => {
					window.document.removeEventListener("visibilitychange", visibilitychange);
				  })]);
				}

				if ( this.choice ) {
				  let cConfirmed;
				  
				  //!!!
				  const cDestinationInfo = {name : Translate(cModuleName + ".Titles.genericPosition", cDestinationPosition), parent : game.scenes.get(cDestinationPosition.sceneID)};
				  //!!!
				  
				  if ( cUser.isSelf ) cConfirmed = await cBehaviorType.RBAconfirmDialogv14(this.dialog, cToken, [cDestinationInfo], this.revealed);
				  else cConfirmed = await cUser.query("confirmTeleportToken", {behaviorUuid: this.parent.uuid, tokenUuid: cToken.uuid});
				  if ( !cConfirmed ) return;
				}
				
				const cOriginLevel = cToken.level;
				
				let vElevationChange = 0;
				
				if (cOriginLevel != cDestinationPosition.level) {//make sure teleport between levels sets the right elevation
					const cOriginLevelElevation = cToken.parent.levels?.get(cToken.level)?.elevation.bottom;
					const cDestinationLevelElevation = game.scenes.get(cDestinationPosition.sceneID)?.levels.get(cDestinationPosition.level)?.elevation.bottom;
					
					if (!isNaN(cOriginLevelElevation) && !isNaN(cDestinationLevelElevation)) vElevationChange = cDestinationLevelElevation - cOriginLevelElevation;
				}
				
				//animations are only necessary on the same level, otherwise animations are handled further down
				const cTeleportOptions = cDestinationPosition.level == cToken.level ? {pan : {transitionType: this.transition.type, duration: this.transition.duration, force: true}, animation: {linkToMovement: true}} : {};
				
				const cTeleport = await this.regionba.Support.TeleportToken(cToken, {...cDestinationPosition, elevation : cToken.elevation + vElevationChange}, cTeleportOptions);
				
				const cViewOptions = {level: cTeleport.destinationToken.level, controlledTokens: [cTeleport.destinationToken.id], transition: this.transition};
				
				if (cTeleport) {
					if ( cToken.parent === cTeleport.destinationScene ) {
						// The view isn't automatically changed for GM users
						console.log(cViewOptions);
						
						if ((cOriginLevel !== cToken.level)) {
							if (cToken.parent.isView && (canvas.level.id === cOriginLevel)) {
								await cToken.parent.view(cViewOptions);
							}
						}
					}
					else {//different scenes
					  if ( cUser.isSelf ) {
						  console.log(cViewOptions);
						if ( cToken.parent.isView ) await cTeleport.destinationScene.view(cViewOptions);
						} else {
						if ( cToken.parent.id === cUser.viewedScene ) await game.socket.emit("pullToScene", cTeleport.destinationScene.id, cUser.id, cViewOptions);
					  }
					  
					  // Pull all active non-GM users that don't own a token in this scene (anymore) and observe the teleported token
					  if ( game.user.isGM ) {
					    for ( const user of this.RBAgetUsersToPull(cToken) ) {
						  viewPromises.push(game.socket.emit("pullToScene", destination.parent.id, user.id, cViewOptions));
					    }
					  }
					}
				}
			}
		}
		
		cBehaviorType.RBAshouldTeleport = function (token, destination, user) {
			const userCanTeleport = (token.parent === destination.parent) || (user.can("TOKEN_CREATE") && user.can("TOKEN_DELETE"));
			if ( userCanTeleport ) return user.isSelf;
			return game.user.isDesignated(u => u.active && u.can("TOKEN_CREATE") && u.can("TOKEN_DELETE") && (!this.choice || u.can("QUERY_USER")));
		}
		
		cBehaviorType.RBAgetUsersToPull = function (token) {
			if ( token.hidden ) return [];
			const toPull = [];
			for ( const user of game.users ) {
			  if ( !user.active || user.isSelf || user.isGM ) continue;
			  if ( (token.parent.id !== user.viewedScene) || (token.level !== user.viewedLevel) ) continue;
			  if ( !token.testUserPermission(user, "OBSERVER") ) continue;
			  if ( token.parent.tokens.some(t => (t !== token) && !t.hidden && t.isOwner
				&& (t.level === token.level)) ) continue;
			  toPull.push(user);
			}
			return toPull;
		}
		
		cBehaviorType.RBAconfirmDialogv13 = async function (token, destination) {
			const question = game.i18n.format(`BEHAVIOR.TYPES.teleportToken.${game.user.isGM ? "ConfirmGM" : "Confirm"}`, {
			  token: foundry.utils.escapeHTML(token.name),
			  region: foundry.utils.escapeHTML(destination.name),
			  scene: foundry.utils.escapeHTML(destination.parent.name)
			});
			return DialogV2.confirm({
			  window: {title: CONFIG.RegionBehavior.typeLabels.teleportToken},
			  content: `<p>${question}</p>`
			});
		}
		
		cBehaviorType.RBAconfirmDialogv14 = async function(dialog, token, destinations, revealed) {
			if ( game.user.isGM ) revealed = true;
			const config = {window: {title: CONFIG.RegionBehavior.typeLabels.teleportToken}};
			if ( !revealed ) {
			  config.content = `
				<p>
				  ${_loc(dialog.unrevealed ? foundry.utils.escapeHTML(dialog.unrevealed) : "BEHAVIOR.TYPES.teleportToken.Confirm", {token: foundry.utils.escapeHTML(token.name)})}
				</p>
			  `;
			} else if ( destinations.length === 1 ) {
			  const destination = destinations[0];
			  config.content = `<p>${_loc(dialog.revealed ? foundry.utils.escapeHTML(dialog.revealed) : "BEHAVIOR.TYPES.teleportToken.ConfirmRevealed", {
				token: foundry.utils.escapeHTML(token.name),
				region: foundry.utils.escapeHTML(destination.name),
				scene: foundry.utils.escapeHTML(destination.parent.name)
			  })}</p>`;
			} else {
			  const scene = destinations[0].parent;
			  const allInSameScene = destinations.every(d => d.parent === scene);
			  const options = destinations.map(d => ({value: d.uuid, label: allInSameScene ? d.name : _loc("BEHAVIOR.TYPES.teleportToken.ConfirmSelectOption",
				{region: foundry.utils.escapeHTML(d.name), scene: foundry.utils.escapeHTML(d.parent.name)})}))
				.sort((a, b) => a.label.localeCompare(b.label));
			  config.content = `
				<p>
				  ${_loc(dialog.revealed ? foundry.utils.escapeHTML(dialog.revealed) : `BEHAVIOR.TYPES.teleportToken.ConfirmSelect${allInSameScene ? "Same" : "Different"}Scene`,
					{token: foundry.utils.escapeHTML(token.name), scene: allInSameScene ? foundry.utils.escapeHTML(scene.name) : undefined})}
				</p>
				<select name="destination">
				  ${options.map(({value, label}) => `<option value="${value}">${foundry.utils.escapeHTML(label)}</option>`).join("")}
				</select>
			  `;
			  config.yes = {
				label: "COMMON.Confirm",
				callback: (event, button) => button.form.elements.destination.value
			  };
			  config.no = {label: "COMMON.Cancel"};
			}
			return DialogV2.confirm(config);
		}
		
		CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = (game.data.release.generation == 13) ? cBehaviorType.RBAonTokenMoveInv13 : cBehaviorType.RBAonTokenMoveInv14;
	}
}

/* Code the above code is directly based on, for comparison to spot changes easier
 static async #onTokenMoveIn(event) {
    const movement = event.data.movement;

    // Displacement does not trigger teleportation
    if ( movement.passed.waypoints.at(-1).action === "displace" ) return;

    // Get destination regions
    const destinations = [];
    for ( const regionUuid of this.destinations ) {
      const destination = fromUuidSync(regionUuid, {relative: this.parent});
      if ( !(destination instanceof RegionDocument) ) {
        console.error(`${regionUuid} does not exist`);
        continue;
      }
      destinations.push(destination);
    }
    if ( destinations.length === 0 ) return;

    const token = event.data.token;
    const user = event.user;
    if ( user.isSelf ) {
      if ( this.choice ) token.pauseMovement(this.parent.uuid);
      else token.stopMovement();
    }
    if ( !this.#shouldTeleport(token, destinations, user) ) return;

    // When the browser tab is/becomes hidden, don't wait for the movement animation and
    // proceed immediately. Otherwise wait for the movement animation to complete.
    if ( token.rendered && token.object.movementAnimationPromise ) {
      await game.raceWithWindowHidden(token.object.movementAnimationPromise);
    }

    // Confirm the destination if choice
    let result;
    if ( this.choice ) {
      if ( user.isSelf ) {
        result = await TeleportTokenRegionBehaviorType.#confirmDialog(this.dialog, token, destinations, this.revealed);
      }
      else result = await user.query("confirmTeleportToken", {behaviorUuid: this.parent.uuid, tokenUuid: token.uuid});
      if ( !result ) {
        token.resumeMovement(movement.id, this.parent.uuid);
        return;
      }
    }

    // Select the destination
    let destination;
    if ( typeof result === "string" ) destination = destinations.find(d => d.uuid === result);
    else destination = destinations[Math.floor(Math.random() * destinations.length)];
    if ( !destination ) {
      if ( this.choice ) token.resumeMovement(movement.id, this.parent.uuid);
      return;
    }
    if ( token.movement.id !== movement.id ) return;

    // Calculate of offset for relative placement
    const center = token.getCenterPoint(event.data.movement.destination);
    const offset = {
      x: (center.x - this.region.bounds.left) / this.region.bounds.width,
      y: (center.y - this.region.bounds.top) / this.region.bounds.height
    };

    // Teleport token to destination
    const originLevel = token.level;
    const destinationToken = await destination.teleportToken(token, {placement: this.placement, snap: this.snap, offset,
      pan: {transitionType: this.transition.type, duration: this.transition.duration, force: true}});
    const destinationLevel = destinationToken.level;

    // Only control the teleported token in the destination scene and override transition animation
    const viewOptions = {level: destinationLevel, controlledTokens: [destinationToken.id], transition: this.transition};

    // View destination scene / Pull the user to the destination scene only if the user is currently viewing the origin
    // scene
    if ( token.parent === destination.parent ) {

      // The view isn't automatically changed for GM users
      if ( user.isGM && (originLevel !== destinationLevel) && token.parent.isView
       && (canvas.level.id === originLevel) ) await token.parent.view(viewOptions);
      return;
    }

    // View the destination scene or pull the user that moved the token to the destination scene
    const viewPromises = [];
    if ( user.isSelf ) {
      if ( token.parent.isView ) viewPromises.push(destination.parent.view(viewOptions));
    } else {
      if ( token.parent.id === user.viewedScene ) {
        viewPromises.push(game.socket.emit("pullToScene", destination.parent.id, user.id, viewOptions));
      }
    }

    // Pull all active non-GM users that don't own a token in this scene (anymore) and observe the teleported token
    if ( game.user.isGM ) {
      for ( const user of this.#getUsersToPull(token) ) {
        viewPromises.push(game.socket.emit("pullToScene", destination.parent.id, user.id, viewOptions));
      }
    }

    await Promise.all(viewPromises);
  }
  
  static events = {
    [REGION_EVENTS.TOKEN_MOVE_IN]: this.#onTokenMoveIn
  };
  
  #shouldTeleport(token, destinations, user) {
    const userCanTeleport = user.isGM || destinations.every(d => token.parent === d.parent)
      || (user.can("TOKEN_CREATE") && user.can("TOKEN_DELETE") && (!game.users.activeGM || !this.#getUsersToPull(token).length));
    if ( userCanTeleport ) return user.isSelf;
    return game.user.isDesignated(u => u.active && u.can("TOKEN_CREATE") && u.can("TOKEN_DELETE") && (!this.choice || u.can("QUERY_USER")));
  }
  
  #getUsersToPull(token) {
    if ( token.hidden ) return [];
    const toPull = [];
    for ( const user of game.users ) {
      if ( !user.active || user.isSelf || user.isGM ) continue;
      if ( (token.parent.id !== user.viewedScene) || (token.level !== user.viewedLevel) ) continue;
      if ( !token.testUserPermission(user, "OBSERVER") ) continue;
      if ( token.parent.tokens.some(t => (t !== token) && !t.hidden && t.isOwner
        && (t.level === token.level)) ) continue;
      toPull.push(user);
    }
    return toPull;
  }
  
  static _confirmQuery = async ({behaviorUuid, tokenUuid}) => {
    const behavior = await fromUuid(behaviorUuid);
    if ( !behavior || (behavior.type !== "teleportToken") || !behavior.system.destinations.size ) return false;
    const destinations = Array.from(behavior.system.destinations, fromUuidSync)
      .filter(d => d instanceof RegionDocument);
    if ( destinations.length === 0 ) return false;
    const token = await fromUuid(tokenUuid);
    if ( !token ) return false;
    return TeleportTokenRegionBehaviorType.#confirmDialog(behavior.dialog, token, destinations, this.revealed);
  };
  
  static async #confirmDialog(dialog, token, destinations, revealed) {
    if ( game.user.isGM ) revealed = true;
    const config = {window: {title: CONFIG.RegionBehavior.typeLabels.teleportToken}};
    if ( !revealed ) {
      config.content = `
        <p>
          ${_loc(dialog.unrevealed ? foundry.utils.escapeHTML(dialog.unrevealed) : "BEHAVIOR.TYPES.teleportToken.Confirm", {token: foundry.utils.escapeHTML(token.name)})}
        </p>
      `;
    } else if ( destinations.length === 1 ) {
      const destination = destinations[0];
      config.content = `<p>${_loc(dialog.revealed ? foundry.utils.escapeHTML(dialog.revealed) : "BEHAVIOR.TYPES.teleportToken.ConfirmRevealed", {
        token: foundry.utils.escapeHTML(token.name),
        region: foundry.utils.escapeHTML(destination.name),
        scene: foundry.utils.escapeHTML(destination.parent.name)
      })}</p>`;
    } else {
      const scene = destinations[0].parent;
      const allInSameScene = destinations.every(d => d.parent === scene);
      const options = destinations.map(d => ({value: d.uuid, label: allInSameScene ? d.name : _loc("BEHAVIOR.TYPES.teleportToken.ConfirmSelectOption",
        {region: foundry.utils.escapeHTML(d.name), scene: foundry.utils.escapeHTML(d.parent.name)})}))
        .sort((a, b) => a.label.localeCompare(b.label));
      config.content = `
        <p>
          ${_loc(dialog.revealed ? foundry.utils.escapeHTML(dialog.revealed) : `BEHAVIOR.TYPES.teleportToken.ConfirmSelect${allInSameScene ? "Same" : "Different"}Scene`,
            {token: foundry.utils.escapeHTML(token.name), scene: allInSameScene ? foundry.utils.escapeHTML(scene.name) : undefined})}
        </p>
        <select name="destination">
          ${options.map(({value, label}) => `<option value="${value}">${foundry.utils.escapeHTML(label)}</option>`).join("")}
        </select>
      `;
      config.yes = {
        label: "COMMON.Confirm",
        callback: (event, button) => button.form.elements.destination.value
      };
      config.no = {label: "COMMON.Cancel"};
    }
    return DialogV2.confirm(config);
  }
*/