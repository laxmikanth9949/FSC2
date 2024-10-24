sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/support/fsc2/model/formatter'
], function (BaseController, JSONModel, Filter, ODataModel, models, formatter) {
	"use strict";

	return BaseController.extend("sap.support.fsc2.controller.EscalationCaseDetail", {
		formatter: formatter,
		onInit: function () {
			this.Offline = false;
			var caseDetailModel = new JSONModel();
			this.setModel(caseDetailModel, "caseDetail");
			// caseDetailModel.loadData(jQuery.sap.getModulePath("sap.support.fsc2", "/template/CaseDetail.json"), {}, false);

			this.setModel(new JSONModel({
				"ShowFavorite": false
			}), "caseDetailPage");
			this.setModel(new JSONModel(), "notes");
			this.getRouter().getRoute("escalationCaseDetail").attachPatternMatched(this._onRouteMatched, this);
			this.getRouter().getRoute("escalationCaseDetailEnd").attachPatternMatched(this._onRouteMatched, this);
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
			var oArgs = oEvent.getParameter("arguments");
			var sRequestId = oArgs.id;
			this.caseId = sRequestId;
			this.loadCaseDetailData(this.caseId);
			// this.getView().byId("idObjectPageLayout").scrollToSection(this.getView().byId("idOverViewSection").getId());
			this.getView().byId("idObjectPageLayout").setSelectedKey("overview");
			// var tempValue = "";
			// var notesArr = this.getModel("caseDetail").getData().results[0].NotesSet.results;
			// if(notesArr.length !== 0){
			// 	var i = 0;
			// 	notesArr.forEach(function(x){
			// 		tempValue += x.tdline;
			// 		i++;
			// 		if(i < notesArr.length){
			// 			tempValue += "\n" + "------------------------------------------------";
			// 			tempValue += "\n\n";
			// 		}

			// 	});
			// }
			// this.getModel("notes").setProperty("/value", tempValue);
		},
		handleClose: function () {
			//when two columns are visible --> close second one, nav to first on fullscreen
			var prevTarget = this.getRouter()._oMatchedRoute._oConfig.target[0];
			var columnPages = this.getRouter().getTarget(prevTarget)._oOptions.controlAggregation;
			if (columnPages === "beginColumnPages") {
				var layout = "OneColumn";
			} else if (columnPages === "midColumnPages") {
				var layout = "MidColumnFullScreen";
			}
			this.getRouter().navTo(prevTarget, {
				layout: layout
			});
		},
		loadCaseDetailData: function (sValue) {
			this.getView().setBusy(true);
			sap.support.fsc2.FSC2Model.read("/CasesSet", {
				filters: [new Filter("case_id", "EQ", sValue),
					new Filter("case_type", "EQ", "ZS01")
				],
				urlParameters: {
					$expand: "NotesSet,AttachmentSet"
				},
				headers: {
					"AppIdentifier": "1XKRDt3vjcF7KMVMqB3QTudt96Z23rDO"
				},
				success: function (oData) {
					if (oData.results && oData.results[0]) {
						this.CustomerNo = oData.results[0].customer_r3_no;
						this.CustomerName = oData.results[0].customer_name;
						this.getModel("caseDetail").setData(oData.results[0]);
						var tempValue = "";
						var notesArr = oData.results[0].NotesSet.results || [];
						if (notesArr.length !== 0) {
							var i = 0;
							notesArr.forEach(function (x) {
								tempValue += x.tdline;
								i++;
								if (i < notesArr.length) {
									tempValue += "\n" + "------------------------------------------------";
									tempValue += "\n\n";
								}
							});
						}
						this.getModel("notes").setProperty("/value", tempValue);
					}
					this.getView().setBusy(false);
				}.bind(this),
				error: function (oError) {
					this.getView().setBusy(false);
					this.showErrorMessage(oError);
				}.bind(this)
			});
		},
		onSetFavorite: function () {
			sap.support.fsc2.UserProfileModel.create("/Entries", {
				"Attribute": "FAVORITE_ESCALATION_REQUESTS",
				"Value": this.caseId
			}, {
				success: function () {
					this.getModel("caseDetailPage").setProperty("/ShowFavorite", true);
					// that.loadReqeustData(that.objectId, false);
				}.bind(this)
			});
		},
		onRemoveFavorite: function () {
			// this.getModel("caseDetailPage").setProperty("/ShowFavorite", false);
			this.eventUsage(false, "Set \'Global Escalation Case\' unfavorite");
			sap.support.fsc2.UserProfileModel.read("/Entries", {
				filters: [
					new Filter("Attribute", "EQ", "FAVORITE_ESCALATION_REQUESTS")
				],
				success: function (oData) {
					for (var i = 0; i < oData.results.length; i++) {
						if (oData.results[i].Value === this.caseId) {
							sap.support.fsc2.UserProfileModel.remove("/Entries(Username='',Attribute='FAVORITE_ESCALATION_REQUESTS',Field='" + oData.results[
									i].Field +
								"')", {
									success: function () {
										this.getModel("caseDetailPage").setProperty("/ShowFavorite", false);
									}.bind(this)
								});
							break;
						}
					}
				}.bind(this),
				error: function (oError) {
					sap.m.MessageToast.show("UserProfile Service Unavailable!");
				}.bind(this)
			});
		},

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.support.fsc2.view.EscalationCase
		 */
		//	onInit: function() {
		//
		//	},

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.support.fsc2.view.EscalationCase
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.support.fsc2.view.EscalationCase
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.support.fsc2.view.EscalationCase
		 */
		//	onExit: function() {
		//
		//	}

	});

});