import {cModuleName, utils, Translate} from "../utils/utils.js";

export class regionbaBasic {
	static onInit() {
		if (this.canInit) {
			this.registerPropertyAccess();
			this.registerSettingDialog();
			this.overrideMethods();
		}
		else {
			throw new Error(`Region behaviour adjustment ${this.type} can not be initialised, it might be incompatible with this version`);
		}
	}
	
	static canInit() {
		return Boolean(Object.defineProperty(CONFIG.RegionBehavior.dataModels[this.type]));
	}
	
	static type = "basic"; //OVERRIDE
	
	static Settings = {}; //OVERRIDE
	
	static Support() {}; //OVERRIDE
	
	static overrideMethods() {}; //OVERRIDE
	
	static registerPropertyAccess() {
		const cSettings = this.Settings;
		const cSupport = this.Support();
		
		Object.defineProperty(CONFIG.RegionBehavior.dataModels[this.type].prototype, cModuleName, {
			get() {
				const cBehaviour = this;
				const cManagerObject = {};
				
				Object.defineProperty(cManagerObject, "Behaviour", {get() {return cBehaviour}});
				Object.defineProperty(cManagerObject, "Support", {get() {return cSupport}});
				
				for (const cFlag of Object.keys(cSettings)) {
					Object.defineProperty(cManagerObject, cFlag, {
						get() {
							if (this.Behaviour.parent.flags[cModuleName]?.[cFlag] != undefined) {
								if (typeof this.Behaviour.parent.flags[cModuleName][cFlag] == typeof cSettings[cFlag].default()) {
									return this.Behaviour.parent.flags[cModuleName][cFlag];
								}
							}
						
							return cSettings[cFlag].default();
						},
						set(pValue) {
							if (!cSettings[cFlag].preventSet) {
								if (typeof pValue == typeof cSettings[cFlag].default()) {
									let vValueWrap = {newValue : pValue, regionBehaviour : this.Behaviour, oldValue : this[cFlag], preventChange : false};
									
									if (cSettings[cFlag].hasOwnProperty("onSet")) {
										
										cSettings[cFlag].onSet(vValueWrap)
									}
									
									if (!vValueWrap.preventChange) this.Behaviour.parent.setFlag(cModuleName, cFlag, vValueWrap.newValue);
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
				
				return cManagerObject;
			}
		})
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
			vLegend.innerText = Translate(`${cModuleName}.Titles.${cModuleName}`);
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
				const cSettingType = this.Settings[cFlag].isMultiSelect || this.Settings[cFlag].isLevelSelect ? "multiSelect" : this.Settings[cFlag].hasOwnProperty("options") ? "selection" : typeof this.Settings[cFlag].default();
				
				let vFormGroup = document.createElement("div");
				vFormGroup.classList.add("form-group");
				
				let vLabel = document.createElement("label");
				vLabel.innerText = Translate(`${cModuleName}.Settings.${cFlag}.name`);
				
				let vFormField = document.createElement("div");
				vFormField.classList.add("form-fields");
				
				let vContent;
				switch(cSettingType) {
					case "boolean":
						vContent = document.createElement("input");
						vContent.type = "checkbox";
						vContent.checked = Boolean(pDocument.system[cModuleName][cFlag])
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

						for (const cOptionValue of this.Settings[cFlag].options()) {
							let vOption = document.createElement("option");
							vOption.value = cOptionValue;
							vOption.innerText = Translate(`${cModuleName}.Settings.${cFlag}.options.${cOptionValue}`);
							vContent.appendChild(vOption);
						}
						break;
					case "multiSelect":
						vContent = document.createElement("multi-select");
						
						let vOptionsGroup = document.createElement("optgroup");
						
						const cOptions = this.Settings[cFlag].isLevelSelect ? Array.from(pDocument.region.parent.levels) : this.Settings[cFlag].options();
						
						for (const cOption of cOptions) {
							let vOption = document.createElement("option");
							vOption.value = cOption.id;
							vOption.innerText = Translate(cOption.name);
							vOptionsGroup.appendChild(vOption);
						}
						
						vContent.appendChild(vOptionsGroup);
						break;
				}
				
				if (!["boolean", "multiSelect"].includes(cSettingType)) vContent.value = pDocument.system[cModuleName][cFlag];
				vContent.id = `${cModuleName}.${cFlag}`;
				vContent.onchange = vonChange;
				
				let vHint = document.createElement("p");
				vHint.classList.add("hint");
				vHint.innerText = Translate(`${cModuleName}.Settings.${cFlag}.hint`);

				vFormField.appendChild(vContent)

				vFormGroup.appendChild(vLabel);
				vFormGroup.appendChild(vFormField);
				vFormGroup.appendChild(vHint);
				
				vFieldSet.appendChild(vFormGroup);
				
				if (cSettingType == "multiSelect") vContent.value = pDocument.system[cModuleName][cFlag]; //special quirk of multi-select dom
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