sap.ui.require([
	"sap/support/fsc2/controller/myFavorites.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (Favorites, model, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("FavoritesPage", {
		beforeEach: function () {
			this.oFavorites = new Favorites();
			this.oIncidentSetModel = new JSONModel();
			this.oIncidentSetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentSet.json"), {}, false);
			this.oFavoriteIncidentsModel = new JSONModel();
			this.oFavoriteIncidentsModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/UserFavoriteIncident.json"), {},
				false);
			this.oFavoriteSetModel = new JSONModel();
			this.oFavoriteSetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/Favorites.json"), {}, false);

			this.oFavorite = new JSONModel({
					"Customer": {
					"count": "0",
					"expanded": false,
					"loadComplete":false,
					"results": []
				},
				"Situation": {
					"count": "0",
					"expanded": false,
					"loadComplete":false,
					"results": []
				},
				"Incident": {
					"count": "0",
					"expanded": false,
					"loadComplete":false,
					"results": []
				}
			});

			this.oModelI18n = new ResourceModel({
				bundleName: "sap.support.fsc2.i18n.i18n",
				bundleLocale: "EN"
			});
			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oFavoriteIncidentsModel, "favoriteIncidents");
			this.oComponent.setModel(this.oFavoriteSetModel, "favoriteSet");
			this.oComponent.setModel(this.oFavorite, "favorite");
			this.oComponent.setModel(this.oModelI18n, "i18n");
			sinon.stub(this.oFavorites, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				byId: function (sId) {},
				setBusy: function () {}
			};
			var oBusy = {
				setBusy: function () {},
				setSelectedKey:function(){}
			};
			sinon.stub(this.oFavorites, "getView").returns(oView);
			sinon.stub(oView, "byId").returns(oBusy);
			this.oComponent.setModel(new JSONModel({
				"myRequests": 0,
				"myFavorites": 0
			}), "homePageCount");
			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			this.stubEventBus = sinon.stub(this.oFavorites, "getEventBus").returns(oEventBus);
			sinon.stub(this.oFavorites, "eventUsage");
			this.oStubMsgShow = sinon.stub(sap.m.MessageToast,"show");
			this.oFavorites.bFlag1= true;
			this.oFavorites.bFlag2= true;
		},
		afterEach: function () {
			sap.m.MessageToast.show.restore();
			this.oFavorites.destroy();
			this.oFavorites.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	// QUnit.test("init favorite page when opening the homepage", function (assert) {
	// 	var oStub = this.stub(this.stubEventBus,"subscribe");
	// 	//Action
	// 	this.oFavorites.onInit();
	// 	//Assertion
	// 	assert.equal(oStub.called, true);
	// });
	
	QUnit.test("Init when opening the app", function (assert) {
		var oStub1 = this.stub(this.oFavorites,"checkDataLoadComplete");
		//Action
		this.oFavorites._onRouteMatched();
		//Assertion
		assert.equal(oStub1.called, true);
	});
	
	QUnit.test("should integrate all favorite data together after all favorite customer, situation and incident complete", function (assert) {
		// var oStub1 = this.stub(this.oComponent.getModel("favorite"),"setProperty");
		this.oComponent.getModel("favorite").setData({
					"Customer": {
					"count": "2",
					"expanded": false,
					"loadComplete":true,
					"results": [{"CustomerNo":"12186","CustomerName":"XXXXXXX"},
								{"CustomerNo":"11133","CustomerName":"XXXXXXX"}]
				},
				"SnowCase": {
					"count": "0",
					"expanded": false,
					"loadComplete":true,
					"results": []
				},
				"Situation": {
					"count": "0",
					"expanded": false,
					"loadComplete":true,
					"results": []
				},
				"Incident": {
					"count": "0",
					"expanded": false,
					"loadComplete":false,
					"results": []
				},
				"BCIncident": {
					"count": "2",
					"expanded": false,
					"loadComplete":true,
					"results": [{"IncidentNo":"2222222222","ShortDesc":"XXXXXXX"},
								{"IncidentNo":"3333333333","ShortDesc":"XXXXXXX"}]
				}
			});
		//Action
		this.oFavorites.checkDataLoadComplete();
		var bComplete = this.oComponent.getModel("favorite").getProperty("/Incident").loadComplete;                         
		//Assertion
		assert.equal(bComplete, true);
	});
	
	QUnit.test("Load all favorite incidents data ", function (assert) {
		//Arrangment   
		// this.oFavorites.bFlag1= true;
		// this.oFavorites.bFlag2= true;
		var oData = this.oIncidentSetModel.getData();
		sap.support.fsc2.IncidentModel = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.IncidentModel.__proto__, "submitChanges").yieldsTo("success", oData);
		this.oComponent.getModel("homePageCount").setProperty("/myFavorites", 1);
		//Action
		this.oFavorites.loadIncidentData();
		//Assertion
		var aData = oData.__batchResponses[0].data.results[0];
		var oResultsData = {
			"count": 1,
			"expanded": true,
			"results": [{
				"ID": aData.CssObjectID,
				"ShortID": aData.ObjectID + "/" + aData.MessageYear,
				"Name": aData.CustomerName,
				"ComponentName": aData.ComponentName,
				"Description": aData.Description + " " + aData.ComponentName,
				"Priority": aData.PriorityTxt,
				"PriorityID": "5",
				"Status": aData.StatusTxt,
				"Action": "X",
				"Field": "1",
				"Type": "FAVORITE_INCIDENTS",
				"Escalation": false
			}]
		};
		assert.deepEqual(this.oFavorite.getData().Incident, oResultsData);

	});
	
