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
			TeleportTokenv13 : async (pToken, pPosition) => {
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
				  await pToken.move({...pPosition, action: "displace"});
				  return {destinationToken : pToken, destinationScene : cDestinationScene};
				}

				// Otherwise teleport the token to the different scene
				vDestinationToken.updateSource({x : pPosition.x + pToken.object.width/2, y : pPosition.y  + pToken.object.height/2, elevation : pToken.elevation});

				// Create the new token
				const cDestinationTokenData = vDestinationToken.toObject();
				if ( cDestinationScene.tokens.has(pToken.id) ) delete cDestinationTokenData._id;
				else cDestinationTokenData._id = pToken.id;
				vDestinationToken = await foundry.documents.TokenDocument.implementation.create(cDestinationTokenData, {parent: cDestinationScene, keepId: true});
				if ( !vDestinationToken ) throw new Error("Failed to create Token in destination Scene");

				// Delete the old token
				await pToken.delete({replacements: {[pToken.id]: vDestinationToken.uuid}});

				return {destinationToken : vDestinationToken, destinationScene : cDestinationScene};
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
			  
			  if ( user.isSelf ) confirmed = await cBehaviorType.RBAconfirmDialog(token, vDestinationInfo);
			  else confirmed = await user.query("confirmTeleportToken", {behaviorUuid: this.parent.uuid, tokenUuid: token.uuid});
			  if ( !confirmed ) return;
			}
			
			if (cDestinationPosition.RBAoverride) { //!!!
				const cTeleport = await this.regionba.Support.TeleportTokenv13(token, cDestinationPosition);
				
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
		
		cBehaviorType.RBAshouldTeleport = function (token, destination, user) {
			const userCanTeleport = (token.parent === destination.parent) || (user.can("TOKEN_CREATE") && user.can("TOKEN_DELETE"));
			if ( userCanTeleport ) return user.isSelf;
			return game.user.isDesignated(u => u.active && u.can("TOKEN_CREATE") && u.can("TOKEN_DELETE") && (!this.choice || u.can("QUERY_USER")));
		}
		
		cBehaviorType.RBAconfirmDialog = async function (token, destination) {
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
		
		if (game.data.release.generation == 13) CONFIG.RegionBehavior.dataModels[this.type].events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] = cBehaviorType.RBAonTokenMoveInv13;
	}
}