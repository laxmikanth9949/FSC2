/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	"sap/ui/core/Fragment",
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, ODataModel, models, Fragment) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.iocRequest", {

		onInit: function () {
			this.getRouter().getRoute("ioc").attachPatternMatched(this._onRouteMatched, this);

			var oModel = new JSONModel({
				HTML: "<h3><p>The IOC SWAT judgement request form has been moved from the MCC SOS App to the ServiceNow Service Portal. You can access it <a href=\"https://itsm.services.sap/sp?id=sc_cat_item&table=sc_cat_item&sys_id=733c9fc91b71619436ac10e69b4bcb24\" style=\"font-weight:600;\"> here</a>." +
					" Kindly update your bookmarks accordingly. In case of questions, do not hesitate to contact us at <a href=\"mailto:swat_ioc_comms@global.corp.sap\" style=\"font-weight:600;\">swat_ioc_comms@global.corp.sap</a>. Your MCC IOC SWAT Team </p></h3>"
			});
			this.getView().setModel(oModel);
		},

		// onInit: function () {
		// 	var oLoBs = new JSONModel();
		// 	this.setModel(oLoBs, "LoBs");
		// 	oLoBs.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/model/LoBs.json"), {}, false);
		// 	var oForm = new JSONModel();
		// 	oForm.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		// 	this.setModel(oForm, "iocForm");
		// 	oForm.setData({
		// 		"summary": "Title of the Incident5",
		// 		"severity": "critical",
		// 		"source": "MCC SOS Red Phone Webform",
		// 		"custom_details": {
		// 			"Caller": this.getModel("CurrentUserInfo").getProperty("/UserName") + " (" + this.getModel("CurrentUserInfo").getProperty(
		// 				"/UserID") + ")",
		// 			"Affected LoB(s)": "", //add key1 later
		// 			"Separate IOC SWAT judgement call needed?": "No. The technical bridge call can be used for IOC SWAT judgement.",
		// 			"LoB\GCSrepresentatives to invite to IOC SWAT judgement call": this.getModel("CurrentUserInfo").getProperty("/UserID")
		// 		}
		// 	});
		// 	//set the ke1 value of new incident form
		// 	this._set_date();

		// 	var oIncidentDetail = new JSONModel();
		// 	this.setModel(oIncidentDetail, "incidentDetail");
		// 	oIncidentDetail.setProperty("/infoMessage",
		// 		'With this web form you can activate the Integrated Outage Communication (IOC) SWAT Judgement process. Kindly use this feature for Major Cloud Service Disruption or Degradation candidates only (see criteria above). More information on IOC can be found ' +
		// 		'<a target="_blank" href="http://' +
		// 		'jam4.sapjam.com/groups/ETwikHW54BLQhu6l7VAdUe/overview_page/cIw6RbvNdcpNsNwUOK5l7X">here</a>.');

		// },
		/**
		 * gets or sets the "PD_RP_sid" cookie which is unique for the session
		 * it is used to group incidents in pagerduty
		 */
		_set_date: function () {
			var date = new Date();
			var currentDate = date.toISOString();
			var cookie_value_sid = this.getCookieValue("PD_RP_sid");
			var oForm = this.getModel("iocForm");
			if (cookie_value_sid !== "") {
				// choose if you want to use the old date or current one
				this._confirm_cookie(currentDate);
			} else {
				oForm.setProperty("/custom_details/key1", currentDate);
			}
		},
		/**
		 * dialogue asking the user if wants to group his new incident with the old one
		 * @param {string} sDate - the time stamp is used to identify the session 
		 */
		_confirm_cookie: function (sDate) {
			var oDialog = new sap.m.Dialog({
				title: 'Confirm',
				type: 'Message',
				content: new sap.m.Text({
					text: 'An IOC SWAT judging request has already been sent.\n Do you want to update the existing request?'
				}),
				beginButton: new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: 'Update Existing Request',
					press: function () {
						// use the old date as key1 value
						var oForm = this.getView().getModel("iocForm");
						oForm.setProperty("/custom_details/key1", this.getCookieValue("PD_RP_sid"));
						//sap.m.MessageToast.show('Submit pressed!');
						oDialog.close();
					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: 'Create New Request',
					press: function () {
						// use the current date as key1 value
						var oForm = this.getView().getModel("iocForm");
						oForm.setProperty("/custom_details/key1", sDate);
						oDialog.close();
					}.bind(this)
				}),
				afterClose: function () {
					oDialog.destroy();
				}
			});
			oDialog.open();
		},
		_onRouteMatched: function (sChanel, sEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
		},
		onPressLoB: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("LoBs").sPath;
			var oBindingContext = this.getView().getModel("LoBs").getProperty(sPath);
			var sLoB = oBindingContext.text;
			var oIocForm = this.getView().getModel("iocForm");
			var sFormatedLoBs = oIocForm.getProperty("/custom_details/Affected LoB(s)");

			sFormatedLoBs = sFormatedLoBs.replaceAll("|" + sLoB, "");
			sFormatedLoBs = sFormatedLoBs.replaceAll(sLoB + "|", "");
			sFormatedLoBs = sFormatedLoBs.replaceAll(sLoB, "");
			if (oEvent.mParameters.pressed) {
				if (sFormatedLoBs == "") {
					sFormatedLoBs += sLoB;
				} else {
					sFormatedLoBs += "|" + sLoB;
				}
				this.getView().byId("lobInput").setValueState("None");
			}
			oIocForm.setProperty("/custom_details/Affected LoB(s)", sFormatedLoBs);

		},

		separateCallChanged: function (oEvent) {
			var sChoice = oEvent.getSource().getSelectedButton().getText();
			var form = this.getView().getModel("iocForm");
			form.setProperty("/custom_details/Separate IOC SWAT judgement call needed?", sChoice);
			if (sChoice.includes('Yes')) {
				this.getView().byId("inviteForJudging").setVisible(true);
				this.getView().byId("inviteForJudginglabel").setVisible(true);
			} else {
				this.getView().byId("inviteForJudging").setVisible(false);
				this.getView().byId("inviteForJudginglabel").setVisible(false);
			}
		},
		_checkMandatoryFields: function () {
			var bSubmit = true;
			var lobs = this.getModel("iocForm").getProperty("/custom_details/Affected LoB(s)");
			if (!lobs || lobs === "") {
				this.getView().byId("lobInput").setValueState("Error");
				bSubmit = false;
			}

			var bridgeLink = this.getModel("iocForm").getProperty("/custom_details/Technical bridge call link");
			if (!bridgeLink || bridgeLink === "") {
				this.getView().byId("bridgeLink").setValueState("Error");
				bSubmit = false;
			}
			return bSubmit;
		},
		onSubmitIncident: function (oEvent) {

			if (this._checkMandatoryFields()) {
				this._displayLoadingDialogue();
				// remove	this.getView().byId("BlockLayout").setVisible(true);
				this.getView().byId("createIocForm").setVisible(false);
				this.getView().byId("informationGrid").setVisible(false);
				this.getView().byId("iocFooterBar").setVisible(false);
				this.getView().byId("iocInfoBottom").setVisible(false);
				this._submit_incident();
			}

		},
		_submit_incident: function () {
			var dateSubmitted = new Date().toISOString();
			this.getView().getModel("iocForm").setProperty("/custom_details/key1", dateSubmitted);
			var body = {
				"payload": this.getView().getModel("iocForm").getData(),
				"event_action": "trigger"
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(body),
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				contentType: "application/json",
				url: "/ext_pd_events/v2/enqueue",
				success: function (data) {
					this.getView().byId("createIocForm").setVisible(false);
					this.setCookieValue("PD_RP_sid", this.getModel("iocForm").getProperty("/custom_details/key1"), 3600);
					this._loadIncidentDetail(data.dedup_key);
				}.bind(this),
				error: function (oError) {
					this.getView().byId("errorCell").setVisible(true);
					//	this.getView().byId("resultsrow").setBusy(false);
					this._oBusyDialog.close();
				}.bind(this)
			});
		},
		/**
		 * loads incident details containing id using dedupkey 
		 * @param {string} dedupkey - incident id 
		 */
		_loadIncidentDetail: function (dedupkey) {
			this.fetchIocRequest(dedupkey).then(function (oData) {
				//sap.m.MessageToast.show(JSON.stringify(oData));
				this._updateIncidentStatus(oData);
			}.bind(this)).catch(function (oData) {
				//	this.getView().byId("resultsrow").setBusy(false);
				this._oBusyDialog.close();
				this.getView().byId("errorCell").setVisible(true);
				//	this.getView().getModel("incidentDetail").setProperty("/block2", "Failed to create Incident")
			}.bind(this));
		},
		/**      
		 * updates the view through incidentDetail model  
		 * @param {object} oData - incident detail        
		 */
		_updateView: function (oData, success) {
			if (success) {
				var oForm = this.getModel("iocForm");
				var key1 = oForm.getProperty("/custom_details/key1");
				var block1 = "Your user-ID is " + this.getModel("CurrentUserInfo").getProperty("/UserID");
				block1 += "\nID number: " + key1;
				block1 += "\nYour request has been sent to MCC IOC team.";

				var incidentDetail = this.getView().getModel("incidentDetail");
				incidentDetail.setData({
					"block1": block1
				});

				var sSeparateCall = oForm.getProperty("/custom_details/Separate IOC SWAT judgement call needed?");
				var sBridgeCall =
					"The OEL will create a separate bridge call and invite for the call. IOC SWAT judging will be performed in a separate call.";

				var incidentLink = "http://";
				if (sap.support.fsc2.Landscape === "p") {
					incidentLink += "sap.pagerduty.com/incidents/";
				} else {
					incidentLink += "sap-sandbox.pagerduty.com/incidents/";
				}
				incidentLink += oData.incidents[0].id;

				var successMessage = 'Your request has been successfully processed (PagerDuty incident ' +

					'<a target="_blank" href="' + incidentLink + '">' + oData.incidents[0].id + '</a>). ';

				if (sSeparateCall.includes('Yes')) {
					incidentDetail.setProperty("/sBridgeCall", sBridgeCall);
					successMessage += "The SAP MCC Outage Escalation Lead (OEL) will schedule a separate call for the IOC SWAT judgement.";
				} else {
					sBridgeCall = "The OEL will join the technical bridge call and perform the IOC SWAT judging in this call with you";
					incidentDetail.setProperty("/sBridgeCall", sBridgeCall);
					successMessage +=
						"The SAP MCC Outage Escalation Lead (OEL) will join the technical bridge call and trigger the IOC SWAT judgement.";
				}

				incidentDetail.setProperty("/successMessage", successMessage);

				//	this.getView().byId("resultsrow").setBusy(false);
				this._oBusyDialog.close();
				this.getView().byId("BlockLayout").setVisible(true); //added
				incidentDetail.setProperty("/incidentId", oData.incidents[0].id);
				incidentDetail.setProperty("/link", "https://" + "sap-sandbox.pagerduty.com/incidents/" + oData.incidents[
					0].id);

				this.getView().byId("successCell").setVisible(true);
			} else {
				this.getView().byId("errorCell").setVisible(true);
			}

		},

		/**
		 * updates incident status which makes it appear in the "Status" dashboard
		 * @param {string} sId - incident id - not same as dedupkey
		 */
		_updateIncidentStatus: function (oData) {
			var sId = oData.incidents[0].id;
			//update status message
			var sLoBs = this.getView().getModel("iocForm").getProperty("/custom_details/Affected LoB(s)");
			var statusMessage = {
				// "message": "IOC SWAT judgement request submitted via the MCC SOS App and forwarded to OEL on duty."
				"message": `IOC SWAT judgement request for ${sLoBs} submitted via the MCC SOS App and forwarded to OEL on duty.`
			};
			$.ajax({
				method: "POST",
				data: JSON.stringify(statusMessage),
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				contentType: "application/json",
				url: "/ext_pd_api/incidents/" + sId + "/status_updates", //= sys_id
				success: function (data) {
					//sap.m.MessageToast.show(JSON.stringify(data));
					//console.log("status set correctly")
					this._updateView(oData, true);
				}.bind(this),
				error: function (oError) {
					this._oBusyDialog.close();
					this._updateView(oData, false);

				}.bind(this)
			});
		},

		onClearAll: function () {
			//get form model
			//reset form model
			var oForm = this.getModel("iocForm");
			oForm.setData({
				"summary": "Title of the Incident5",
				"severity": "critical",
				"source": "MCC SOS Red Phone Webform",
				"custom_details": {
					"Caller": this.getModel("CurrentUserInfo").getProperty("/UserName") + " (" + this.getModel("CurrentUserInfo").getProperty(
						"/UserID") + ")",
					"Affected LoB(s)": "", //add key1 later
					"Separate IOC SWAT judgement call needed?": "No. The technical bridge call can be used for IOC SWAT judgement.",
					"LoB\GCSrepresentatives to invite to IOC SWAT judgement call": this.getModel("CurrentUserInfo").getProperty("/UserID")
				}
			});
			this.getView().byId("rbg4").setSelectedIndex(0);
			this.getView().byId("rbg4").fireSelect({
				"selectedIndex": 0
			}); //reset the "separate ioc call" radios
			this.getView().byId("lobButtons").getItems().forEach(function (tButton) { //depress the lob buttons
				tButton.setPressed(false);
			});
		},
		handleCancel: function () {
			this.onNavToDashboard();
		},
		_displayLoadingDialogue: function () {
			if (!this._oBusyDialog) {
				Fragment.load({
					name: "sap.support.fsc2.view.fragments.iocLoading",
					controller: this
				}).then(function (oFragment) {
					this._oBusyDialog = oFragment;
					this.getView().addDependent(this._oBusyDialog);
					//syncStyleClass("sapUiSizeCompact", this.getView(), this._oBusyDialog);
					this._oBusyDialog.open();
					//this.simulateServerRequest();
				}.bind(this));
			} else {
				this._oBusyDialog.open();
				//this.simulateServerRequest();
			}
		},
		onChange: function (oEvent) {
			var oForm = this.getModel("iocForm");
			//var oData = this.getModel("createCriticalSituation").getData();
			var SDesc = $.trim(oEvent.getSource().getValue());
			if (SDesc !== "") {
				oEvent.getSource().setValueState("None")
					//this.getView().byId("idDesc").setValueState("None");
			}
		},

	});
});