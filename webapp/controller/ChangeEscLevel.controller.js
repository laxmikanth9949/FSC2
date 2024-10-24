sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/odata/v2/ODataModel'
], function (Controller, formatter, MessageToast, Filter, JSONModel, ODataModel) {
	"use strict";

	return Controller.extend("sap.support.fsc2.controller.ChangeEscLev", {
		formatter: formatter,
		onInit: function () {
			this.onCloseInputSuggest();
			this.setModel(new JSONModel(), "ChangeEscLevel");
			this.getRouter().getRoute("ChangeEscLevel").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			var oArgs = oEvent.getParameter("arguments");
			this.sID = oArgs.cimId;
			this.transType = oArgs.transType;
			if (!this.getModel("CIMRequest")) {
				this.getRouter().navTo("requestDetail", {
					id: oArgs.cimId,
					transType: this.transType
				});
				return;
			}
			this.initObj = {
				"bEdit": true,
				"RequestReason": "",
				"BusImpCust": "",
				"BusImpSAP": ""
			};
			this.getModel("ChangeEscLevel").setData(this.initObj);
			var sStep1 = this.getView().byId("Step1");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep1);
			this.getView().byId("Step1").setValidated(false);
			this.getView().byId("Step2").setValidated(false);
			this.getView().byId("Step3").setValidated(false);
		},

		onSubmit: function () {
			this.getView().byId("sendChangeEsc").setEnabled(false);
			this.getView().setBusy(true);
			this.eventUsage(false, "Create an Activity in MCC SOS app");
			this.eventUsage(false, "Change Escalation Level Request");
			var IncidentDetail = this.getModel("incidentDetail").getData();
			var oCIMDetail = this.getModel("CIMRequest").getData();
			var oChangLevDetail = this.getModel("ChangeEscLevel").getData();
			var sDesc = "Customer: " + IncidentDetail.CustomerName + "\n" + "Incident No: " + IncidentDetail.ID + "\n" +
				"ServiceNow Escalation: " +
				oCIMDetail.object_id + "\n" + "Request Reason: " + oChangLevDetail.RequestReason + "\n" + "Business Impact for Customer: " +
				oChangLevDetail.BusImpCust + "\n" + "Business Impact for SAP: " + oChangLevDetail.BusImpSAP;

			var oEntry = {
				"CustomerNo": IncidentDetail.CustomerNo,
				"CustomerName": IncidentDetail.CustomerName,
				"IncidentNum": IncidentDetail.ID,
				"RequestDesc": sDesc,
				"Description": "Request to change escalation level", //i18n this I338673
				"TransType": "ZS46"

			};
			sap.support.fsc2.FSC2Model.create("/FSC2RequestSet", oEntry, {
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oResponceData) {
					var sActivity_ID = oResponceData.ID;
					this.addSnowNotes(sActivity_ID);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.getView().byId("sendChangeEsc").setEnabled(true);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		navToDetailAfterCreation: function (sActivity_ID) {
			var that = this;
			this.getView().byId("sendChangeEsc").setEnabled(true);
			this.getView().setBusy(false);
			sap.m.MessageBox.success("Created Successfully: " + sActivity_ID +
				"\n We will review your request and respond to you within 1 hour.", {
					onClose: function () {
						that.onNavToCriticalRequest("ZS46",sActivity_ID, "", 2);
					}
				});
		},
		addSnowNotes: function (sActivity_ID) {
			var sUserID = this.getModel("CurrentUserInfo").getProperty("/UserID");
			
			var obj_Snow = {
				"u_comments": "[code]" + "User requested to change escalation level. Please check activity " + sActivity_ID +
					" for the request detail as well as the judgement of the CCT." + "[code]",
				"u_last_user_updated_by": sUserID,
				"sys_target_sys_id": this.sID
			};
			$.ajax({
				method: "POST",
				headers: {
					'AppIdentifier': "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO" //API Management: ID for MCC SOS App
				},
				data: JSON.stringify(obj_Snow),
				contentType: "application/json",
				url: sap.support.fsc2.servicenowEscalationUrlCreateApi, //= sys_id
				success: function () {
					this.navToDetailAfterCreation(sActivity_ID);
				}.bind(this),
				error: function (oError) {
					this.showErrorMessage(oError);
					this.getView().byId("sendChangeEsc").setEnabled(true);
					this.getView().setBusy(false);
				}.bind(this)
			});
			
			/*
				old api that works but doesnt propagate to other systems correctly
				var obj_Snow = {
					"work_notes": "User requested to change escalation level. Please check activity " + sActivity_ID +
						" for the request detail as well as the judgement of the CCT.",
					"sys_updated_by": sUserID
				};
				$.ajax({
					method: "PATCH",
					data: JSON.stringify(obj_Snow),
					contentType: "application/json",
					url: sap.support.fsc2.servicenowEscalationUrl + "/" + this.sID, //= sys_id
					success: function () {
					}.bind(this),
					error: function (oError) {
					}.bind(this)
				});
			*/
		},
		onReview: function () {
			this.getModel("ChangeEscLevel").setProperty("/bEdit", false);
		},
		onCancelSubmit: function () {
			this.getModel("ChangeEscLevel").setData({
				"bEdit": true,
				"RequestReason": "",
				"BusImpCust": "",
				"BusImpSAP": ""
			});
			this.onEditStep1();
		},
		onEditStep1: function () {
			this.getModel("ChangeEscLevel").setProperty("/bEdit", true);
			var sStep1 = this.getView().byId("Step1");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep1);
		},
		onEditStep2: function () {
			this.getModel("ChangeEscLevel").setProperty("/bEdit", true);
			var sStep2 = this.getView().byId("Step2");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep2);
		},
		onEditStep3: function () {
			this.getModel("ChangeEscLevel").setProperty("/bEdit", true);
			var sStep3 = this.getView().byId("Step3");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep3);
		},
		onActivateStep1: function (oEvent) {
			var sRequestReason = this.getModel("ChangeEscLevel").getProperty("/RequestReason");
			if (!sRequestReason) {
				this.getView().byId("Step1").setValidated(false);
			} else {
				this.getView().byId("Step1").setValidated(true);
			}
		},
		onActivateStep2: function () {
			var oData = this.getModel("ChangeEscLevel").getData();
			if (oData.BusImpCust) {
				this.getView().byId("Step2").setValidated(true);
			} else {
				this.getView().byId("Step2").setValidated(false);
			}
		},
		onActivateStep3: function (oEvent) {
			var oData = this.getModel("ChangeEscLevel").getData();
			if (oData.BusImpSAP) {
				this.getView().byId("Step3").setValidated(true);
			} else {
				this.getView().byId("Step3").setValidated(false);
			}
		}

	});
});