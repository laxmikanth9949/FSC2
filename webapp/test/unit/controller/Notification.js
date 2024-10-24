sap.ui.define([
	'sap/support/fsc2/controller/Notification.controller',
	'sap/support/fsc2/model/models',
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"

], function (Notification, models, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";
	QUnit.module("Notification", {
		beforeEach: function () {
			this.oNotification = new Notification();
			this.oNotificationModel = new JSONModel();
			this.oNotificationModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/Notification.json"), {}, false);

			this.oComponent = new ManagedObject();
			this.oComponent.setModel(this.oNotificationModel, "notification");
			sinon.stub(this.oNotification, "getOwnerComponent").returns(this.oComponent);
			var oView = {
				byId: function (sId) {},
				setBusy: function () {}
			};
			sinon.stub(this.oNotification, "getView").returns(oView);

			sap.support.fsc2.FSC2Model = new ODataModel({
				json: true,
				useBatch: false,
				serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV",
				defaultUpdateMethod: "Put"
			});
			this.Fsc2Read = sinon.stub(sap.support.fsc2.FSC2Model, "read");
			this.Fsc2Update = sinon.stub(sap.support.fsc2.FSC2Model, "update");
			this.Fsc2Remove = sinon.stub(sap.support.fsc2.FSC2Model, "remove");

		},
		afterEach: function () {
			this.oNotification.destroy();
			this.oNotification.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Init when entering notification page", function (assert) {
		var sAttach = {
			attachPatternMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oNotification, "getRouter").returns(router);

		//Action
		this.oNotification.onInit();
		//Assertion
		assert.equal(oStubRouter.callCount, 1);
	});
	QUnit.test("Should display 4 notification data when user enter to 'Push Notification Message'", function (assert) {
		//Arrangment   
		var oData = this.oNotificationModel.getData();
		sap.support.fsc2.FSC2Model = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/sap/ZS_AGS_FSC2_SRV"
		});
		this.stub(sap.support.fsc2.FSC2Model, "read").yieldsTo("success", oData);

		//Action
		this.oNotification._onRouteMatched();

		//Assertion
		assert.deepEqual(this.oComponent.getModel("notification").getData(), oData);

	});

	QUnit.test("Should nav to CIM request detail page when press a unread notification that objtype is ZS90", function (assert) {
		this.stub(this.oNotification, "_minusBadgeNumber");
		var oBinding = {
			getCustomData: function () {
				return [new sap.ui.core.CustomData({
						"key": "msgkey",
						"value": "0894EF23F8511ED986AAB548AF77FD77"
					}),
					new sap.ui.core.CustomData({
						"key": "actid",
						"value": "0010252522"
					}),
					new sap.ui.core.CustomData({
						"key": "objtype",
						"value": "ZS90"
					})
				];
			},
			getPriority: function () {
				return "Hign";
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBinding);
		this.Fsc2Update.withArgs("/PushnotfmsgSet(msg_key='0894EF23F8511ED986AAB548AF77FD77')").yieldsTo("success", "undefined");
		//Action
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oNotification, "getRouter").returns(router);

		this.oNotification.onPressNotifListItem(oEvent);
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Should nav to MCC activity detail page when press a unread notification that objtype is ZS46", function (assert) {
		this.stub(this.oNotification, "_minusBadgeNumber");
		var oBinding = {
			getCustomData: function () {
				return [new sap.ui.core.CustomData({
						"key": "msgkey",
						"value": "0894EF23F8511ED986AAB548AF77FD77"
					}),
					new sap.ui.core.CustomData({
						"key": "actid",
						"value": "0010252522"
					}),
					new sap.ui.core.CustomData({
						"key": "objtype",
						"value": "ZS46"
					})
				];
			},
			getPriority: function () {
				return "Hign";
			}
		};
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBinding);
		this.Fsc2Update.withArgs("/PushnotfmsgSet(msg_key='0894EF23F8511ED986AAB548AF77FD77')").yieldsTo("success", "undefined");
		//Action
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "navTo");
		var oStubRouter = this.stub(this.oNotification, "getRouter").returns(router);

		this.oNotification.onPressNotifListItem(oEvent);
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Should delete a notification when press delete button", function (assert) {
		this.stub(this.oNotification, "_resetBadgeNumber");
		var oBinding = {
			getCustomData: function () {
				return [new sap.ui.core.CustomData({
						"key": "msgkey",
						"value": "0894EF23F8511ED986AAB548AF77FD77"
					})
				];
			},
			getPriority: function () {
				return "Hign";
			}
		};
		var oStubRouter = this.stub(this.oNotification, "removeNotificationMsg");
		var oEvent = new sap.ui.base.Event();
		this.stub(oEvent, "getSource").returns(oBinding);
		
		this.oNotification.onDeleteNotifListItem(oEvent);
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Should delete all notifications when press 'delete all' button", function (assert) {
		this.stub(this.oNotification, "_resetBadgeNumber");
		var oStubRouter = this.stub(this.oNotification, "removeNotificationMsg");
		var oEvent = new sap.ui.base.Event();
		this.oNotification.onDeleteAll(oEvent);
		assert.equal(oStubRouter.callCount, 1);
	});
	
	QUnit.test("Should delete notification from database", function (assert) {
		this.Fsc2Remove.withArgs("/PushnotfmsgSet(msg_key='0894EF23F8511ED986AAB548AF77FD77')").yieldsTo("success", "undefined");
		var oStubRouter = this.stub(this.oNotification, "loadNotificationData");
		this.oNotification.removeNotificationMsg("0894EF23F8511ED986AAB548AF77FD77");
		assert.equal(oStubRouter.callCount, 1);
	});
});