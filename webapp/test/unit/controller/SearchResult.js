sap.ui.require([
	"sap/support/fsc2/controller/SearchResult.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (Resultpage, model, ManagedObject, ResourceModel, Filter, JSONModel, ODataModel, sinon) {
	"use strict";

	QUnit.module("SearchResultPage", {
		beforeEach: function () {
			this.oResultpage = new Resultpage();
			this.oSearchResultsModel = new JSONModel();
			this.oModelI18n = new ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n",
				bundleLocale: "EN"
			});
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(new JSONModel({
				"bEnable": true
			}), "EnableSnowCase");
			this.oComponent.setModel(this.oSearchResultsModel, "searchResult");
			this.oComponent.setModel(this.oModelI18n, "i18n");
			this.oSNowCaseListModel = new JSONModel();
			this.oSNowCaseListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SNowCasesList.json"), {}, false);
			this.oComponent.setModel(this.oSNowCaseListModel, "snowCaseList");
			sinon.stub(this.oResultpage, "getOwnerComponent").returns(this.oComponent);
			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
			});
			this.FSC2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
			});
			this.IncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");
			var oView = {
				byId: function (sId) {}
			};
			var oBusy = {
				setBusy: function () {}
			};
			sinon.stub(this.oResultpage, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(oBusy);
			sinon.stub(this.oResultpage, "eventUsage");
		},
		afterEach: function () {
			this.oResultpage.getOwnerComponent.restore();
			this.oResultpage.destroy();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Init when entering search result page", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oResultpage, "getRouter").returns(router);

		//Action
		this.oResultpage.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Load search result from all categories", function (assert) {
		//Arrangment
		var oParam = {
			"value": "test",
			"description": "All"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		var oStub1 = this.stub(this.oResultpage, "loadCustomerData");
		var oStub2 = this.stub(this.oResultpage, "loadSituationData");
		var oStub3 = this.stub(this.oResultpage, "loadIncidentData");
		var oStub4 = this.stub(this.oResultpage, "loadSnowCaseData");
		this.byId.withArgs("idSearchTab").returns(new sap.m.IconTabBar());
		//Action
		this.oResultpage._onRouteMatched(oEvent);
		//Assertion
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStub2.callCount, 1);
		assert.equal(oStub3.callCount, 1);
		assert.equal(oStub4.callCount, 1);
	});
	QUnit.test("Load search result from 'searchCustomer' category", function (assert) {
		//Arrangment
		var oParam = {
			"value": "test",
			"description": "searchCustomer"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		var oStub1 = this.stub(this.oResultpage, "loadCustomerData");
		this.byId.withArgs("idSearchTab").returns(new sap.m.IconTabBar());
		//Action
		this.oResultpage._onRouteMatched(oEvent);
		//Assertion
		assert.equal(oStub1.callCount, 1);
	});
	QUnit.test("Load search result from 'searchSituation' category", function (assert) {
		//Arrangment
		var oParam = {
			"value": "test",
			"description": "searchSituation"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		var oStub1 = this.stub(this.oResultpage, "loadSituationData");
		this.byId.withArgs("idSearchTab").returns(new sap.m.IconTabBar());
		//Action
		this.oResultpage._onRouteMatched(oEvent);
		//Assertion
		assert.equal(oStub1.callCount, 1);
	});
	QUnit.test("Load search result from 'searchIncident' category", function (assert) {
		//Arrangment
		var oParam = {
			"value": "test",
			"description": "searchIncident"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		var oStub1 = this.stub(this.oResultpage, "loadIncidentData");
		this.stub(this.oResultpage, "loadSnowCaseData");
		this.byId.withArgs("idSearchTab").returns(new sap.m.IconTabBar());
		//Action
		this.oResultpage._onRouteMatched(oEvent);
		//Assertion
		assert.equal(oStub1.callCount, 1);
	});
	QUnit.test("Load 'Customer' table data with search value is 'Test 5'", function (assert) {
		//Arrangment   
		var sValue = "Test 5";
		var oData = {
			"results": [{
				City_Name: "c",
				Country_Code: "IN",
				Country_Name: "",
				Customer_BP: "0004672592",
				Customer_Name: "Wf Test 5",
				Customer_No: "0001180855",
				Favorite_Field: "",
				Is_Favorite: "",
				Search_Content: ""
			}]
		};
		this.FSC2Read.withArgs("/CustomerInfoSet").yieldsTo("success", oData);

		this.oResultpage.loadCustomerData(sValue);
		//Assertion
		var aData = oData.results[0];
		var oResultsData = {
			"results": [{
				"ID": aData.Customer_No,
				"CustomerNo": aData.Customer_No,
				"CustomerName": aData.Customer_Name,
				"Action": aData.Is_Favorite,
				"Field": aData.Favorite_Field,
				"Type": "FAVORITE_CUSTOMERS"
			}],
			"count": 1,
			"expanded": true
		};
		assert.deepEqual(this.oSearchResultsModel.getProperty("/Customer"), oResultsData);

	});
	QUnit.test("Load 'Critical Customer Situation' table data with search value is 'Test 5'", function (assert) {
		//Arrangment   
		var sValue = "Test 5";
		this.oActivitySetModel = new JSONModel();
		this.oActivitySetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/ActivitySet.json"), {}, false);

		var oActData = this.oActivitySetModel.getData();
		this.FSC2Read.withArgs("/FSC2ActivitySet").yieldsTo("success", oActData);

		//Action
		this.oResultpage.loadSituationData(sValue, true);
		//Assertion
		// var aData = oData.results[0];
		var oResultsData = {
			"results": [{
				Action: "X",
				CustomerNo: "12186",
				Description: "Test Involved user",
				Field: "                              1",
				ID: "79069",
				Name: "Bayer Aktiengesellschaft",
				Status: "New",
				TransType: "ZS31",
				Type: "FAVORITE_ESCALATION_REQUESTS"
			}, {
				Action: "X",
				CustomerNo: "160073",
				Description: "test test",
				Field: "",
				ID: "10000781",
				Name: "Bayer Aktiengesellschaft",
				Status: "Handover",
				TransType: "ZS90",
				Type: "FAVORITE_CIM_REQUESTS"

			}, {
				Action: "",
				CustomerNo: "160073",
				Description: "test",
				Field: "",
				ID: "10000791",
				Name: "Bayer Aktiengesellschaft",
				Status: "New",
				TransType: "ZS90",
				Type: "FAVORITE_CIM_REQUESTS"

			}],
			"count": 3,
			"expanded": true
		};
		assert.deepEqual(this.oSearchResultsModel.getProperty("/Situation"), oResultsData);

	});
	QUnit.test("Load 'Incident' table data with search value  '002007974700008600812015' in Incident Category", function (assert) {
		//Arrangment   
		var sValue = "002007974700008600812015";
		this.oComponent.setModel(new JSONModel({
			"results": [{
				"Username": "",
				"Attribute": "FAVORITE_INCIDENTS",
				"Field": "1",
				"Value": "002007974700008600812015",
				"Text": "002007974700008600812015"
			}]
		}), "favoriteIncidents");
		this.oIncidentModel = new JSONModel();
		this.oIncidentModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentSet.json"), {}, false);
		var oIncidentData = this.oIncidentModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oIncidentData.__batchResponses[0].data);
		this.stub(this.oResultpage, "IncidentLoadComplete");
		//Action
		this.oResultpage.loadIncidentData(sValue);
		//Assertion

		var oResultsData = {
			"results": [{
				"ID": "002007974700008600812015",
				"ShortID": "860081/2015",
				"Name": "sapcomtesting.com inc",
				"ComponentName": "PY-XX",
				"Description": "Unable to process salary for approximate",
				"Component": "PY-XX",
				"Priority": "Medium",
				"PriorityID": "5",
				"Status": "In Process",
				"Action": "X",
				"Active": false,
				"ActiveSystem": undefined,
				"Field": "",
				"Type": "FAVORITE_INCIDENTS",
				"Escalation": false
			}],
			"count": 1,
			"expanded": true,
			"loadComplete": true,
		};
		assert.deepEqual(this.oSearchResultsModel.getProperty("/BcIncident"), oResultsData);

	});
	QUnit.test("Load 'Incident' table data with search value  '0000860081  2015' in Incident Category", function (assert) {
		//Arrangment   
		// var sValue = "0000860081  2015";
		var sValue = "0000860081/2015";
		this.oComponent.setModel(new JSONModel({
			"results": []
		}), "favoriteIncidents");
		this.oIncidentModel = new JSONModel();
		this.oIncidentModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentSet.json"), {}, false);
		var oIncidentData = this.oIncidentModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oIncidentData.__batchResponses[0].data);
		this.stub(this.oResultpage, "IncidentLoadComplete");
		//Action
		this.oResultpage.loadIncidentData(sValue);

		//Assertion
		var oResultsData = {
			"results": [{
				"ID": "002007974700008600812015",
				"ShortID": "860081/2015",
				"Name": "sapcomtesting.com inc",
				"ComponentName": "PY-XX",
				"Description": "Unable to process salary for approximate",
				"Component": "PY-XX",
				"Priority": "Medium",
				"PriorityID": "5",
				"Status": "In Process",
				"Action": "",
				"Active": false,
    			"ActiveSystem": undefined,
				"Field": "",
				"Type": "FAVORITE_INCIDENTS",
				"Escalation": false
			}],
			"count": 1,
			"expanded": true,
			"loadComplete":true
		};
		assert.deepEqual(this.oSearchResultsModel.getProperty("/BcIncident"), oResultsData);
	});
	QUnit.test("Nav to customer detail page when click a customer", function (assert) {
		//Arrangment   
		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						"Action": "X",
						"CustomerName": "Bayer Aktiengesellschaft",
						"CustomerNo": "0000012186",
						"Field": "2 ",
						"ID": "0000012186",
						"Type": "FAVORITE_CUSTOMERS"
					};
				},
				getPath: function () {
					return "/Customer/results/0";
				}
			};
			return oBindObject;
		};
		var oBindingContext = {
			getBindingContext: getBindingContext
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);

		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oResultpage, "getRouter").returns(router);

		//Action
		this.oResultpage.handleRowPress(oEvent);
		//Assertion

		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav to critical situation detail page when click a situation", function (assert) {
		//Arrangment   
		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						"Action": "X",
						"CustomerName": "Bayer Aktiengesellschaft",
						"CustomerNo": "12186",
						"Description": "General MCC support request - FSC2",
						"Field": "3",
						"Status": "Responsible's Action",
						"ID": "326999",
						"Type": "FAVORITE_ACTIVITIES"
					};
				},
				getPath: function () {
					return "/Situation/results/0";
				}
			};
			return oBindObject;
		};
		var oBindingContext = {
			getBindingContext: getBindingContext
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);

		// var router = new sap.ui.core.routing.Router();
		// this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oResultpage, "onNavToCriticalRequest");

		//Action
		this.oResultpage.handleRowPress(oEvent);
		//Assertion

		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Nav to incident detail page when click an incident", function (assert) {
		//Arrangment   
		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						"Action": "",
						"ComponentName": "LOD-SF-LMS",
						"Description": "test LOD-SF-LMS",
						"Escalation": false,
						"Field": "",
						"ID": "002075125200015590992017",
						"Name": "Broken Hill Pty Ltd Broken Hill Pty",
						"Priority": "High",
						"PriorityID": "3",
						"ShortID": "1559099/2017",
						"Status": "New",
						"Type": "FAVORITE_INCIDENTS",
						"Active": true
					};
				},
				getPath: function () {
					return "/Incident/results/0";
				}
			};
			return oBindObject;
		};
		var oBindingContext = {
			getBindingContext: getBindingContext
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);

		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oResultpage, "getRouter").returns(router);

		//Action
		this.oResultpage.handleRowPress(oEvent);
		//Assertion

		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Should load Service Now case list based on search value when enable SNow case loading",function (assert) {
			//Arrangment   
			this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable", true);
			this.stub(this.oResultpage,"checkIcdFavorite");
			var oData = this.oSNowCaseListModel.getData();
			this.stub($, "ajax").yieldsTo("success", oData);
			var oStub1 = this.stub(this.oResultpage, "IncidentLoadComplete");
			//Action
			this.oResultpage.loadSnowCaseData("CS201900033344");
			//Assertion
			assert.equal(oStub1.called, true);
		});
	QUnit.test("Should integrate Service Now case list with incident list based on search value when call function IncidentLoadComplete",function (assert) {
			//Arrangment   
			this.oComponent.getModel("searchResult").setData({
				"Incident":{
					"count": 0,
					"expanded": false,
					"loadComplete": false,
					"results": []
				},
				"BcIncident":{
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				},
				"SnowCase":{
					"count": 0,
					"expanded": false,
					"loadComplete": true,
					"results": []
				}
			});
			//Action
			this.oResultpage.IncidentLoadComplete();
			var bComplete = this.oComponent.getModel("searchResult").getProperty("/Incident/loadComplete");
			//Assertion
			assert.equal(bComplete, true);
		});
});