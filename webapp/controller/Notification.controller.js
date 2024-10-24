sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/support/fsc2/model/formatter',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/m/MessageBox'
], function (BaseController, formatter, JSONModel, Filter, ODataModel, models, MessageBox) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.Notification", {
		formatter: formatter,
		onInit: function () {
			this.Offline = true;
			var notificationModel = new JSONModel();
			this.setModel(notificationModel, "notification");
			// notificationModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/Notification.json"), {}, false);

			this.getRouter().getRoute("notification").attachPatternMatched(this._onRouteMatched, this);
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
			this.loadNotificationData(this._syncBadgeNumber);
		},
		onPressNotifListItem: function (oEvent) {
			this._minusBadgeNumber(oEvent);
			var oCustomData = oEvent.getSource().getCustomData();
			var sMsgKey = oCustomData[0].getValue();
			if (sMsgKey) {
				sap.support.fsc2.FSC2Model.update("/PushnotfmsgSet(msg_key='" + sMsgKey + "')", {
					"msg_key": sMsgKey
				}, {
					success: function (oSuccess) {
						this.loadNotificationData();
						// this.getRouter().navTo("mccDetail", {
						// 	activity_id: oCustomData[1].getValue()
						// });
						var transType = oCustomData[2].getValue();
						if (transType === "ZS90") { // cim request
							this.getRouter().navTo("requestDetailEnd", {
								layout: "EndColumnFullScreen",
								id: oCustomData[1].getValue()
							});
						} else if (transType === "ZS46") {
							this.getRouter().navTo("mccDetailEnd", {
								layout: "EndColumnFullScreen",
								activity_id: oCustomData[1].getValue()
							});
						}
					}.bind(this),
					error: function (oError) {
						this.showErrorMessage(oError);
					}.bind(this),
				});
			}
		},
		onDeleteAll: function (oEvent) {
			this._resetBadgeNumber();
			this.removeNotificationMsg("DELETE_ALL");
		},
		onDeleteNotifListItem: function (oEvent) {
			this._minusBadgeNumber(oEvent);
			var oCustomData = oEvent.getSource().getCustomData();
			var sMsgKey = oCustomData[0].getValue();
			this.removeNotificationMsg(sMsgKey);
		},
		removeNotificationMsg: function (sMsgKey) {
			if (sMsgKey) {
				sap.support.fsc2.FSC2Model.remove("/PushnotfmsgSet(msg_key='" + sMsgKey + "')", {
					success: function (oSuccess) {
						this.loadNotificationData();
					}.bind(this),
					error: function (oError) {
						this.showErrorMessage(oError);
					}.bind(this)
				});
			}
		},
		_syncBadgeNumber: function (component) {
			if (sap.Push) {
				var curBadgeNum = 0;
				var aMsg = component.getModel("notification").getData();
				aMsg.results.forEach(function (x) {
					if (x.is_read === "") {
						curBadgeNum++;
					}
				});
				// $.each(aMsg, function(index, item) {
				// 	if (item.is_read === "") {
				// 		curBadgeNum ++;
				// 	}
				// });
				sap.Push.setBadgeNumber(curBadgeNum);
			}
		},
		_minusBadgeNumber: function (oEvent) {
			if (sap.Push && oEvent.getSource().getPriority() === "High") {
				sap.Push.getBadgeNumber(function (nCount) {
					if (nCount > 0) {
						sap.Push.setBadgeNumber(nCount - 1);
					}
				});
			}
		},
		_resetBadgeNumber: function () {
			if (sap.Push) {
				//sap.Push.resetBadge(this.getOwnerComponent().resetBadgeSuccess);
				sap.Push.setBadgeNumber(0);
			}
		}
	});
	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf sap.support.fsc2.view.Notification
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf sap.support.fsc2.view.Notification
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf sap.support.fsc2.view.Notification
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf sap.support.fsc2.view.Notification
	 */
	//	onExit: function() {
	//
	//	}

});