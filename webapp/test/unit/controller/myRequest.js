sap.ui.require([
	"sap/support/fsc2/controller/myRequest.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (Request, model, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("RequestPage", {
		beforeEach: function () {
			this.oRequest = new Request();
			this.oRequestSetModel = new JSONModel();
			this.oRequestSetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/Request.json"), {}, false);

			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oRequestSetModel, "requestSet");
			sinon.stub(this.oRequest, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				setBusy: function () {},
				byId: function (sId) {},
			};
			this.oControl = {
				setVisible: function () {},
			};
			sinon.stub(this.oRequest, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			sinon.stub(this.oRequest, "getEventBus").returns(oEventBus);
			this.oComponent.setModel(new JSONModel({
				"myRequests": 0,
				"myFavorites": 0
			}), "homePageCount");
			this.oComponent.setModel(new JSONModel({
				"expertMode": false
			}), "homePageConfig");
			sinon.stub(this.oRequest, "tbUnvisible");
			sinon.stub(this.oRequest, "eventUsage");
		},
		afterEach: function () {
			this.oRequest.destroy();
			this.oRequest.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});

	QUnit.test("Load top 5 my request data when enter in the app ", function (assert) {
		//Arrangment   
		var oData = this.oRequestSetModel.getData();
		sap.support.fsc2.FSC2Model = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
		});
		this.stub(sap.support.fsc2.FSC2Model, "read").yieldsTo("success", oData);
		this.byId.withArgs("tbShowMore").returns(this.oControl);
		//Action
		this.oRequest._onRouteMatched();

		//Assertion
		assert.deepEqual(this.oComponent.getModel("requestSet").getData(), oData);
	});

	QUnit.test("Nav to detail page when click on my request entry", function (assert) {
		//Arrangment   
		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						Action: "myrequest",
						TransType: "ZS90",
						ID: "10000448"
					};
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
		// var oStubRouter = this.stub(this.oRequest, "getRouter").returns(router);
		var oStub = this.stub(this.oRequest, "onNavToCriticalRequest", 2);
		//Action
		this.oRequest.onRequestItemPress(oEvent);
		//Assertion

		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Load all my request data when cilcking 'show more' button", function (assert) {
		//Arrangment   
		var oData = this.oRequestSetModel.getData();
		sap.support.fsc2.FSC2Model = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
		});
		this.stub(sap.support.fsc2.FSC2Model, "read").yieldsTo("success", oData);
		this.byId.withArgs("tbShowMore").returns(this.oControl);
		var getParent = function () {
			var oParent = {
				setVisible: function () {}
			};
			return oParent;
		};
		var oBindingContext = {
			getParent: getParent
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBindingContext);
		//Action
		this.oRequest.onShowMore(oEvent);

		//Assertion
		assert.deepEqual(this.oComponent.getModel("requestSet").getData(), oData);
	});

});