chrome.app.runtime.onLaunched.addListener (function ()
                                           {
                                               chrome.app.window.create ('NmeaSerial.html',
                                                                         { bounds: { width: 800, height: 600, left: 50, top: 50 },
	                                                                   minWidth: 800, minHeight: 600 } );
                                           });

chrome.runtime.onSuspend.addListener (function () {});

chrome.runtime.onInstalled.addListener (function () {});

chrome.app.window.onClosed.addListener (function () {});