QUnit.test("should give error message when load all favorite incidents data but get oData service error", function (assert) {
		//Arrangment   
		sap.support.fsc2.IncidentModel = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.IncidentModel.__proto__, "submitChanges").yieldsTo("error", {});
		//Action
		this.oFavorites.loadIncidentData();
		assert.equal(this.oStubMsgShow.called, true);
	});	
		
	QUnit.test("should wait until favoriteIncidents model complete load data  when load detail incident list", function (assert) {
		//Arrangment  
		this.oComponent.getModel("favoriteIncidents").setData();
		var oStub = this.stub(window, "setTimeout");
		//Action
		this.oFavorites.loadIncidentData();
		//Assertion
		assert.equal(oStub.called, true);
	});
		
	QUnit.test("should return empty data for favorite incident when load favorite incidents but the user do not add any incident into favorite", function (assert) {
		//Arrangment  
		this.oComponent.getModel("favoriteIncidents").setData({
			"results":[]
		});
		var oResultsData = {
					"count": 0,
					"expanded": false,
					"results": []
				};
		sap.support.fsc2.IncidentModel = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		//Action
		this.oFavorites.loadIncidentData();
		assert.deepEqual(this.oFavorite.getData().Incident, oResultsData);
	});
	
	QUnit.test("Load all favorite customer and critical customer situation data ", function (assert) {
		//Arrangment  
		var oData = this.oFavoriteSetModel.getData();
		sap.support.fsc2.FSC2Model = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
		});
		this.stub(sap.support.fsc2.FSC2Model, "read").yieldsTo("success", oData);

		//Action
		this.oFavorites.loadTableData();
		//Assertion
		assert.deepEqual(this.oFavorite.getData().Customer.count, 3);
		assert.deepEqual(this.oFavorite.getData().Situation.count, 8);

	});
	
	QUnit.test("should give error message when load all favorite customer but get oData service error ", function (assert) {
		//Arrangment  
		sap.support.fsc2.FSC2Model = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
		});
		this.stub(sap.support.fsc2.FSC2Model, "read").yieldsTo("error", {});
		//Action
		this.oFavorites.loadTableData();
		//Assertion
		assert.equal(this.oStubMsgShow.called, true);
	});
	
	QUnit.test("nav to customer detail page  when an item in custmer tab was clicked", function (assert) {
		//Arrangment   
		var oBj = {
			getObject: function () {
				return {
					"Action": "X",
					"CustomerName": "Bühler AG",
					"CustomerNo": "0000010013",
					"Description": "",
					"FavoriteType": "FAVORITE_CUSTOMERS",
					"Field": "1",
					"GUID": "46FCD5CCC0E20D4A81F24A04EF67D791",
					"ID": "0000010013",
					"Status": "",
					"TransType": "",
					"Type": "FAVORITE_CUSTOMERS"
				};
			},
			getPath: function () {
				return "/Customer/results/0";
			}
		};
		var oBinding = {
			getBindingContext: function () {
				return oBj;
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBinding);
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oFavorites, "getRouter").returns(router);

		//Action
		this.oFavorites.onFavoriteItemPress(oEvent);
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("nav to MCC Activity detail page  when an item in critical situation tab was clicked", function (assert) {
		//Arrangment   
		var oBj = {
			getObject: function () {
				return {
					"Action": "X",
					"CustomerName": "Bayer AG",
					"CustomerNo": "0000012186",
					"Description": "General MCC Support Request - FSC2",
					"FavoriteType": "FAVORITE_CRITICAL",
					"Field": "16                              ",
					"GUID": "0894EF23F8B91EE8BAFA442F8A2FD324",
					"ID": "0046784354",
					"Status": "New",
					"TransType": "ZS46",
					"Type": "FAVORITE_ACTIVITIES"
				};
			},
			getPath: function () {
				return "/Situation/results/0";
			}
		};
		var oBinding = {
			getBindingContext: function () {
				return oBj;
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBinding);
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oFavorites, "getRouter").returns(router);

		//Action
		this.oFavorites.onFavoriteItemPress(oEvent);
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("nav to incident detail page  when an item in incident tab was clicked", function (assert) {
		//Arrangment   
		var oBj = {
			getObject: function () {
				return {
					"Action": "X",
					"ComponentName": "HAN-DB-ENG-BW",
					"Description": "unable to  de-implementing OSS note 2264 HAN-DB-ENG-BW",
					"Escalation": false,
					"Field": "1",
					"ID": "002075129500000987112017",
					"Name": "NESTLE GLOBE BTC",
					"Priority": "Very High",
					"PriorityID": "1",
					"ShortID": "98711/2017",
					"Status": "In Process",
					"Type": "FAVORITE_INCIDENTS"
				};
			},
			getPath: function () {
				return "/Incident/results/0";
			}
		};
		var oBinding = {
			getBindingContext: function () {
				return oBj;
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBinding);
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oFavorites, "getRouter").returns(router);

		//Action
		this.oFavorites.onFavoriteItemPress(oEvent);
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
});