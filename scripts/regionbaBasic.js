import {cModuleName, utils} from "./utils/utils.js";

export class regionbaBasic {
	static onInit() {
		this.registerFlagAccess();
		this.registerSettingDialog();
		this.registerSupport();
		this.overrideMethods();
	}
	
	static type = "basic"; //REPLACE
	
	static Settings = {}; //REPLACE
	
	static registerSupport() {}; //REPLACE
	
	static overrideMethods() {}; //REPLACE
	
	static registerFlagAccess() {
		const cSettings = this.Settings;
		
		for (const cFlag of Object.keys(this.Settings)) {
			Object.defineProperty(CONFIG.RegionBehavior.dataModels.changeLevel.prototype, `${cModuleName}_${cFlag}`, {
				get() {
					if (this.parent.flags[cModuleName]?.[cFlag] != undefined) {
						if (typeof this.parent.flags[cModuleName][cFlag] == typeof cSettings[cFlag].default()) {
							return this.parent.flags[cModuleName][cFlag];
						}
					}
				
					return cSettings[cFlag].default();
				},
				set(pValue) {
					if (!cSettings[cFlag].preventSet) {
						if (typeof pValue == typeof cSettings[cFlag].default()) {
							let vValueWrap = {newValue : pValue, regionBehaviour : this, oldValue : this[`${cModuleName}_${cFlag}`], preventChange : false};
							
							if (cSettings[cFlag].hasOwnProperty("onSet")) {
								
								cSettings[cFlag].onSet(vValueWrap)
							}
							
							if (!vValueWrap.preventChange) this.parent.setFlag(cModuleName, cFlag, vValueWrap.newValue);
						}
						else {
							throw new Error(`Tried to set ${cModuleName} flag ${cFlag} to a value of type ${typeof pValue}, expected ${typeof cSettings[cFlag].default()}`);
						}
					}
					else {
						throw new Error(`Tried to set ${cModuleName} flag ${cFlag}, this flag does not want to be set, please respect its personal boundaries`)
					}
				}
			})
		}
	}
	
	static registerSettingDialog() {
		Hooks.on("renderRegionBehaviorConfig", (vRBC, vForm, vData, vOptions) => {
			if (vData.document.type == this.type) {
				vForm.querySelector(`button[type="submit"]`).onclick = (pEvent) => {
					vData.document.update({flags : {[cModuleName] : this.evaluateForm(vForm)}});
				}
				
				this.addSettingstoDialog(vRBC, vForm, vData, vOptions, vData.document);
			}
		});
	}
	
	static addSettingstoDialog(pRBC, pForm, pData, pOptions, pDocument) {
		const cSettingstoAdd =  Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog);
		
		if (cSettingstoAdd.length) {
			let vFieldSet = document.createElement("fieldset");
			vFieldSet.classList.add(cModuleName);
			let vLegend = document.createElement("legend");
			vLegend.innerText = `${cModuleName}.Titles.${cModuleName}`;
			vFieldSet.appendChild(vLegend);
			
			pForm.querySelector('section.standard-form[data-application-part="form"]').appendChild(vFieldSet); //makes it easier to identify problems
			
			let vonChange = (pEvent) => {
				let vUpdateData = this.evaluateForm(pForm);
				
				for (const cFlag of Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog)) {
					if (this.Settings[cFlag].hasOwnProperty("showinDialog")) {
						let vInput = vFieldSet.querySelector(`[id="${cModuleName}.${cFlag}"]`);

						let vFormGroup = vInput.closest("div.form-group");

						vFormGroup.style.display = this.Settings[cFlag].showinDialog(vUpdateData) ? "" : "none";
					}
				}
			}	
			
			for (const cFlag of cSettingstoAdd) {
				const cSettingType = this.Settings[cFlag].isLevelsSelect ? "levelSelect" : this.Settings[cFlag].hasOwnProperty("options") ? "selection" : typeof this.Settings[cFlag].default();
				
				let vFormGroup = document.createElement("div");
				vFormGroup.classList.add("form-group");
				
				let vLabel = document.createElement("label");
				vLabel.innerText = `${cModuleName}.Settings.${cFlag}.name`;
				
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

						for (const cOptionValue of this.Settings[cFlag].options) {
							let vOption = document.createElement("option");
							vOption.value = cOptionValue;
							vOption.innerText = `${cModuleName}.Settings.${cFlag}.options.${cOptionValue}`;
							vContent.appendChild(vOption);
						}
						break;
					case "levelSelect":
						vContent = document.createElement("multi-select");
						
						let vOptionsGroup = document.createElement("optgroup");
						
						let vLevels = Array.from(pDocument.region.parent.levels);
						
						for (const cLevel of vLevels) {
							let vOption = document.createElement("option");
							vOption.value = cLevel.id;
							vOption.innerText = cLevel.name;
							vOptionsGroup.appendChild(vOption);
						}
						
						vContent.appendChild(vOptionsGroup);
						break;
				}
				
				if (!["boolean", "levelSelect"].includes(cSettingType)) vContent.value = pDocument.system[`${cModuleName}_${cFlag}`];
				vContent.id = `${cModuleName}.${cFlag}`;
				vContent.onchange = vonChange;
				
				let vHint = document.createElement("p");
				vHint.classList.add("hint");
				vHint.innerText = `${cModuleName}.Settings.${cFlag}.hint`;

				vFormField.appendChild(vContent)

				vFormGroup.appendChild(vLabel);
				vFormGroup.appendChild(vFormField);
				vFormGroup.appendChild(vHint);
				
				vFieldSet.appendChild(vFormGroup);
				
				if (cSettingType == "levelSelect") vContent.value = pDocument.system[`${cModuleName}_${cFlag}`]; //special quirk of multi-select dom
			}
			
			vonChange({});
		}
	}	
	
	static evaluateForm(pForm) {
		let vFieldSet = pForm.querySelector(`fieldset.${cModuleName}`);
		
		let vFlagUpdate = {};
		
		if (vFieldSet) {
			for (const cFlag of Object.keys(this.Settings).filter(vKey => this.Settings[vKey].configDialog)) {
				let vInput = vFieldSet.querySelector(`[id="${cModuleName}.${cFlag}"]`);

				if (vInput) {
					if (typeof this.Settings[cFlag].default() == "boolean") {
						vFlagUpdate[cFlag] = Boolean(vInput.checked);
					}
					else {
						vFlagUpdate[cFlag] = vInput.value;
					}
				}
			}
		}
		
		return vFlagUpdate;
	}
}