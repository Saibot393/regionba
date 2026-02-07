export const cModuleName = "regionba";
export const cModuleAbbr = "RBA";

const cSimpleQuantityKeys = ["quantity", "qty"];

export class utils {
	static async wait(pms) {
		return new Promise(pResolve => setTimeout(pResolve, pms))
	}
	
	static isvalidID(pID) {
		
		return (typeof pID == "string" && pID.length == 16);
	}
	
	static toPositionObject(pPositionArray)  {
		const cPosition = {RBAvalid : false};
		
		if (pPositionArray.length == 3) {
			let vValid = true;
			
			if (utils.isvalidID(pPositionArray[0])) cPosition.sceneID = pPositionArray[0]
			else vValid = false;
			
			if (!isNaN(pPositionArray[1])) cPosition.x = Number(pPositionArray[1])
			else vValid = false;
			
			if (!isNaN(pPositionArray[2])) cPosition.y = Number(pPositionArray[2])
			else vValid = false;
			
			cPosition.RBAvalid = vValid;
		}
		
		if (pPositionArray.length == 4) {
			let vValid = true;
			
			if (utils.isvalidID(pPositionArray[0])) cPosition.sceneID = pPositionArray[0]
			else vValid = false;
			
			if (utils.isvalidID(pPositionArray[1])) cPosition.level = pPositionArray[1]
			else vValid = false;
			
			if (!isNaN(pPositionArray[2])) cPosition.x = Number(pPositionArray[2])
			else vValid = false;
			
			if (!isNaN(pPositionArray[3])) cPosition.y = Number(pPositionArray[3])
			else vValid = false;
			
			cPosition.RBAvalid = vValid;
		}
		
		return cPosition;
	}
	
	static selectedPlaceables() {
		let vSelected = [];
		
		for (const cType of ["tokens", "tiles", "walls", "lights"]) {
			const cTypeSelected = canvas[cType]?.controlled;
			
			if (cTypeSelected) {
				vSelected = vSelected.concat(cTypeSelected);
			}
		}
		
		return vSelected.map(vSelected => vSelected.document);
	}
	
	static isDoor(pWall) {
		if (pWall.documentName == "Wall") {
			return pWall.door > 0;
		}
	
		return undefined;
	}
	
	static doorHidden(pWall) {
		if (utils.isDoor(pWall)) {
			return pWall.door == 2;
		}
		
		return undefined;
	}
	
	static async setDoorHidden(pWall, pHidden) {
		if (utils.isDoor(pWall)) {
			const cTargetState = pHidden ? 2 : 1;
			
			if (pWall.door != cTargetState) {
				await pWall.update({door : cTargetState});
			}
		}
		
		return undefined;
	}
	
	static isPlayerToken(pToken, pActiveOnly = false) {
		return [...game.users].filter(vUser => !pActiveOnly || vUser.active).find(vUser => vUser.character == pToken.actor);
	}
	
	static findIteminActor(pActor, pItem) {
		if (pActor?.items) {
			const cInventory = [...pActor.items];
			
			return cInventory.find(vItem => [vItem._stats.compendiumSource, vItem._stats.duplicateSource].includes(pItem.uuid))
		}
	}
	
	static async giveItemtoActor(pActor, pItem) {
		if (pActor && pItem) {
			const cCreateItem = pItem.clone({}, {addSource : true});
			
			const cTokenItem = await pActor.createEmbeddedDocuments("Item", [cCreateItem]);
			
			if (cTokenItem.length) {
				return cTokenItem[0];
			}
		}
	}
	
	static getItemQuantity(pItem) {
		if (!pItem) return;
		
		for (const cKey of cSimpleQuantityKeys) {
			if (pItem.system.hasOwnProperty(cKey)) {
				return pItem.system[cKey];
			}	
		}
	}
	
	static hasQuantity(pItem) {
		if (!pItem) return;
		
		for (const cKey of cSimpleQuantityKeys) {
			if (pItem.system.hasOwnProperty(cKey)) {
				return !isNaN(pItem.system[cKey]);
			}	
		}
		
		return false;
	}
	
	static async setItemQuantity(pItem, pQuantity) {
		if (!pItem || isNaN(pQuantity)) return;
		
		for (const cKey of cSimpleQuantityKeys) {
			if (pItem.system.hasOwnProperty(cKey)) {
				await pItem.update({system : {[cKey] : pQuantity}});
				
				return true;
			}	
		}
	}
}

export function Translate(pPath, pWords = {}) {
	let vContent = game.i18n.localize(pPath);
	
	for (let vWord of Object.keys(pWords)) {
		vContent = vContent.replace("{" + vWord + "}", pWords[vWord]);
	}
 
	return vContent;
}