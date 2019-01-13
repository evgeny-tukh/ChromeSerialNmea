var dataStorage;

chrome.app.runtime.onLaunched.addListener (function ()
                                           {
                                               chrome.app.window.create ('NmeaSerial.html',
                                                                         { bounds: { width: 800, height: 600, left: 50, top: 50 },
	                                                                   minWidth: 800, minHeight: 600 },
                                                                         function (wnd)
                                                                         {
                                                                             wnd.contentWindow.setDataStorage = function (obj)
                                                                                                                {
                                                                                                                    dataStorage = obj;
                                                                                                                };
                                                                         });
                                           });

chrome.runtime.onSuspend.addListener (dummy);

chrome.runtime.onInstalled.addListener (dummy);

chrome.app.window.onClosed.addListener (dummy);

chrome.runtime.onConnectExternal.addListener (onConnectByClient);
chrome.runtime.onConnect.addListener (onConnectLocally);

function dummy ()
{
}

function onConnectLocally (port)
{
    port.onMessage.addListener (function (msg)
                                {
                                    dataStorage = msg;
                                });
}

function onConnectByClient (port)
{
    var timer;

    port.onDisconnect.addListener (function ()
                                   {
                                       clearInterval (timer);
                                   });

    timer = setInterval (function ()
                         {
                             port.postMessage (dataStorage);
                         },
                         1000);
}
