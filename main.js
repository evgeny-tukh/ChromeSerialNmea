var port     = new SerialPort ();
var terminal = null;
var pause    = null;
var paused   = true;
var updater  = null;

port.onReceive = function (arrayBuffer)
{
    var byteBuffer = new Uint8Array (arrayBuffer);
    var data;
    var i;

    for (i = 0, data = ''; i < byteBuffer.length; data += String.fromCharCode (byteBuffer [i++]));

    parsers.parse (data);

    if (!paused)
    {
        terminal.innerText += data;
        terminal.scrollTop  = 100000;

        if (terminal.innerText.length > 5000)
            terminal.innerText = '';
    }
};

window.onload = function ()
                {
                    initNmea ();

                    SerialPort.enumPorts (onPortListLoaded);

                    document.getElementById ('openClose').onclick = onOpenClose;

                    terminal = document.getElementById ('terminal');
                    pause    = document.getElementById ('startStopTerminal');

                    pause.onclick = onPauseResumeTerminal;

                    updater = setInterval (onUpdate, 1000);

                    function onPortListLoaded (ports)
                    {
                        var portList = document.getElementById ('port');
                        var i;

                        for (i = 0; i < ports.length; ++ i)
                        {
                            var option = document.createElement ('option');

                            option.innerText = ports [i];

                            portList.appendChild (option);
                        }
                    }

                    function onUpdate ()
                    {
                        for (var typeKey in DataStorage.types)
                        {
                            var type = DataStorage.types [typeKey];
                            var cell = document.getElementById (type);

                            if (cell)
                                cell.innerText = dataStorage.getTextValue (type);
                        }
                    }
                };

function onOpenClose ()
{
    var button = document.getElementById ('openClose');

    if (port.isOpen ())
    {
        port.close ();

        button.innerText = 'Open';
    }
    else
    {
        port.open ();

        button.innerText = 'Close';
    }
}

function onPauseResumeTerminal ()
{
    paused = !paused;

    pause.innerText = paused ? 'Start terminal' : 'Stop terminal';
}
