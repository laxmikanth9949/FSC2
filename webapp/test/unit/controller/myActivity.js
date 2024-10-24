sap.ui.require([
	"sap/support/fsc2/controller/myActivity.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (Activity, model, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("AssignedToMePage", {
		beforeEach: function () {
			this.oActivity = new Activity();
			this.oActivitySetModel = new JSONModel();
			this.oActivitySetModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/FSC2ActivitySet.json"), {}, false);

			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oActivitySetModel, "activitySet");
			sinon.stub(this.oActivity, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				setBusy: function () {},
				byId: function (sId) {},
			};
			this.oControl = {
				setVisible: function () {},
				getSelectedKey:function () {}
			};
			sinon.stub(this.oActivity, "getView").returns(oView);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			var oEventBus = {
				publish: function(){},
				subscribe: function(){}
			};
			sinon.stub(this.oActivity, "getEventBus").returns(oEventBus);
			this.oComponent.setModel(new JSONModel({
				"myRequests": 0,
				"myFavorites": 0,
				"myActivities":0
			}), "homePageCount");
			// sinon.stub(this.oActivity, "tbUnvisible");
			sinon.stub(this.oActivity, "eventUsage");
		},
		afterEach: function () {
			this.oActivity.destroy();
			this.oActivity.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});

	QUnit.test("Load top 5 my activity data when enter in the app ", function(assert) {
		//Arrangment   
		var oData = this.oActivitySetModel.getData();
		sap.support.fsc2.FSC2Model = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
		});
		this.stub(sap.support.fsc2.FSC2Model, "read").yieldsTo("success", oData);
		//Action
		this.oActivity._onRouteMatched();
		
		//Assertion
		assert.deepEqual(this.oComponent.getModel("activitySet").getData(), oData);
	});

	QUnit.test("Nav to detail page when click on my activity entry", function (assert) {
		//Arrangment   
		var getBindingContext = function (sModelName) {
			var oBindObject = {
				getObject: function () {
					return {
						activity_id: "343492"
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

		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oActivity, "getRouter").returns(router);

		//Action
		this.oActivity.onActivityItemPress(oEvent);
		//Assertion

		assert.equal(oStubRouter.callCount, 1);
	});
});