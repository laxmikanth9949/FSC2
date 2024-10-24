/*global history*/
sap.ui.define([
	'sap/support/fsc2/controller/BaseController',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/support/fsc2/model/models',
	'sap/support/fsc2/model/formatter'
], function (BaseController, JSONModel, Filter, ODataModel, models, formatter) {
	"use strict";
	return BaseController.extend("sap.support.fsc2.controller.EscalateIncident", {
		formatter: formatter,
		onInit: function () {
			this.setModel(new JSONModel(jQuery.sap.getModulePath("sap.support.fsc2", "/template/SaMdata.json")),"SaM");
			this.getRouter().getRoute("escalateIncident").attachPatternMatched(this._onRouteMatched, this);
		},
		/******comment: isResuest is false. The view will be Incident Detail******/
		_onRouteMatched: function (oEvent) {
			var oArgs = oEvent.getParameter("arguments");
			this.custnum = oArgs.custnum;
			this.custname = oArgs.custname;
			this.incident = oArgs.incident;
		},
		onCreateRequest:function(){
			if (this.getModel("incidentDetail").getData().CIM_ID) {
				sap.m.MessageBox.information("A CIM request already exists for this incident, please update it.", {
					title: "Information",
					onClose: function () {
						this.getRouter().navTo("requestDetail", {
							id: this.getModel("incidentDetail").getData().CIM_ID,
							transType: "ZS90" //type cim
						});
					}.bind(this)
				});
			}else{
				this.getRouter().navTo("createByIncident", {
					custnum: this.custnum,
					custname: this.custname,
					incident: this.incident
				});
			}
		},
		onNavToSaM:function(){
			this.getRouter().navTo("SaM",{
				incident:this.incident
			});
		}
	});
});