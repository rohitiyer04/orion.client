/*******************************************************************************
 * @license
 * Copyright (c) 2011, 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
/*eslint-env browser, amd*/
/*global URL*/
var _editor_script_source = null; //We need to know where the editor script lives
var _all_script = document.getElementsByTagName('script');
if (_all_script && _all_script.length && _all_script.length > 0) {
	for (var j = 0; j < 2; j++) { // try twice in all the script tags
		for (var i = 0; i < _all_script.length; i++) {
			if (j === 0) { //First try: if the script id is ""orion.browse.browser""
				if (_all_script[i].id === "orion.editor.embeddedEditor") {
					_editor_script_source = _all_script[i].src;
					break;
				}
			} else {
				var regex = /.*built-embeddedEditor.*.js/;
				if (_all_script[i].src && regex.exec(_all_script[i].src)) {
					_editor_script_source = _all_script[i].src;
					break;
				}
			}
		}
		if (_editor_script_source) {
			break;
		}
	}
	if (!_editor_script_source) {
		_editor_script_source = _all_script[_all_script.length - 1].src;
	}
}
define([
	'embeddedEditor/helper/embeddedFileImpl',
	'orion/serviceregistry',
	'orion/pluginregistry',
	'orion/Deferred',
	'orion/URL-shim'
], function(
	EmbeddedFileImpl,
	mServiceRegistry, 
	mPluginRegistry,
	Deferred
) {

	var once; // Deferred
	var fPattern = "/__embed/";
	var defaultPluginURLs = [
		"../plugins/webToolsPlugin_stand_alone.html",
		"../plugins/javascriptPlugin_stand_alone.html",
		"../plugins/webEditingPlugin.html",
		"../plugins/languageToolsPlugin.html"
		/*
		"../../webtools/plugins/webToolsPlugin.html",
		"../../javascript/plugins/javascriptPlugin.html",
		"../../plugins/webEditingPlugin.html",
		"../../plugins/languageToolsPlugin.html"*/
	];

	function startup() {
		if (once) {
			return once;
		}
		once = new Deferred();
		var serviceRegistry = new mServiceRegistry.ServiceRegistry();
		var fService = new EmbeddedFileImpl(fPattern);
		serviceRegistry.registerService("orion.core.file", fService, {
			Name: 'Embedded File System',
			top: fPattern,
			pattern: fPattern
		});
		var plugins = {};
		defaultPluginURLs.forEach(function(pluginURLString){
			var pluginURL = new URL(pluginURLString, _editor_script_source);
			plugins[pluginURL.href] = {autostart: "lazy"};
		});
		var pluginRegistry = new mPluginRegistry.PluginRegistry(serviceRegistry, {
			storage: {},
			plugins: plugins
		});
		return pluginRegistry.start().then(function() {
			var result = {
				serviceRegistry: serviceRegistry,
				pluginRegistry: pluginRegistry
			};
			once.resolve(result);
			return result;
		});
	}
	return {startup: startup};
});