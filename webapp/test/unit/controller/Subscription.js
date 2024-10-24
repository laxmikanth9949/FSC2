sap.ui.require([
	"sap/support/fsc2/controller/Subscription.controller",
	"sap/support/fsc2/model/models",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (Subscription, model, ManagedObject, ResourceModel, JSONModel, ODataModel) {
	"use strict";

	QUnit.module("SubscriptionSettingPage", {
		beforeEach: function () {
			this.oSubscription = new Subscription();
			var checkBoxType = new JSONModel({
				VH: "1",
				H: "3",
				status: "chg_status",
				proOrg: "chg_pro_org",
				component: "chg_component"
			});

			this.oComponent = new ManagedObject();
			this.oComponent.setModel(checkBoxType, "checkBoxType");
			this.oComponent.setModel(new JSONModel(), "favoriteCustModel");
			this.oComponent.setModel(new JSONModel(), "favoriteIcdModel");
			this.oComponent.setModel(new JSONModel(), "notifiModel");
			this.oComponent.setModel(new JSONModel({
				customerExpand: true,
				incidentExpand: false
			}), "expandJson");
			sinon.stub(this.oSubscription, "getOwnerComponent").returns(this.oComponent);
			var oModel = {
				getData: function () {},
				setData: function () {},
				getProperty: function () {
					return {
						loadComplete: true,
						results: [{
							"ID": "XXXX"
						}]
					};
				},
				setProperty: function () {}
			};
			var oView = {
				setBusy: function () {},
				byId: function (sId) {},
				setModel: function () {},
				getModel: function () {
					return oModel;
				}
			};
			this.oControl = {
				setVisible: function () {},
				getSelectedKey: function () {},
				setBusy: function () {}
			};
			sinon.stub(this.oSubscription, "getView").returns(oView);
			sinon.stub(this.oSubscription, "getModel").returns(oModel);
			this.byId = sinon.stub(oView, "byId").returns(this.oControl);
			var oEventBus = {
				publish: function () {},
				subscribe: function () {}
			};
			sinon.stub(this.oSubscription, "getEventBus").returns(oEventBus);
		},
		afterEach: function () {
			this.oSubscription.destroy();
			this.oSubscription.getOwnerComponent.restore();
			this.oComponent.destroy();
		}
	});
	QUnit.test("Should initate all data model when open the subacription setting page ", function (assert) {
		var sAttach = {
			attachMatched: function () {}
		};
		var router = new sap.ui.core.routing.Router();
		this.stub(router, "getRoute").returns(sAttach);
		var oStubRouter = this.stub(this.oSubscription, "getRouter").returns(router);
		var oStub1 = this.stub(this.oSubscription, "_varGlobalInstances");
		// var oStub2 = this.stub(this.oSubscription,"_onRouteMatched");
		this.oSubscription.onInit();
		assert.equal(oStub1.callCount, 1);
		assert.equal(oStubRouter.callCount, 1);
	});

	QUnit.test("Should create model anc global variant when call function _varGlobalInstances", function (assert) {
		var oStub = this.stub(this.oComponent, "setModel");
		var oView = this.oSubscription.getView();
		var oStub2 = this.stub(oView, "setModel");
		this.oSubscription._varGlobalInstances();
		assert.equal(oStub.callCount, 2);
		assert.equal(oStub2.callCount, 3);
	});

	QUnit.test("Should run function _getFavoriteDatas to load data when call function _onRouteMatched", function (assert) {
		var oStub = this.stub(this.oSubscription, "_getFavoriteDatas");
		this.oSubscription._onRouteMatched();
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Should refresh model expandJson when call function onTabBarSelected", function (assert) {
		var oEvent = {
			getSource: function () {
				return {
					getProperty: function () {
						return "_Customer_Incident";
					}
				};
			}
		};
		var oView = this.oSubscription.getView();
		var oModel = {
			refresh: function () {},
			getData: function () {
				return {};
			}
		};
		var oStubRefresh = this.stub(oModel, "refresh");
		this.stub(oView, "getModel").returns(oModel);
		this.oSubscription.onTabBarSelected(oEvent);
		assert.equal(oStubRefresh.callCount, 1);
	});

	QUnit.test("Should start load customer related notification until favorite customers loaded completely", function (assert) {
		//Arrangment   
		var oModel = this.oSubscription.getModel("favorite");
		this.stub(oModel, "getProperty").returns({
			loadComplete: false,
			results: []
		});
		sap.support.fsc2.oDataIcdList = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		var oStub = this.stub(sap.support.fsc2.oDataIcdList, "read");
		//Action
		this.oSubscription.loadCustNotif();

		//Assertion
		assert.deepEqual(oStub.called, false);
	});

	QUnit.test("Should return emptydata for customer related notification when there is no favorite customer", function (assert) {
		//Arrangment   
		var oModel = this.oSubscription.getModel("favorite");
		this.stub(oModel, "getProperty").returns({
			loadComplete: true,
			results: []
		});
		sap.support.fsc2.oDataIcdList = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		var oStub = this.stub(sap.support.fsc2.oDataIcdList, "read");
		//Action
		this.oSubscription.loadCustNotif();

		//Assertion
		assert.deepEqual(oStub.called, false);
	});

	QUnit.test("Should load customer related notification when call function loadCustNotif", function (assert) {
		//Arrangment   
		this.oSubscription.loadCout = 1;
		sap.support.fsc2.oDataIcdList = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		var oData = {
			results: [{
				"ID": ""
			}]
		};
		this.stub(sap.support.fsc2.oDataIcdList, "read").yieldsTo("success", oData);
		//Action
		this.oSubscription.loadCustNotif();

		//Assertion
		assert.deepEqual(this.oSubscription.aCustNotifity, oData.results);
	});

	QUnit.test("Should start load incident related notification until favorite incidents loaded completely", function (assert) {
		//Arrangment   
		var oModel = this.oSubscription.getModel("favorite");
		this.stub(oModel, "getProperty").returns({
			loadComplete: false,
			results: []
		});
		sap.support.fsc2.oDataIcdList = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		var oStub = this.stub(sap.support.fsc2.oDataIcdList, "read");
		//Action
		this.oSubscription.loadIcdNotif();

		//Assertion
		assert.deepEqual(oStub.called, false);
	});

	QUnit.test("Should return empty data for Incident related notification when there is no favorite incidents", function (assert) {
		//Arrangment   
		var oModel = this.oSubscription.getModel("favorite");
		this.stub(oModel, "getProperty").returns({
			loadComplete: true,
			results: []
		});
		sap.support.fsc2.oDataIcdList = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		var oStub = this.stub(sap.support.fsc2.oDataIcdList, "read");
		//Action
		this.oSubscription.loadIcdNotif();

		//Assertion
		assert.deepEqual(oStub.called, false);
	});

	QUnit.test("Should load incident related notification when call function loadIcdNotif", function (assert) {
		//Arrangment   
		this.oSubscription.loadCout = 1;
		sap.support.fsc2.oDataIcdList = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		var oData = {
			results: [{
				"ID": ""
			}]
		};
		this.stub(sap.support.fsc2.oDataIcdList, "read").yieldsTo("success", oData);
		//Action
		this.oSubscription.loadIcdNotif();

		//Assertion
		assert.deepEqual(this.oSubscription.aIcdNotifity, oData.results);
	});
	QUnit.test("should reload all subscription data when run function _getFavoriteDatas", function (assert) {
		//Arrangment   
		var oStub1 = this.stub(this.oSubscription, "loadCustNotif");
		var oStub2 = this.stub(this.oSubscription, "loadIcdNotif");
		sap.support.fsc2.UserProfileModel = new ODataModel({
			json: true,
			useBatch: false,
			serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
		});
		var oData = {
			"results": [{
				"Value": true
			}]
		};
		var oStub3 = this.stub(sap.support.fsc2.UserProfileModel, "read").yieldsTo("success", oData);
		//Action
		this.oSubscription._getFavoriteDatas();
		//Assertion
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
		assert.deepEqual(oStub3.called, true);
	});

	QUnit.test("Should run function _getFavoriteDatas when call function _refreshFavData", function (assert) {
		var oStub = this.stub(this.oSubscription, "_getFavoriteDatas");
		this.oSubscription._refreshFavData();
		assert.equal(oStub.callCount, 1);
	});

	QUnit.test("Should return boolean type data when call function setCheckBoxCust", function (assert) {
		this.oSubscription.aCustNotifity = [{
			"customer": "12186",
			"priority": "1",
			"chg_status": "X"
		}, {
			"customer": "10010",
			"priority": "3",
			"chg_status": "X"
		}];
		var sResult = this.oSubscription.setCheckBoxCust("12186", "1");
		assert.equal(sResult, true);
	});

	QUnit.test("Should return boolean type data when call function setCheckBoxCIM", function (assert) {
		this.oSubscription.aIcdNotifity = [{
			"incident_no": "002028376600002337942019",
			"proOrg": "X",
			"status": "X",
			"component": ""
		}];
		var sResult = this.oSubscription.setCheckBoxCIM("002028376600002337942019", "status");
		assert.equal(sResult, true);
	});

	QUnit.test("Should update customer subscription data when select a checkBox under customers ", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("success", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return true;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "customerNum",
								value: "12186"
							}),
							new sap.ui.core.CustomData({
								key: "priority",
								value: "1"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCust(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, false);
	});
	
	QUnit.test("Should give error message and refresh all data  when select customer subscription checkBox ", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("error", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return true;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "customerNum",
								value: "12186"
							}),
							new sap.ui.core.CustomData({
								key: "priority",
								value: "1"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCust(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});

	QUnit.test("Should update customer subscription data when deselect a checkBox under customers ", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("success", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return false;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "customerNum",
								value: "12186"
							}),
							new sap.ui.core.CustomData({
								key: "priority",
								value: "1"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCust(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, false);
	});
	
	QUnit.test("Should give error message and refresh all data  when deselect customer subscription checkBox", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("error", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return false;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "customerNum",
								value: "12186"
							}),
							new sap.ui.core.CustomData({
								key: "priority",
								value: "1"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCust(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	
	QUnit.test("Should update incident subscription data when select a checkBox under incidents ", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("success", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return true;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "icdNum",
								value: "002028376600002337942019"
							}),
							new sap.ui.core.CustomData({
								key: "property",
								value: "status"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCIM(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, false);
	});
	
	QUnit.test("Should give error message and refresh all data  when select incident subscription checkBox", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("error", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return true;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "icdNum",
								value: "002028376600002337942019"
							}),
							new sap.ui.core.CustomData({
								key: "property",
								value: "status"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCIM(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
   
	QUnit.test("Should update incident subscription data when deselect a checkBox under incidents ", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("success", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
			var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return false;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "icdNum",
								value: "002028376600002337942019"
							}),
							new sap.ui.core.CustomData({
								key: "property",
								value: "status"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCIM(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, false);
	});
	
	QUnit.test("Should give error message and refresh all data  when deselect incident subscription checkBox", function (assert) {
		sap.support.fsc2.oDataIcdListPut = new ODataModel({
			json: true,
			serviceUrl: "/sap/opu/odata/SVC/SID_GATEWAY_SRV"
		});
		this.stub(sap.support.fsc2.oDataIcdListPut, "update").yieldsTo("error", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_refreshFavData");
		var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return false;
					},
					setBusy: function () {},
					getCustomData: function () {
						var sCustData = [
							new sap.ui.core.CustomData({
								key: "icdNum",
								value: "002028376600002337942019"
							}),
							new sap.ui.core.CustomData({
								key: "property",
								value: "status"
							})
						];
						return sCustData;
					}
				};
				return oSource;
			}
		};
		this.oSubscription.selectCheckBoxCIM(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});

	QUnit.test("Should update Entries of UserModel when select the checkBox for push notification ", function (assert) {
		sap.support.fsc2.UserProfileModel = new ODataModel({
			json: true,
			useBatch: false,
			serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
		});
		this.stub(sap.support.fsc2.UserProfileModel, "update").yieldsTo("success", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_getFavoriteDatas");
			var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return true;
					},
					setBusy: function () {}
				};
				return oSource;
			}
		};
		this.oSubscription.handlePushNotiCheckBoxSelect(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	
	QUnit.test("Should update Entries of UserModel when deselect the checkBox for push notification ", function (assert) {
		sap.support.fsc2.UserProfileModel = new ODataModel({
			json: true,
			useBatch: false,
			serviceUrl: "/sap/opu/odata/SVT/USER_PROFILE_SRV"
		});
		this.stub(sap.support.fsc2.UserProfileModel, "update").yieldsTo("success", {});
		var oStub1 = this.stub(sap.m.MessageToast, "show");
		var oStub2 = this.stub(this.oSubscription, "_getFavoriteDatas");
			var oEvent = {
			getSource: function () {
				var oSource = {
					getSelected: function () {
						return false;
					},
					setBusy: function () {}
				};
				return oSource;
			}
		};
		this.oSubscription.handlePushNotiCheckBoxSelect(oEvent);
		assert.equal(oStub1.called, true);
		assert.equal(oStub2.called, true);
	});
	
	QUnit.test("Should return selected status when run formatter function setNotiSelected", function (assert) {
		assert.equal(this.oSubscription.setNotiSelected("YES"), true);
			assert.equal(this.oSubscription.setNotiSelected(""), false);
	});
	
});