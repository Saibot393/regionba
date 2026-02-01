import {cModuleName, cModuleAbbr, utils, Translate} from "../utils/utils.js";

export class customInputs {
	static range(pRange) {
		const cRange = document.createElement("RBARange");
		cRange.style.display = "flex";
		cRange.style.flexDirection = "row";
		
		const cNumberLine = document.createElement("input");
		cNumberLine.type = "range";
		
		const cNumberInput = document.createElement("input");
		cNumberInput.type = "number";
		cNumberInput.style.width = "36px";
		cNumberInput.style.marginLeft = "5px";
		
		for (const cKey of Object.keys(pRange)) {
			for (const cObject of [cRange, cNumberLine, cNumberInput]) {
				cObject[cKey] = pRange[cKey];
			}
		}
		
		cNumberLine.onchange = (pEvent) => {if (cNumberInput.value != cNumberLine.value) cNumberInput.value = cNumberLine.value};
		cNumberLine.oninput = cNumberLine.onchange;
		cNumberInput.onchange = (pEvent) => {if (cNumberLine.value != cNumberInput.value) cNumberLine.value = cNumberInput.value};
		
		Object.defineProperty(cRange, "value", {
			get() {
				return Number(cNumberLine.value);
			},
			set(pValue) {
				cNumberLine.value = pValue;
				cNumberInput.value = pValue;
			}
		});
		
		cRange.appendChild(cNumberLine);
		cRange.appendChild(cNumberInput);
		
		return cRange;
	}
	
	static canvasSelector(pElementName, pButton) {
		const cElement = document.createElement(pElementName);
		cElement.style.display = "flex";
		cElement.style.flexDirection = "row";
		
		const cInput = document.createElement("input");
		cInput.type = "text";
	
		const cSelect = document.createElement("button");
		cSelect.classList.add("icon", ...pButton.icon);
		cSelect.style.marginLeft = "5px";
		
		cSelect.onclick = (pEvent) => {
			pEvent.stopPropagation();
			pEvent.preventDefault();
			pButton.onclick(pEvent, {setValue : (pValue) => {cInput.value = pValue}, addValue : (pValue) => {cInput.value += (cInput.value ? "," : "") + pValue}})
		};
		
		cElement.appendChild(cInput);
		cElement.appendChild(cSelect);
		
		Object.defineProperty(cElement, "value", {
			get() {
				return cInput.value.split(",")
			},
			set(pValue) {
				cInput.value = pValue.join(",");
			}
		});
		
		return cElement;
	}
	
	static position(pPositionType) {
		let vButtonClick;
	
		switch (pPositionType) {
			case "localxy":
				vButtonClick = (pEvent, pInput) => {
					Hooks.once(cModuleName + ".onCanvasClick", ({pEvent, pMousePosition}) => {try {pInput.setValue([Math.round(pMousePosition.x), Math.round(pMousePosition.y)].join(","))} catch {}})
				}
			break;
			case "globalxy":
				vButtonClick = (pEvent, pInput) => {
					Hooks.once(cModuleName + ".onCanvasClick", ({pEvent, pMousePosition}) => {try {pInput.setValue([canvas.scene?.id, Math.round(pMousePosition.x), Math.round(pMousePosition.y)].join(","))} catch {}})
				}
			break;
		}
		
		return customInputs.canvasSelector(cModuleAbbr+"position", {onclick : vButtonClick, icon : ["fa-solid", "fa-bullseye"], hint : ""});
	}
	
	static placeables(pSelectedableValidation) {
		const cButtonClick = (pEvent, pInput) => {
			if (pEvent.shiftKey) pInput.addValue(utils.selectedPlaceables().filter(vPlaceable => pSelectedableValidation(vPlaceable)).map(vPlaceable => vPlaceable.uuid))
			else pInput.setValue(utils.selectedPlaceables().filter(vPlaceable => pSelectedableValidation(vPlaceable)).map(vPlaceable => vPlaceable.uuid));
		}
		
		return customInputs.canvasSelector(cModuleAbbr+"placeable", {onclick : cButtonClick, icon : ["fa-solid", "fa-file-circle-plus"], hint : ""});
	}
	
