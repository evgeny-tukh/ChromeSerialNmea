chrome.app.runtime.onLaunched.addListener (function ()
                                           {
                                               chrome.app.window.create ('NmeaSerial.html',
                                                                         { bounds: { width: 1160, height: 960, left: 100, top: 100 },
	                                                                   minWidth: 1160, minHeight: 960 } );
                                           });

chrome.runtime.onSuspend.addListener (function () {});

chrome.runtime.onInstalled.addListener (function () {});

chrome.app.window.onClosed.addListener (function () {});