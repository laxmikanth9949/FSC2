sap.ui.define([
	"sap/support/fsc2/model/models",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(models) {
	"use strict";
	QUnit.module("model - models: Test cases for models functions");

	QUnit.test("Should get 'OneWay' binding mode when creating a device model", function(assert) {
		assert.strictEqual(models.createDeviceModel().getDefaultBindingMode(), "OneWay");
	});
	
	QUnit.test("Should get 'OneWay' binding mode when creating a favorite model", function(assert) {
		assert.strictEqual(models.createFavoriteModel().getDefaultBindingMode(), "TwoWay");
	});
	QUnit.test("Should get 'OneWay' binding mode when creating a customer detail model", function(assert) {
		assert.strictEqual(models.createCustomerDetailModel().getDefaultBindingMode(), "TwoWay");
	});
});