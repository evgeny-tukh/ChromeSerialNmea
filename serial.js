
/*function enumPorts (callback)
{
    if (typeof (chrome) !== 'undefined' && chrome.serial)
        chrome.serial.getDevices (onGetPortList);

    function onGetPortList (portList)
    {
        var ports = [];

        portList.forEach (function (port)
                         {
                             ports.push (port.path);
                         });

        ports.sort ();

        if (callback)
            callback (ports);
    }
}*/

function SerialPort ()
{
    this.portName  = 'COM1';
    this.baud      = 4800;
    this.byteSize  = 'eight';
    this.parity    = 'no';
    this.stopBits  = 'one';
    this.handle    = null;
    this.bufSize   = 4096;
    this.onReceive = null;

    SerialPort.globals.ports.push (this);
}

SerialPort.enumPorts = function (callback)
{
    if (typeof (chrome) !== 'undefined' && chrome.serial)
        chrome.serial.getDevices (onGetPortList);

    function onGetPortList (portList)
    {
        var ports = [];

        portList.forEach (function (port)
                         {
                             ports.push (port.path);
                         });

        ports.sort ();

        if (callback)
            callback (ports);
    }
};

SerialPort.prototype.delete = function ()
{
    var index = SerialPort.globals.ports.indexOf (this);

    if (index >= 0)
        SerialPort.globals.ports.splice (index, 1);
}

SerialPort.prototype.open = function (onOpen)
{
    var instance = this;
    var options  = { persistent: true, bufferSize: this.bufferSize, bitrate: this.baud, dataBits: this.byteSize, parityBit: this.parity,
                     stopBits: this.stopBits };

    chrome.serial.connect (this.portName, options, callback);

    function callback (info)
    {
        instance.handle = info.connectionId;

        if (onOpen)
            onOpen (instance);
    }
};

SerialPort.prototype.close = function (onClosed)
{
    var instance = this;

    chrome.serial.disconnect (this.handle, callback);

    function callback (closed)
    {
        if (closed)
        {
            instance.handle = null;

            if (onClosed)
                onClosed (instance);
        }
    }
};

SerialPort.prototype.isOpen = function ()
{
    return this.handle !== null;
};

SerialPort.globals = { ports: [] };

chrome.serial.onReceive.addListener (function (info)
                                     {
                                         var handleOwner = SerialPort.globals.ports.find (function (port) { return port.handle === info.connectionId; });

                                         if (handleOwner && handleOwner.onReceive)
                                             handleOwner.onReceive (info.data);
                                     });
