import {cModuleName} from "../utils/utils.js";

export function readyCanvasClick() {
	const vOldClick = document.querySelector("canvas#board").onclick;
	
	document.querySelector("canvas#board").onclick = (pEvent) => {
		Hooks.call(cModuleName + ".onCanvasClick", {pEvent});
		if (vOldClick) {
			vOldClick(pEvent);
		}
	}
}