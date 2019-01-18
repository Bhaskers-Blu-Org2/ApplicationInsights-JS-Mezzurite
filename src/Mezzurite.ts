// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {ITelemetryPlugin, ITelemetryItem, IConfiguration, 
        IAppInsightsCore } from "@microsoft/applicationinsights-core-js";

import {IPageViewPerformanceTelemetry } from "@microsoft/applicationinsights-common";

/**
 * Application Insights PlugIn for Mezzurite Timings
 */
export class MezzuritePlugIn implements ITelemetryPlugin{
    private initialized: boolean;
    private _appInsights: any;
    private _nextPlugin: ITelemetryPlugin;

    public constructor(){
        this.initialized = false;
        if (!(<any>window).mezzurite) {
            (<any>window).mezzurite = {};
        }

        if (!(<any>window).mezzurite.EventElement){
            (<any>window).mezzurite.EventElement = {};
            (<any>window).mezzurite.EventElement = document.createTextNode("");
        }
        (<any>window).mezzurite.EventElement.addEventListener('Timing', (e) => { this.log(e.detail) } , false);
    }

    /**
     * Returns this plugin
     */
    public plugin(): ITelemetryPlugin{
        return this;
    }

    /**
     * Name of our plugin
     */
    public identifier: string = "MezzuritePlugin";

    /**
     * No Op, needed for interface
     * @param item incoming telementry item.
     */
    public processTelemetry(item: ITelemetryItem) {
        if (this._nextPlugin && this._nextPlugin.processTelemetry) {
            this._nextPlugin.processTelemetry(item);
        }
    }

    /**
     * Just grab the next plugIn
     * @param next Next PlugIn to process
     */
    public setNextPlugin(next: ITelemetryPlugin) {
        if (next) {
            this._nextPlugin = next;
        }
    }

    /**
     * This method gets an instance of the ApplicaitonInsightsAnalytics plugIn so that we can send our logs
     * @param config AppInsigts Config
     * @param core AppInsight Core Lib
     * @param extensions AppInsights Extensions
     */
    public initialize(config: IConfiguration, core: IAppInsightsCore, extensions: ITelemetryPlugin[]) {
        this.initialized = true;
        extensions.forEach((e => {
            if (e.identifier === "ApplicationInsightsAnalytics")
            this._appInsights = e;
        }))
    }
    
    /**
     * 
     * @param e This is the telemetry Object from Mezzurite. It supports the following:
     *          Framework: (name of spa framework and version) 
     *          Behavior: (Defualt autolog) Name of the timing action
     *          ViewPortHeight:  Height of the viewport when logged
     *          ViewPortWidth:  Width of the viewport when logged
     *          SystemTiming: (optional)  Used to store data from the Perfomrance Object
     *          Timing: (optional) This is where the Mezzurite Data is passed in.
     *          RouteUrl:  This is the path supplied by the spa framework for the current route.
     *          
     */
    public log(e :any)
    {
        let customProperties = <any>{};
        let url = "";
            url = window.location && window.location.href || "";

        if (e.RouteUrl){
                url = e.RouteUrl;
        }

        let event: IPageViewPerformanceTelemetry ={
            name: window.document && window.document.title || "",
            url:  url
        };

        // setting to -1 as this is an auto logged event.
        let behavior = -1; 
        if (e.Behavior) {
            behavior = e.Behavior;
        }
        customProperties.behavior = behavior;

        if (e.SystemTiming){
            customProperties.systemTiming = JSON.stringify( e.SystemTiming);
        }
        if (e.Timing) {
            customProperties.customTiming = JSON.stringify(e.Timing);
        }
        
        if (e.ViewportHeight){
            customProperties.vpHeight = e.ViewportHeight;
        }
        if (e.ViewportWidth){
            customProperties.vpWidth = e.ViewportWidth;
        }
        if (e.Framework)
        {
            customProperties.framework = JSON.stringify(e.Framework);
        }
        
        this._appInsights.trackPageViewPerformance(event , customProperties);
    }
    
    public priority: number =  172;
}