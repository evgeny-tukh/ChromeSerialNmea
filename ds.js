function DataStorage ()
{
    var instance = this;

    this.data     = {};
    this.watchdog = setInterval (function () { DataStorage.prototype.removeDeads.apply (instance); }, 1000);
}

DataStorage.types = { Lat: 'lat', Lon: 'lon', UTC: 'utc', SOG: 'sog', COG: 'cog', HDG: 'hdg', STW: 'stw', PosMode: 'pmode', GpsQuality: 'gqual', GyroMode: 'gmode' };

DataStorage.prototype.update = function (type, data)
{
    this.data [type] = { updated: getCurTime (), data: data };
};

DataStorage.formatNumberLZ = function (value, fullLen, precision)
{
    var result;

    if (typeof (precision) === 'undefined')
        precision = 0;

    result = precision ? value.toFixed (precision) : value.toString ();

    while (result.length < fullLen)
        result = '0' + result;

    return result;
};

DataStorage.formatCoord = function (value, degLen, wsChars)
{
    var absVal = Math.abs (value);
    var deg    = Math.floor (absVal);
    var min    = (absVal - deg) * 60;
    var ws     = value >= 0 ? wsChars [0] : wsChars [1];

    deg = DataStorage.formatNumberLZ (deg, degLen);
    min = DataStorage.formatNumberLZ (min, 6, 3);

    return deg + ' ' + min + ws;
};

DataStorage.formatLat = function (value)
{
    return DataStorage.formatCoord (value, 2, 'NS');
};

DataStorage.formatLon = function (value)
{
    return DataStorage.formatCoord (value, 3, 'EW');
};

DataStorage.formatAngle = function (value)
{
    return DataStorage.formatNumberLZ (value, 5, 1);
};

DataStorage.formatUTC = function (value)
{
    var utc = new Date ();

    utc.setTime (value);

    return DataStorage.formatNumberLZ (utc.getUTCHours (), 2) + ':' +
           DataStorage.formatNumberLZ (utc.getUTCMinutes (), 2) + ':' +
           DataStorage.formatNumberLZ (utc.getUTCSeconds (), 2);
};

DataStorage.getTextValue = function (type, value)
{
    if (value)
    {
        if (type === DataStorage.types.Lat)
            value = DataStorage.formatLat (value);
        else if (type === DataStorage.types.Lon)
            value = DataStorage.formatLon (value);
        else if (type === DataStorage.types.UTC)
            value = DataStorage.formatUTC (value);
        else if (type === DataStorage.types.SOG || type === DataStorage.types.STW)
            value = value.toFixed (1) + 'kn';
        else if (type === DataStorage.types.COG || type === DataStorage.types.HDG)
            value = DataStorage.formatAngle (value);
        else
            value = null;
    }

    return value;
}

DataStorage.prototype.getTextValue = function (type, value)
{
    if (typeof (value) === 'undefined')
        value = type in this.data ? this.data [type] : null;

    value = DataStorage.getTextValue (type, value.data);

    return value ? value.toString () : 'N/A';
};

DataStorage.prototype.removeDeads = function ()
{
    var now     = getCurTime ();
    var newData = {};

    for (var type in this.data)
    {
        var item = this.data [type];

        if ((now - item.updated) < 30000)
            newData [type] = item;
    }

    this.data = newData;
};