	static tagDIV() {
		const cTagDIV = document.createElement(cModuleAbbr+"tagDIV");
		cTagDIV.style.display = "flex";
		cTagDIV.style.flexWrap = "wrap";
		cTagDIV.style.justifyContent = "flex-end";
		cTagDIV.style.alignItems = "center";
		cTagDIV.style.width = "100%";
		cTagDIV.style.gap = "0.25rem";
		
		const cRemoveAllTags = () => {[...cTagDIV.childNodes].forEach(vNode => vNode.remove())}
		
		cTagDIV.addTag = function (pTag) {
			if (!this.hasTag(pTag)) {
				const cTag = document.createElement("tag");
				cTag.setAttribute("value", pTag.value);
				cTag.style.display = "flex";
				cTag.style.gap = "0.25rem";
				cTag.style.alignItems = "center";
				cTag.style.fontSize = "var(--font-size-12)";
				cTag.style.border = "1px solid var(--color-dark-3)";
				cTag.style.borderRadius = "4px";
				cTag.style.padding = "1px 0.25rem";
				
				const cSpan = document.createElement("span");
				cSpan.innerText = pTag.name;
				
				const cRemove = document.createElement("a");
				cRemove.classList.add("fa-solid",  "fa-xmark");
				cRemove.onclick = () => {cTag.remove()}
				
				cTag.appendChild(cSpan);
				cTag.appendChild(cRemove);
				
				this.appendChild(cTag);
				
				return true;
			}
			
			return false;
		}
		
		cTagDIV.hasTag = function (pTag) {
			return this.value.find(vValue => vValue == pTag.value);
		}
		
		Object.defineProperty(cTagDIV, "value", {
			get() {
				return [...cTagDIV.childNodes].map(vNode => vNode.getAttribute("value"));
			},
			set(pValue) {
				cRemoveAllTags();
				
				for (const cValueItem of pValue) {
					cTagDIV.addTag(cValueItem);
				}
			}
		});
		
		return cTagDIV;
	}
	
	static documents(pSelectedableValidation) {
		const cElement = document.createElement(cModuleAbbr+"document");
		cElement.style.display = "flex";
		cElement.style.flexWrap = "wrap";
		cElement.style.alignItems = "center";
		cElement.style.flex = 1;
		cElement.style.gap = "0.5rem"
		
		const cTags = customInputs.tagDIV();
		
		const cUUIDInput = document.createElement("input");
		cUUIDInput.type = "text";
		cUUIDInput.style.flex = "1";
		
		const cInputButton = document.createElement("button");
		cInputButton.classList.add("icon", "fa-solid", "fa-file-circle-plus");
		cInputButton.style.marginLeft = "5px";
		cInputButton.style.flexBasis = "36px";
		
		const cAddInput = () => {
			const cDocument = fromUuidSync(cUUIDInput.value);
			
			if (cDocument && pSelectedableValidation(cDocument)) {
				cTags.addTag({value : cDocument.uuid, name : cDocument.name});
				
				cUUIDInput.value = "";
			}
		}
		
		cUUIDInput.ondrop = (pEvent) => {
			const cData = JSON.parse(pEvent.dataTransfer.getData("text/plain"));
			
			if (cData) {
				cUUIDInput.value = cData.uuid;
				
				cAddInput();
			}
		};
		
		cInputButton.onclick = cAddInput();
		
		cElement.appendChild(cTags);
		cElement.appendChild(cUUIDInput);
		cElement.appendChild(cInputButton);
		
		Object.defineProperty(cElement, "value", {
			get() {
				return cTags.value;
			},
			set(pValue) {
				const cValues = pValue.map(vValue => {
					const cDocument = fromUuidSync(vValue);
					if (cDocument) {
						return ({value : cDocument.uuid, name : cDocument.name})
					}
				}).filter(vValue => vValue);
				
				cTags.value = cValues;
			}
		});
		
		return cElement;
	}
}