sap.ui.require([
	"sap/support/fsc2/controller/IncidentList.controller",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (IncidentList, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("IncidentList", {
		beforeEach: function () {
			this.IncidentList = new IncidentList();
			this.oComponent = new ManagedObject();
			this.oIncidentListModel = new JSONModel();
			this.oIncidentListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/IncidentList.json"), {}, false);
			this.oComponent.setModel(this.oIncidentListModel, "incidentList");
			this.oSNowCaseListModel = new JSONModel();
			this.oSNowCaseListModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SNowCasesList.json"), {}, false);
			this.oComponent.setModel(this.oSNowCaseListModel, "snowCaseList");
			this.oComponent.setModel(new JSONModel({"enableSaM":false}), "homePageConfig");
			this.oComponent.setModel(new JSONModel(), "selectedIncidentList");
			this.oComponent.setModel(new JSONModel({
				"CustomerNo": "",
				"CustomerNoEdit": true,
				"CustomerName": "",
				"BusinessImpact": {
					"Text": ""
				},
				"AllSelected": []
			}), "createCriticalSituation");
			this.oComponent.setModel(new JSONModel(), "IncidentbyCust");
			this.oComponent.setModel(new JSONModel({
				"bEnable": true
			}), "EnableSnowCase");
			sinon.stub(this.IncidentList, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				byId: function (sId) {},
				setBusy: function () {}
			};
			var oFilter = {
				filter: function () {}
			};
			this.oControl = {
				getBinding: function (items) {
					return oFilter;
				},
				getSelectedItems:function(){
					return [];
				},
				removeSelections:function(){}
			};
			sinon.stub(this.IncidentList, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);

			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			sinon.stub(this.IncidentList, "getEventBus").returns(oEventBus);
			sinon.stub(this.IncidentList, "eventUsage");

			sap.support.fsc2.IncidentModel = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "sap/opu/odata/SVC/SID_GATEWAY_SRV",
				defaultUpdateMethod: "Put"
			});
			this.IncidentRead = sinon.stub(sap.support.fsc2.IncidentModel, "read");
			this.oStubMsgBoxInfo = sinon.stub(sap.m.MessageBox, "information");
			sap.support.fsc2.oDataBCRequestModel = new ODataModel("/bc/odata/SID/SERVICE_REQUEST_SRV/", {
					json: true,
					useBatch: false
				});
		},
		afterEach: function () {
			sap.m.MessageBox.information.restore();
			sap.support.fsc2.oDataBCRequestModel.destroy();
			sap.support.fsc2.IncidentModel.destroy();
			this.IncidentList.getOwnerComponent.restore();
			this.IncidentList.destroy();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Load customer incident list when user input a customer number and then click 'add' button ", function (assert) {
		//Arrangment   
		var oParam = {
			"custnum": "0000012186"
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getParameter").returns(oParam);
		var oStub1 = this.stub(this.IncidentList, "_loadCustomerIncident");
		var oStub2 = this.stub(this.IncidentList, "_loadCustomerSnowCase");
		//Action
		this.IncidentList._onRouteMatched(oEvent);
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});

	QUnit.test("Should load BC* incident based on the given customer No when call function _loadCustomerIncident", function (assert) {
		//Arrangment   
		var oData = this.oIncidentListModel.getData();
		this.IncidentRead.withArgs("/IncidentList").yieldsTo("success", oData);
		var oStub1 = this.stub(this.IncidentList, "loadDataByCustComplete");
		//Action
		this.IncidentList._loadCustomerIncident("12186");
		//Assertion
		assert.equal(oStub1.called, true);
	});
	QUnit.test(
		"Should load Service Now case based on the given customer No when call function _loadCustomerSnowCase with enable loading SNow case",
		function (assert) {
			//Arrangment   
			this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable", true);
			var oData = this.oSNowCaseListModel.getData();
			this.stub($, "ajax").yieldsTo("success", oData);
			var oStub1 = this.stub(this.IncidentList, "loadDataByCustComplete");
			var oStub2 = this.stub(this.oComponent.getModel("IncidentbyCust"), "setProperty");
			//Action
			this.IncidentList._loadCustomerSnowCase("12186");
			//Assertion
			assert.equal(oStub1.called, true);
			assert.equal(oStub2.called, true);
		});
	QUnit.test("Should return empty for Service Now case when call function _loadCustomerSnowCase with disable loading SNow case", function (
		assert) {
		//Arrangment   
		this.oComponent.getModel("EnableSnowCase").setProperty("/bEnable", false);
		var oStub1 = this.stub(this.IncidentList, "loadDataByCustComplete");
		var oStub2 = this.stub($, "ajax");
		//Action
		this.IncidentList._loadCustomerSnowCase("12186");
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, false);
	});
	QUnit.test("Should integrate all incident data together after loading BC* incident and SNow cases", function (assert) {
			//Arrangment   
			this.stub(this.IncidentList,"getResourceBundle").returns({
				getText:function(){return "xxxx";}
			});
			this.oComponent.getModel("IncidentbyCust").setData({
					"BCIncident":{
						"loadComplete": true,
						"results": [{"ID":"33333333333","Priority_sortby":"2","Update_sortby":"1000"},
									{"ID":"55555555555","Priority_sortby":"1","Update_sortby":"2000"}]
					},
					"SnowCase": {
						"loadComplete": true,
						"results": [{"ID":"2222222222","Priority_sortby":"1","Update_sortby":"1000"}]
					},
					"results": []
			});
		var oStub1 = this.stub(this.oComponent.getModel("incidentList"), "setData");
		// var oStub2 = this.stub($, "ajax");
		//Action
		this.IncidentList.loadDataByCustComplete();
		//Assertion
		assert.equal(oStub1.called, true);
	});

QUnit.test("Should nav to Incident detail page when press an incident", function (assert) {
	var oBj = {
		getObject: function () {
			return {
				"ID": "002028376000000010932018"
			};
		}
	};
	var oBinding = {
		getBindingContext: function () {
			return oBj;
		}
	};
	var oEvent = new sap.ui.base.Event();
	this.stub(oEvent, "getSource").returns(oBinding);
	//Action
	var oStubRouter = this.stub(this.IncidentList, "getRouter").returns({
		navTo: function () {}
	});

	this.IncidentList.onIncidentItemPress(oEvent);
	assert.equal(oStubRouter.callCount, 1);
});

QUnit.test("Should filter the incident list when input value in searchfield", function (assert) {
	var oEvent = {
		getSource: function () {
			return {
				getValue: function () {
					return "test";
				}
			};
		}
	};
	var oList = this.IncidentList.getView().byId("idIncidentList");
	var oItems = {
		filter: function () {}
	};
	var oStub = this.stub(oList, "getBinding").returns(oItems);
	//Action
	this.IncidentList.handleIncidentSearch(oEvent);
	assert.equal(oStub.callCount, 1);
});

QUnit.test("Should nav to homepage when press cancel button on incident list", function (assert) {
	var oStub = this.stub(this.IncidentList, "onNavBack");
	//Action
	this.IncidentList.handleIncidentClose();
	assert.equal(oStub.callCount, 1);
});

QUnit.test("Should load business impact of selected incident", function (assert) {
	var oItem = {
		"ID": "002028376000000010932018",
		"Title": "1093/2018New",
		"Description": "Auto generated by Cust Inc Factory Which",
		"Priority": "Very high",
		"PriorityKey": "1"
	};
	var oBinding1 = {
		getSelectedItems: function () {
			return [{
				getBindingContext: function () {
					return {
						getObject: function () {
							return oItem;
						}
					};
				}
			}];
		}
	};
	var oBinding2 = {
		getBindingContextPath: function () {
			return '/results/0';
		}
	};
	var oEvent = new sap.ui.base.Event();
	this.stub(oEvent, "getSource").returns(oBinding1);
	this.stub(oEvent, "getParameter").returns(oBinding2);
	this.oComponent.getModel("incidentList").setProperty("/results/0/ID", "002028376000000010932018");
	//Action
	this.IncidentList.onSelectIncident(oEvent);
	assert.equal(this.oComponent.getModel("createCriticalSituation").getData().BusinessImpact.Text, "");
});

QUnit.test("Should update business impact of selected incident when business impact is already exist", function (assert) {
	this.oComponent.getModel("createCriticalSituation").setData({
		"BusinessImpact": {
			"Text": "",
			"002028376000000010932018": {}
		}
	});
	var oItem = {
		"ID": "002028376000000010932018",
		"Title": "1093/2018New",
		"Description": "Auto generated by Cust Inc Factory Which",
		"Priority": "Very high",
		"PriorityKey": "1"
	};
	var oBinding1 = {
		getSelectedItems: function () {
			return [{
				getBindingContext: function () {
					return {
						getObject: function () {
							return oItem;
						}
					};
				}
			}];
		}
	};
	var oBinding2 = {
		getBindingContextPath: function () {
			return '/results/0';
		}
	};
	var oEvent = new sap.ui.base.Event();
	this.stub(oEvent, "getSource").returns(oBinding1);
	this.stub(oEvent, "getParameter").returns(oBinding2);
	this.oComponent.getModel("incidentList").setProperty("/results/0/ID", "002028376000000010932018");
	//Action
	this.IncidentList.onSelectIncident(oEvent);
	assert.equal(this.oComponent.getModel("createCriticalSituation").getData().BusinessImpact.Text, "");
});

QUnit.test("Should nav to homepage after press save button when selected more then one incident of disable SaM", function (assert) {
	var oStub = this.stub(this.IncidentList, "onNavBack");
	//Action
	this.IncidentList.handleSaveSelect();
	assert.equal(oStub.callCount, 1);
});

QUnit.test("Should check SaMCheck and give message after press save button when selected one incident of enable SaM", function (assert) {
	var oStubRouter = this.stub(this.IncidentList, "getRouter").returns({
		navTo: function () {}
	});
	this.oComponent.getModel("homePageConfig").setProperty("/enableSaM",true);
	var oList = this.IncidentList.getView().byId("idIncidentList");
	var oItem = {
		"ID": "002028376000000010932018",
		"Title": "1093/2018New",
		"Description": "Auto generated by Cust Inc Factory Which",
		"Priority": "Very high",
		"PriorityKey": "1"
	};
	this.stub(oList,"getSelectedItems").returns([{
				getBindingContext: function () {
					return {
						getObject: function () {
							return oItem;
						}
					};
				}
			}]);
	var oData = {"SaMFlag" : "X"};
	this.oStubMsgBoxInfo.yieldsTo("onClose","Schedule a Manager");
	var oStub = this.stub(sap.support.fsc2.oDataBCRequestModel, "read").yieldsTo("success",oData);
	//Action
	this.IncidentList.handleSaveSelect();
	assert.equal(oStub.callCount, 1);
	assert.equal(oStubRouter.callCount, 1);
});

});