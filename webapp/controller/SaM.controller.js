sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/odata/v2/ODataModel'
], function (Controller, formatter, MessageToast, Filter, JSONModel, ODataModel) {
	"use strict";

	return Controller.extend("sap.support.fsc2.controller.SaM", {
		formatter: formatter,
		onInit: function () {
			this.onCloseInputSuggest();
			this.setModel(new JSONModel(), "SaM");
			this.setModel(new JSONModel(), "SaMDateTree");
			if (!sap.support.fsc2.oDataW7SAERequestModel) {
				var sUrl = sap.ui.require.toUrl("sap/support/fsc2") + "/w71/sap/opu/odata/SVT/SAE_SRV/";
				sap.support.fsc2.oDataW7SAERequestModel = new ODataModel(sUrl, {
					json: true,
					useBatch: false
				});

				var sUrl2 = sap.ui.require.toUrl("sap/support/fsc2") + "/w72/sap/opu/odata/SVT/SAE_SRV/";
				sap.support.fsc2.oDataW7SAERequestModel2 = new ODataModel(sUrl2, {
					json: true,
					useBatch: false
				});
			}
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/template/TimeZone.json")), "TimeZone");
			var oRouter = this.getRouter();
			oRouter.getRoute("SaM").attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function (oEvent) {
			//does nothing
			if (this.getView().getParent().getPages().length > 1) {
				var thisView = this.getView().getId();
				this.getView().getParent().getPages().forEach(function (page) {
					if (page.getId() !== thisView) {
						this.getView().getParent().removePage(page.getId());
					}
				}.bind(this));
			}
			var oArgs = oEvent.getParameter("arguments");
			this.sID = oArgs.incident;
			this.ExpertArea = oArgs.earea;
			this.initObj = {
				"SamContact": "",
				"SamPhone": "666",
				"SamEmail": "",
				"SamcProcessing": false,
				"SaMcLackResponse": false,
				"SaMcNoProcessor": false,
				"SaMcCriticalIssue": false,
				"SaMcCommunication": false,
				"SaMcOther": false,
				"SaMOtherInput": "",
				"SaMAdditionalInfo": "",
				"bEdit": true,
				"requestReasonTxt": "",
				"bEditContact": false,
				"selectedDate": "",
				"selectedTimeSlot": "", //time with current timezone
				"selectedUTCtime": "" //time with UTC timezone
			};
			this.getModel("SaM").setData(this.initObj);
			//prefil info that we already know
			var that = this;
			var promise = new Promise(function (resolve, reject) {
				var oUser = that.getOwnerComponent().getModel("CurrentUserInfo").getData();
				var oUserModel = new sap.ui.model.json.JSONModel();

				// load external JSON file
				oUserModel.loadData(sap.support.fsc2.AppUrl + "sap/ui5/1/resources/sapit/sapitapi/user-info/" + oUser.UserID);
				oUserModel.attachRequestCompleted(function () {
					resolve(oUserModel.getData());
				});
			});
			promise.then(function (uData) {
				var officePhone = uData.contactInfo.officePhone;
				var mobilePhone = uData.contactInfo.mobilePhone;
				var SamEmail = uData.email;

				var SamContact = uData.firstName + " " + uData.lastName;
				that.getModel("SaM").setProperty("/SamPhone", mobilePhone || officePhone || "");
				that.getModel("SaM").setProperty("/SamContact", SamContact);
				that.getModel("SaM").setProperty("/SamEmail", SamEmail);
			});

			var sStep1 = this.getView().byId("Step1").getId();
			this.getView().byId("ScheduleWizard").goToStep(sStep1); //.goToStep(this.getView().byId("Step1"));//setCurrentStep
			this.getView().byId("Step1").setValidated(false);
			this.getView().byId("Step2").setValidated(false);
			this.getView().byId("Step3").setValidated(false);

			var oWizard = this.byId("ScheduleWizard");
			var oFirstStep = oWizard.getSteps()[0];
			oWizard.discardProgress(oFirstStep);
			this.getUTCDateTime();
			this.loadDateHeaderSet();
			// this.loadTimeZone();
		},
		
		loadDateHeaderSet: function (attempt) {
			var serviceUrl = attempt === 1 ? sap.ui.require.toUrl("sap/support/fsc2") + "/w71/odata/incidentws/" : sap.ui.require.toUrl("sap/support/fsc2") + "/w72/odata/incidentws/";
			this.oDateTree = {
				"results": []
			};
			var sTimeZone = this.getModel("homePageConfig").getProperty("/TimeZone");
			
			// testing path: /SaM/MidColumnFullScreen/incident=002075129500004011572022&earea=MCC
			var oDataI7P = new ODataModel(serviceUrl, {
				json: true,
				useBatch: false
			});
			oDataI7P.read("/ChannelCheckSet", {
				filters: [
					new Filter("IncidentID", "EQ", this.sID),
					new Filter("ChannelType", "EQ", "SAM"),
					new Filter("Details", "EQ", this.ExpertArea),
				],
				success: function (oResponse) {
					var oTreeParent = [];
					var obj = {};

					if (oResponse.results.length > 0) {
						let aData = oResponse.results[0];
						let oSlot = JSON.parse(aData.Slots);
						
						oSlot.DAYS.forEach((slot, index) => {
							obj = {
								"index": index,
								"desc": formatter.formatDate8Desc(slot.Date) + ", " + slot.WeekDay,
								"date": slot.Date,
								"weekDay": slot.WeekDay,
								"level1": true,
								"slotNum": slot.Count ? slot.Count : 0,
								"timeSlot": []
							}
							if (slot.Count > 0) {
								slot.SLOTS.forEach((item) => {
									obj.timeSlot.push({
										"desc": formatter.TimeTransToAmPm(item.StartTime),
										"time24H": item.StartTime,
										"UTCTimeStamp": item.TimeStamp,
										"level1": false
									})
								})
							}
							oTreeParent.push(obj);
						})
					}
					this.oDateTree.results = oTreeParent.filter((item) => item.slotNum > 0);
					this.getModel("SaMDateTree").setData(this.oDateTree);
				}.bind(this),
				error: function (error) {
					this.loadDateHeaderSet(2);
					sap.m.MessageToast.show("ChannelCheckSet service unavailable");
				}.bind(this)
			});
		},

		onReview: function () {
			this.getModel("SaM").setProperty("/bEdit", false);
		},
		onCancel: function () {
			this.getModel("SaM").setProperty("/bEdit", true);
			this.onNavBack();
		},
		onCancelSubmit: function () {
			this.getModel("SaM").setData({
				"SamContact": "",
				"SamPhone": "",
				"SamEmail": "",
				"SamcProcessing": false,
				"SaMcLackResponse": false,
				"SaMcNoProcessor": false,
				"SaMcCriticalIssue": false,
				"SaMcCommunication": false,
				"SaMcOther": false,
				"SaMOtherInput": "",
				"SaMAdditionalInfo": "",
				"bEdit": true,
				"requestReasonTxt": "",
				"bEditContact": false,
				"selectedDate": "",
				"selectedTimeSlot": "",
				"selectedUTCtime": ""
			});
			this.onEditStep1();
		},
		onEditStep1: function () {
			this.getModel("SaM").setProperty("/bEdit", true);
			var sStep1 = this.getView().byId("Step1");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep1);
		},
		onEditStep2: function () {
			this.getModel("SaM").setProperty("/bEdit", true);
			var sStep2 = this.getView().byId("Step2");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep2);
		},
		onEditStep3: function () {
			this.getModel("SaM").setProperty("/bEdit", true);
			var sStep3 = this.getView().byId("Step3");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep3);
		},
		onEditStep4: function () {
			this.getModel("SaM").setProperty("/bEdit", true);
			var sStep4 = this.getView().byId("Step4");
			this.getView().byId("ScheduleWizard").setCurrentStep(sStep4);
		},
		onActivateStep1: function (oEvent) {
			var selectedTime = this.getModel("SaM").getProperty("/selectedTimeSlot");
			if (!selectedTime) {
				this.getView().byId("Step1").setValidated(false);
			} else {
				this.getView().byId("Step1").setValidated(true);
			}
		},
		onActivateStep2: function () {
			var oData = this.getModel("SaM").getData();
			if (oData.SamContact && oData.SamPhone && oData.SamEmail) {
				this.getView().byId("Step2").setValidated(true);
			} else {
				this.getView().byId("Step2").setValidated(false);
			}
		},
		onActivateStep3: function (oEvent) {
			var oData = this.getModel("SaM").getData();
			if (oData.SamcProcessing || oData.SaMcLackResponse || oData.SaMcNoProcessor || oData.SaMcCriticalIssue || oData.SaMcCommunication ||
				oData.SaMcOther) {
				this.getView().byId("Step3").setValidated(true);
			} else {
				this.getView().byId("Step3").setValidated(false);
			}
		},
		onOpenDialog_TimeZone: function () {
			if (!this._oTimeZoneDialog) {
				this._oTimeZoneDialog = new sap.ui.xmlfragment("TimeZoneFragId", "sap.support.fsc2.view.fragments.TimeZoneSelection", this);
			}
			this.getView().addDependent(this._oTimeZoneDialog);
			this._oTimeZoneDialog.open();
		},
		onSelectTimeZone: function (oEvent) {
			var sTimeZone = oEvent.getSource().getSelectedItem().getBindingContext("TimeZone").getObject().key;
			this.getModel("homePageConfig").setProperty("/TimeZone", sTimeZone);
			var oTimeZoneEntry = {
				"Attribute": "TIME_ZONE",
				"Value": sTimeZone
			};
			sap.support.fsc2.UserProfileModel.create("/Entries", oTimeZoneEntry);
			this._oTimeZoneDialog.close();
			this.loadDateHeaderSet();
		},
		onCacelTimeZoneSelect: function () {
			this._oTimeZoneDialog.close();
		},
		onSearchTimeZone: function (oEvent) {
			var sValue = oEvent.getSource().getValue().trim();
			var sTimeZoneList = sap.ui.core.Fragment.byId("TimeZoneFragId", "TimeZoneList");
			var sFilter1 = new Filter("ID", "Contains", sValue);
			var sFilter2 = new Filter("Desc", "Contains", sValue);
			var sFilter = new Filter({
				filters: [sFilter1, sFilter2],
				and: false
			});
			sTimeZoneList.getBinding("items").filter(sFilter);
		},
		onSubmit: function (oEvent, attempt) {
			attempt = attempt || 1;
			var service = attempt === 1 ? sap.support.fsc2.oDataW7SAERequestModel : sap.support.fsc2.oDataW7SAERequestModel2;
			var that = this;
			this.getView().setBusy(true);
			this.eventUsage(false, "Create a SaM record in MCC SOS app");
			var oSaMDetail = this.getModel("SaM").getData();
			var oEntityDetail = {
				"AppInfo": "MCC",
				"SamAction": "insert",
				"SamContact": oSaMDetail.SamContact,
				"SamPhone": oSaMDetail.SamPhone,
				"SamEmail": oSaMDetail.SamEmail,
				"SamcProcessing": oSaMDetail.SamcProcessing,
				"SaMcLackResponse": oSaMDetail.SaMcLackResponse,
				"SaMcNoProcessor": oSaMDetail.SaMcNoProcessor,
				"SaMcCriticalIssue": oSaMDetail.SaMcCriticalIssue,
				"SaMcCommunication": oSaMDetail.SaMcCommunication,
				"SaMcOther": oSaMDetail.SaMcOther,
				"SaMOtherInput": oSaMDetail.SaMOtherInput,
				"SaMAdditionalInfo": oSaMDetail.SaMAdditionalInfo
			};
			var oEntityDetailStr = JSON.stringify(oEntityDetail);
			// var sSamStartTime = oSaMDetail.selectedDate + oSaMDetail.selectedTime.replace(":", "") + "00";
			//Timezone convert time to UTC
			// var sCurrentTimezone = this.getModel("homePageConfig").getProperty("/TimeZone");
			// var sOffset = formatter.formatTimeOffset(sCurrentTimezone);
			// sSamStartTime = formatter.formatDateToUTC(sSamStartTime,sOffset);               
			//--------
			var oEntity = {
				"AppSource": "MCC",
				"IncidentRef": this.sID,
				"SamDuration": 15,
				"SamInfo": oEntityDetailStr, //JSON.stringify(oEntityDetail),
				"SamStartTime": oSaMDetail.selectedUTCtime, //sSamStartTime,
				"SamStatus": "E0001"
			};
			//does this work? we dont know
			
			service.create("/SaMBookingSet", oEntity, {
				success: function (oData, sResponse) {
					var sError = false; //default create success
					var sMsg = sResponse.headers["sap-message"];
					var sErrorMsg = "";
					if (sMsg) {
						sError = JSON.parse(sMsg).severity === "error" ? true : false;
						sErrorMsg = JSON.parse(sMsg).message;
					}
					that.getView().setBusy(false);
					if (!sError) {
						sap.m.MessageBox.success("Your session has been successfully created.", {
							title: "Success",
							onClose: function () {
								that.getRouter().navTo("incidentEnd", {
									layout: "EndColumnFullScreen",
									id: that.sID,
									flag: false,
									sam: true
								});
							}
						});
					} else {
						sap.m.MessageBox.error(sErrorMsg, {
							"title": "Error"
						});
					}

				}.bind(this),
				error: function (error) {
					that.getView().setBusy(false);

					if (attempt === 1) {
						sap.m.MessageToast.show("SaMBookingSet service unavailable");
						this.onSubmit(attempt = 2);
					} else {
						sap.m.MessageToast.show("SaMBookingSet service 2 unavailable");
					}
				}.bind(this)
			});

		},

		onSelectDateTime: function (oEvent) {
			var selectedItem = oEvent.getSource().getSelectedItem().getBindingContext("SaMDateTree");
			var sPath = oEvent.getSource().getSelectedItem().getBindingContext("SaMDateTree").getPath();
			var sTime = selectedItem.getObject().desc;
			var sTime24H = selectedItem.getObject().time24H;
			// var PartentPath = sPath.substr(9, sPath.indexOf("/timeSlot") - 8);
			var PartentPath = sPath.split("/")[2];
			PartentPath = parseInt(PartentPath);
			var oDataTree = this.getModel("SaMDateTree").getData();
			// var oDataSaM = this.getModel("SaM").getData();
			var sTimeZone = this.getModel("homePageConfig").getProperty("/TimeZone");
			var sDateObj = oDataTree.results[PartentPath];
			if (!sDateObj) {
				this.getModel("SaM").setProperty("/selectedDate", "");
				this.getModel("SaM").setProperty("/selectedTimeSlot", "");
				this.getModel("SaM").setProperty("/selectedTime", "");
				this.getModel("SaM").setProperty("/selectedUTCtime", "");
				this.onActivateStep1();
				return;
			}
			// var sDate = sDateObj.date;
			var sDate = formatter.formatDate8Desc(sDateObj.date) + ", " + sDateObj.weekDay;
			// var selectedTime = sDateObj.weekDay + " at " + sTime + " " + sTimeZone;
			var selectedTime = sTime + " " + sTimeZone;
			this.getModel("SaM").setProperty("/selectedDate", sDate);
			this.getModel("SaM").setProperty("/selectedTimeSlot", selectedTime);
			this.getModel("SaM").setProperty("/selectedTime", sTime24H);
			this.getModel("SaM").setProperty("/selectedUTCtime", selectedItem.getObject().UTCTimeStamp);
			this.onActivateStep1();
		},
		checkSelectedZone: function (sKey, sZone) {
			if (sKey === sZone) {
				return true;
			} else {
				return false;
			}
		},
		getUTCDateTime: function () { // import new Date(), export the Date time UTC DateTime + 2 Hours as format yyyyMMddHH
			// var sDate = new Date();//current DateTime + 2hours --->convert to utc datetime
			var sNowDate = new Date().getTime();
			var offset = 2 * 60 * 60 * 1000; //2 hours
			var sNewDate = new Date(sNowDate + offset);
			var sYear = sNewDate.getUTCFullYear();
			var sMonth = sNewDate.getUTCMonth() + 1;
			var sDate = sNewDate.getUTCDate();
			var sHour = sNewDate.getUTCHours();
			var sMin = sNewDate.getUTCMinutes();
			var sSecond = sNewDate.getUTCSeconds();
			var DateString = sYear + this.formatLength2(sMonth) + this.formatLength2(sDate) + this.formatLength2(sHour) + this.formatLength2(
					sMin) +
				this.formatLength2(sSecond);
			this.sUTCDateTime = DateString;
		},
		formatLength2: function (sNum) {
			var sValue = "";
			if (!sNum || sNum === 0) {
				sValue = "00";
			} else if (sNum && sNum < 10) {
				sValue = "0" + sNum;
			} else {
				sValue = sNum.toString();
			}
			return sValue;
		}

	});
});