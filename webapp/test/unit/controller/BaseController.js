sap.ui.require([
	"sap/support/fsc2/controller/BaseController",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/support/fsc2/model/formatter",
	"sap/m/Table",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (BaseController, ManagedObject, JSONModel, ODataModel, formatter, Table) {
	"use strict";
	QUnit.module("BaseController", {
		beforeEach: function () {
			this.oBaseControl = new BaseController();
			//hotfix branch comment 
			//hotfix branch comment 
			// this.oComponent = new ManagedObject();
			this.oComponent = new sap.ui.core.Component();
			this.oComponent.setModel(new JSONModel(), "createCriticalSituation");
			this.oComponent.setModel(new JSONModel(), "incidentList");
			this.oComponent.setModel(new JSONModel(), "selectedIncidentList");
			this.oComponent.setModel(new JSONModel({
				"bEnable": true
			}), "EnableSnowCase");
			sinon.stub(this.oBaseControl, "getOwnerComponent").returns(this.oComponent);
			this.oIncidentSetModel = new JSONModel();
			this.oIncidentSetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentSet.json"), {}, false);
			var oView = {
				byId: function (sId) {},
				setBusy: function () {},
				addDependent: function () {}
			};
			sinon.stub(this.oBaseControl, "getView").returns(oView);
			// sinon.stub(this.oBaseControl, "getModel");
			// sinon.stub(this.oBaseControl, "setModel");
			// sinon.stub(this.oBaseControl, "eventUsage");
			this.oComponent.setModel(new JSONModel({
				"defaultCustName": "",
				"defaultCustNo": "",
				"defaultCase": "20000972",
				"enableSaM": "",
				"TimeZone":""
			}), "homePageConfig");
			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n"
			});
			this.oComponent.setModel(i18nModel, "i18n");
			this.oStubMsgBoxShow = sinon.stub(sap.m.MessageBox, "show");
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
			});
			this.FSC2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			sap.support.fsc2.UserProfileModel = new ODataModel({
				json: true,
				useBatch: true,
				serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
			});
			this.UserProfileRead = sinon.stub(sap.support.fsc2.UserProfileModel, "read");
			this.UserProfileCreate = sinon.stub(sap.support.fsc2.UserProfileModel, "create");
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "sap/opu/odata/SVC/SID_GATEWAY_SRV"
			});
			this.IncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");
			sap.git = {
				"usage": {
					"Reporting": {
						addEvent: function () {}
					}
				}
			};
			var oFavModel = new JSONModel({
				"Customer": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"Situation": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"BCIncident": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"SnowCase": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"Incident": {
					"count": "0",
					"expanded": false,
					"loadComplete": false,
					"results": []
				}
			});
			this.oComponent.setModel(oFavModel, "favorite");
			this.oFavoriteIncidentsModel = new JSONModel({
				"favIncidents": [{
					"Attribute": "FAVORITE_INCIDENTS",
					"Value": "90222334444"
				}],
				"favSNOWCases": [{
					"Attribute": "FAVORITE_INCIDENTS",
					"Value": "CS60978564"
				}],
				"results": [{
					"Attribute": "FAVORITE_INCIDENTS",
					"Value": "90222334444"
				}, {
					"Attribute": "FAVORITE_INCIDENTS",
					"Value": "CS60978564"
				}]
			});
			this.oComponent.setModel(this.oFavoriteIncidentsModel, "favoriteIncidents");
			this.EventRegister = sinon.stub(sap.git.usage.Reporting, "addEvent");
			this.oStubDialogOpen = sinon.stub(sap.m.Dialog.prototype, "open");
			this.oStubDialogClose = sinon.stub(sap.m.Dialog.prototype, "close");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast, "show");
		},
		afterEach: function () {
			sap.m.Dialog.prototype.open.restore();
			sap.m.Dialog.prototype.close.restore();
			if (this.oBaseControl._oExpertDialog) {
				this.oBaseControl._oExpertDialog.close();
			}
			sap.m.MessageBox.show.restore();
			sap.m.MessageToast.show.restore();
			this.oBaseControl.destroy();
			this.oBaseControl.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Should return EventBus when call getEventBus", function (assert) {
		var oStub = this.stub(this.oComponent, "getEventBus");
		this.oBaseControl.getEventBus();
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Should return Router when call getRouter", function (assert) {
		var oStub = this.stub(sap.ui.core.UIComponent, "getRouterFor");
		this.oBaseControl.getRouter();
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Should return i18n related message when call getResourceBundle", function (assert) {
		var i18nModel = this.oComponent.getModel("i18n");
		var oStub = this.stub(i18nModel, "getResourceBundle");
		this.oBaseControl.getResourceBundle();
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Init model of create page when cancel creating or create successfully", function (assert) {
		var oEntry = {
			"CustomerNo": "",
			"CustomerNoEdit": true,
			"CustomerName": "",
			"BusinessImpact": {
				"Text": ""
			},
			"CaseID": "",
			"Description": "",
			"Title": "Request Support for Critical Situation",
			"RequestReason": "",
			"AllSelected": [],
			"IncidentTitle": "Incident(0)"
		};
		var oResource = {
			getText: function (sText) {
				return "Incident";
			}
		};
		this.stub(this.oBaseControl, "getResourceBundle").returns(oResource);
		this.oBaseControl.onGiveUpCreateCritical();
		assert.deepEqual(this.oComponent.getModel("createCriticalSituation").getData(), oEntry);
		assert.deepEqual(this.oComponent.getModel("incidentList").getData(), {
			"results": []
		});
		assert.deepEqual(this.oComponent.getModel("selectedIncidentList").getData(), {});
	});
	QUnit.test("Nav to CIM Request detail page when transtype is 'ZS90'", function (assert) {
		var transType = 'ZS90',
			activityId = "10000448";
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oBaseControl, "getRouter").returns(router);
		this.oBaseControl.onNavToCriticalRequest(transType, activityId);
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav to MCC Activity detail page when transtype is 'ZS46'", function (assert) {
		var transType = 'ZS46',
			activityId = "10000448";
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oBaseControl, "getRouter").returns(router);
		this.oBaseControl.onNavToCriticalRequest(transType, activityId);
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav to escalation request page when transtype is 'ZS31'", function (assert) {
		var transType = 'ZS31',
			activityId = "10000448";
		var oStubRouter = this.stub(window, "open");
		this.oBaseControl.onNavToCriticalRequest(transType, activityId);
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Should open Error MessageBox when call showErrorMessage", function (assert) {
		var oError = {
			message: "Error Message",
			responseText: '{"Error":"response error"}'
		};
		this.oBaseControl.showErrorMessage(oError);
		assert.equal(this.oStubMsgBoxShow.callCount, 1);
	});
	QUnit.test("Nav back previous page", function (assert) {
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oBaseControl, "getRouter").returns(router);
		this.oBaseControl.onNavBack();
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav back to home", function (assert) {
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oBaseControl, "getRouter").returns(router);
		this.oBaseControl.onNavHome();
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("should initate expertDialog when run function onOpenExpertDialog", function (assert) {
		this.oBaseControl.onOpenExpertDialog();
		assert.equal(this.oBaseControl._oExpertDialog.getTitle(), "Expert mode - Please select which request you want to create");
	});

	QUnit.test("should open a new window when run press confirm button after select CIM Request on ExpertDialog", function (assert) {
		var oStub = this.stub(window, "open");
		var oRadioGroup = new sap.m.RadioButtonGroup({
			"buttons": [
				new sap.m.RadioButton({
					text: "CIM Request",
					selected: true
				}),
				new sap.m.RadioButton({
					text: "MCC Activity"
				}),
				new sap.m.RadioButton({
					text: "Escalation Request"
				})
			]
		});
		this.oBaseControl.onOpenExpertDialog();
		this.oBaseControl.onConfirmRequestSelect(oRadioGroup);
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should open a new window when run press confirm button after select MCC Activity on ExpertDialog", function (assert) {
		var oStub = this.stub(window, "open");
		var oRadioGroup = new sap.m.RadioButtonGroup({
			"selectedIndex": 1,
			"buttons": [
				new sap.m.RadioButton({
					text: "CIM Request"
				}),
				new sap.m.RadioButton({
					text: "MCC Activity",
					selected: true
				}),
				new sap.m.RadioButton({
					text: "Escalation Request"
				})
			]
		});
		this.oBaseControl.onOpenExpertDialog();
		this.oBaseControl.onConfirmRequestSelect(oRadioGroup);
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should open a new window when run press confirm button after select Escalation Request on ExpertDialog", function (assert) {
		// var oStub = this.stub(window, "open");
		var router = new sap.ui.core.routing.Router();
		// this.stub(router, "navTo");
		this.stub(this.oBaseControl, "getRouter").returns(router);
		var oStub = this.stub(this.oBaseControl.getRouter(),"navTo");
		var oRadioGroup = new sap.m.RadioButtonGroup({
			"selectedIndex": 2,
			"buttons": [
				new sap.m.RadioButton({
					text: "CIM Request"
				}),
				new sap.m.RadioButton({
					text: "MCC Activity"
				}),
				new sap.m.RadioButton({
					text: "Escalation Request",
					selected: true
				})
			]
		});
		this.oBaseControl.onOpenExpertDialog();
		this.oBaseControl.onConfirmRequestSelect(oRadioGroup);
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("should nav to CustomerDetail page when  run function onCustomerName", function (assert) {
		this.customerNo = "12186";
		this.customerName = "Bayer Aktiengesellschaft";
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oBaseControl, "getRouter").returns(router);
		this.oBaseControl.onCustomerName();
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("should register event once when  run function eventUsage with parameter oRoute", function (assert) {
		this.oBaseControl.eventUsage("Homepage", "");
		assert.equal(this.EventRegister.callCount, 1);
	});

	QUnit.test("should register event once when  run function eventUsage with parameter sEventName", function (assert) {
		this.oBaseControl.eventUsage("", "nav to customer detil view");
		assert.equal(this.EventRegister.callCount, 1);
	});

	QUnit.test("Should return month description when enter month number", function (assert) {
		// Assert
		var aMonthNo = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
		var aMonthDesc = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
		for (var i = 0; i < 12; i++) {
			var sMonthNo = aMonthNo[i];
			var sMonthDesc = aMonthDesc[i];
			var sText = "The description for month " + (i + 1) + " is correct";
			assert.strictEqual(this.oBaseControl.getMonthDesc(sMonthNo), sMonthDesc, sText);
		}
	});
	QUnit.test("Set enable notification true when open the app and Need_FSC2_PUSHNOTIFICATION is 'YES'", function (assert) {
		//Arrangment   
		var oData = {
			"results": [{
				"Attribute": "NEED_FSC2_PUSHNOTIFICATION",
				"Field": "",
				"Text": "YES",
				"Username": "",
				"Value": "YES"
			}]
		};
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		//Action
		this.oBaseControl.loadSettingData();
		//Assertion
		assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/enableNotification"), true);
	});
	QUnit.test("Set enable notification false when open the app and Need_FSC2_PUSHNOTIFICATION is 'NO'", function (assert) {
		//Arrangment   
		var oData = {
			"results": [{
				"Attribute": "NEED_FSC2_PUSHNOTIFICATION",
				"Field": "",
				"Text": "NO",
				"Username": "",
				"Value": "NO"
			}]
		};
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		//Action
		this.oBaseControl.loadSettingData();
		//Assertion
		assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/enableNotification"), false);
	});
	QUnit.test("Set expert mode true when open the app and APP_FSC2_EXPERT_MODE is 'YES'", function (assert) {
		//Arrangment 
		var oData = {
			"results": [{
				"Attribute": "APP_FSC2_EXPERT_MODE",
				"Field": "",
				"Text": "YES",
				"Username": "",
				"Value": "YES"
			}]
		};
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		//Action
		this.oBaseControl.loadSettingData();
		//Assertion
		assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/expertMode"), true);
	});
	QUnit.test("Set expert mode false when open the app and APP_FSC2_EXPERT_MODE is 'NO'", function (assert) {
		//Arrangment 
		var oData = {
			"results": [{
				"Attribute": "APP_FSC2_EXPERT_MODE",
				"Field": "",
				"Text": "NO",
				"Username": "",
				"Value": "NO"
			}]
		};
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		//Action
		this.oBaseControl.loadSettingData();
		//Assertion
		assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/expertMode"), false);
	});

	QUnit.test("should give warning message when log on system and find error for service UserProfile", function (assert) {
		//Arrangment   
		this.UserProfileRead.withArgs("/Entries").yieldsTo("error", {});
		//Action
		this.oBaseControl.loadSettingData();
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});
	// QUnit.test("should set property enableSaM to true when there is no data related to APP_FSC2_USE_SAM in model homePageConfig", function (assert) {
	// 	//Arrangment   
	// 	this.UserProfileRead.withArgs("/Entries").yieldsTo("success", {"results":[]});
	// 	//Action
	// 	this.oBaseControl.loadSettingData();
	// 	//Assertion
	// 	assert.equal(this.this.UserProfileCreate.called, true);
	// });
	QUnit.test("Should get the Customer No that related to default case and put on model homePageConfig when open the application", function (
		assert) {
		// Assert
		var oData = {
			"results": [{
				"customer_r3_no": "10010",
				"customer_name": "Customer name"
			}]
		};
		this.FSC2Read.withArgs("/CasesSet").yieldsTo("success", oData);
		this.oBaseControl.loadCustomerNoByCase();
		var sDefaultCustNo = this.oComponent.getModel("homePageConfig").getProperty("/defaultCustNo");
		assert.equal(sDefaultCustNo, "10010");
	});
	QUnit.test("shold load all favorite incidents No when call function refreshFavoriteIncidentsModel", function (assert) {
		var oData = {
			"results": [{
				"Attribute": "FAVORITE_INCIDENTS",
				"Value": "90222334444"
			}, {
				"Attribute": "FAVORITE_INCIDENTS",
				"Value": "CS60978564"
			}]
		};
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oBaseControl, "loadFavIncidentData");
		var oStub2 = this.stub(this.oBaseControl, "loadFavSNOWCaseData");

		this.oBaseControl.refreshFavoriteIncidentsModel();
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});

	QUnit.test("shold load favorite customer No and situation No when call function loadFavCustData", function (assert) {
		var oData = {
			"results": [{
				"Type": "FAVORITE_CUSTOMERS",
				"Action": "X",
				"Value": "10010"
			}, {
				"Type": "FAVORITE_CUSTOMERS",
				"Action": "X",
				"Value": "12186"
			}]
		};
		this.FSC2Read.withArgs("/FavoriteObjectSet").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oComponent.getModel("favorite"), "setProperty");

		this.oBaseControl.loadFavCustData();
		assert.equal(oStub1.called, true);
	});

	QUnit.test("shold load favorite BC* Incidents when call function loadFavIncidentData", function (assert) {
		var oData = this.oIncidentSetModel.getData();
		this.stub(sap.support.fsc2.IncidentModel.__proto__, "submitChanges").yieldsTo("success", oData);
		var oStub = this.stub(this.oBaseControl, "loadIncidentComplete");
		this.oBaseControl.loadFavIncidentData();
		// var aData = oData.__batchResponses[0].data.results[0];
		assert.equal(oStub.called, true);
	});

	QUnit.test("shold set favorite SNow Cases empty when call function loadFavSNOWCaseData with closed SNowCase switch", function (assert) {
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable", false);
		this.oComponent.getModel("favoriteIncidents").setProperty("/favSNOWCases", [{
			"Attribute": "FAVORITE_INCIDENTS",
			"Value": "CS60978564"
		}]);

		// this.stub(sap.support.fsc2.IncidentModel.__proto__, "submitChanges").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oBaseControl, "loadIncidentComplete");
		var oStub2 = this.stub($, "ajax");

		this.oBaseControl.loadFavSNOWCaseData();
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, false);
	});

	QUnit.test("shold load favorite SNow Cases when call function loadFavSNOWCaseData with enabled SNowCase switch", function (assert) {
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable", true);
		this.oComponent.getModel("favoriteIncidents").setProperty("/favSNOWCases", [{
			"Attribute": "FAVORITE_INCIDENTS",
			"Value": "CS60978564"
		}]);

		// this.stub(sap.support.fsc2.IncidentModel.__proto__, "submitChanges").yieldsTo("success", oData);
		var oStub1 = this.stub(this.oBaseControl, "loadIncidentComplete");
		var oStub2 = this.stub($, "ajax");
		var oData = {
			"result": [{
				"correlation_id": "84798759878768678",
				"number": "CS60978564",
				"correlation_display": "",
				"account.name": "",
				"u_app_component.u_name": "",
				"short_description": "",
				"priority": "1",
				"state": "10",
				"escalation ": "0"
			}]
		};
		oStub2.yieldsTo("success", oData);
		this.oBaseControl.loadFavSNOWCaseData();
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});

	QUnit.test("shold put all loaded BC* incidents and SNow Case into favorite incident model when call function loadIncidentComplete",
		function (assert) {
			this.oComponent.getModel("favorite").setData({
				"BCIncident": {
					"count": 7,
					"expanded": true,
					"loadComplete": true,
					"results": [{
						"ID": "002075129400000100102017",
						"ShortID": "10010/2017",
						"Name": "BASF SE",
						"ComponentName": "PY-NZ",
						"Description": "Error In Payroll operation - NZEER - PCR PY-NZ",
						"Priority": "High",
						"PriorityID": "3",
						"Status": "Restricted",
						"Action": "X",
						"Field": "2",
						"Type": "FAVORITE_INCIDENTS",
						"Escalation": false
					}]
				},
				"SnowCase": {
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				},
				"results": {}
			});
			var oStub = this.stub(this.oComponent.getModel("favorite"), "setProperty");
			this.oBaseControl.loadIncidentComplete();
			// var aData = oData.__batchResponses[0].data.results[0];
			assert.equal(oStub.called, true);
		});

	QUnit.test("shold load favorite BC* Incidents when call function loadFavIncidentData", function (assert) {
		var oData = {
			"results": [{
				"Username": "",
				"Attribute": "TIME_ZONE",
				"Field": "",
				"Value": "UTC+8",
				"Text": "UTC+8"}
			]
		};
		this.UserProfileRead.withArgs("/Entries").yieldsTo("success", oData);
		this.oBaseControl.loadCurrentTimeZone();
		// var aData = oData.__batchResponses[0].data.results[0];
		assert.equal(this.oComponent.getModel("homePageConfig").getProperty("/TimeZone"), "UTC+8");
	});
});