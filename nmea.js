var dataStorage, parsers;

function initNmea ()
{
    var port = chrome.runtime.connect (null, { name: 'dataStorage' });
    var timer;

    dataStorage = new DataStorage ();
    parsers     = new NmeaParsers ();

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

function NmeaParser (type)
{
    this.type = type;
}

NmeaParser.prototype.parse = function (sentence)
{
    return false;
}

function GLL ()
{
    NmeaParser.apply (this, ['GLL']);    
}

GLL.prototype = Object.create (NmeaParser.prototype);

GLL.prototype.parse = function (sentence)
{
    var utc;
    var position;
    var validity;
    var modeIndicator;
    var dataValid = sentence.extractChar (6) === 'A';

    if (dataValid)
    {
        modeIndicator = sentence.extractChar (7);

        if (modeIndicator)
            dataStorage.update (DataStorage.types.PosMode, modeIndicator);

        utc = sentence.extractUTC (5);

        if (utc)
            dataStorage.update (DataStorage.types.UTC, utc);

        position = sentence.extractPosition (1);

        if (position)
        {
            dataStorage.update (DataStorage.types.Lat, position.lat);
            dataStorage.update (DataStorage.types.Lon, position.lon);
        }
    }

    return dataValid;
};

function VTG ()
{
    NmeaParser.apply (this, ['VTG']);    
}

VTG.prototype = Object.create (NmeaParser.prototype);

VTG.prototype.parse = function (sentence)
{
    var course        = sentence.extractFloat (1);
    var speedOG       = sentence.extractFloat (5);
    var modeIndicator = sentence.extractChar (9);
    var courseType    = sentence.extractChar (2);
    var speedType     = sentence.extractChar (6);

    if (modeIndicator)
        dataStorage.update (DataStorage.types.PosMode, modeIndicator);

    if (modeIndicator === 'A' || modeIndicator === 'D')
    {
        if (courseType == 'T')
            dataStorage.update (DataStorage.types.COG, course);

        if (speedType == 'N')
            dataStorage.update (DataStorage.types.SOG, speedOG);
    }

    return modeIndicator !== null;
};

function VHW ()
{
    NmeaParser.apply (this, ['VHW']);    
}

VHW.prototype = Object.create (NmeaParser.prototype);

VHW.prototype.parse = function (sentence)
{
    var heading     = sentence.extractFloat (1);
    var speedTW     = sentence.extractFloat (5);
    var headingType = sentence.extractChar (2);
    var speedType   = sentence.extractChar (6);

    if (headingType === 'T' && Math.abs (heading) <= 180)
        dataStorage.update (DataStorage.types.HDG, heading);

    if (speedType == 'N')
        dataStorage.update (DataStorage.types.STW, speedTW);

    return true;
};

function HDT ()
{
    NmeaParser.apply (this, ['HDT']);    
}

HDT.prototype = Object.create (NmeaParser.prototype);

HDT.prototype.parse = function (sentence)
{
    var headingType = sentence.extractChar (2);
    var heading     = sentence.extractFloat (1);
    var result;

    if (headingType === 'T' && Math.abs (heading) <= 360)
    {
        result = true;

        dataStorage.update (DataStorage.types.HDG, heading);
    }
    else
    {
        result = false;
    }

    return result;
};

function THS ()
{
    NmeaParser.apply (this, ['THS']);    
}

THS.prototype = Object.create (NmeaParser.prototype);

THS.prototype.parse = function (sentence)
{
    var gyroMode = sentence.extractChar (2);
    var heading  = sentence.extractFloat (1);
    var result;

    if (gyroMode)
        dataStorage.update (DataStorage.types.GyroMode, gyroMode);

    if (gyroMode === 'A' && Math.abs (heading) <= 360)
    {
        result = true;

        dataStorage.update (DataStorage.types.HDG, heading);
    }
    else
    {
        result = false;
    }

    return result;
};

function NmeaParsers ()
{
    this.parsers = {};

    NmeaParsers.prototype.add.apply (this, [new GLL ()]);
    NmeaParsers.prototype.add.apply (this, [new VTG ()]);
    NmeaParsers.prototype.add.apply (this, [new HDT ()]);
    NmeaParsers.prototype.add.apply (this, [new THS ()]);
    NmeaParsers.prototype.add.apply (this, [new VHW ()]);
}

NmeaParsers.prototype.add = function (parser)
{
    this.parsers [parser.type] = parser;
};

NmeaParsers.prototype.parse = function (data)
{
    var sentence = new NmeaSentence ();

    sentence.parse (data);

    if (sentence.type in this.parsers)
        this.parsers [sentence.type].parse (sentence);
};

function NmeaSentence ()
{
    this.fields   = [];
    this.crcValid = false;
    this.type     = null;
}

NmeaSentence.prototype.parse = function (data)
{
    var result = false;
    var start  = data.indexOf ('$');

    if (start < 0)
        start = data.indexOf ('!');

    if (start >= 0)
    {
        var finish = data.indexOf ('*', start);

        if (finish > start && finish < (data.length - 2))
        {
            var givenCRC = parseInt ('0x' + data.substr (finish + 1, 2));
            var calculatedCRC;
            var i;

            for (var i = start + 2, calculatedCRC = data.charCodeAt (start + 1); i < finish; ++ i)
                calculatedCRC ^= data.charCodeAt (i);

            this.crcValid = calculatedCRC === givenCRC;

            if (this.crcValid)
            {
                this.fields = data.substring (start, finish).split (',');

                var typeStart = this.fields [0][0] === 'P' ? 4 : 3;

                this.type = this.fields [0].substr (typeStart);
            }
        }
    }
};

NmeaSentence.prototype.extractFloat = function (index)
{
    return (this.fields.length > index && index >= 0) ? parseFloat (this.fields [index]) : null;
};

NmeaSentence.prototype.extractInt = function (index)
{
    return (this.fields.length > index && index >= 0) ? parseInt (this.fields [index]) : null;
};

NmeaSentence.prototype.extractChar = function (index)
{
    return (this.fields.length > index && index >= 0) ? this.fields [index][0] : null;
};

NmeaSentence.prototype.extractUTC = function (index)
{
    var utc;

    if (this.fields.length > index && index >= 0)
    {
        var field   = this.fields [index];
        var hours   = parseInt (field.substr (0, 2));
        var minutes = parseInt (field.substr (2, 2));
        var seconds = parseInt (field.substr (4, 2));

        utc = new Date ();

        utc.setUTCHours (hours);
        utc.setUTCMinutes (minutes);
        utc.setUTCSeconds (seconds);
        utc.setUTCMilliseconds (0);

        utc = utc.getTime ();
    }
    else
    {
        utc = null;
    }

    return utc;
};

NmeaSentence.prototype.deformatCoordinate = function (source, degreeFieldSize, hemisphereChar)
{
    var coordinate;

    switch (degreeFieldSize)
    {
        case 2:
        case 3:
            coordinate = parseInt (source.substr (0, degreeFieldSize)); break;

        default:
            coordinate = 10000.0;
    }

    if (coordinate <= 180.0 && coordinate >= -180.0)
    {
        coordinate += parseFloat (source.substr (degreeFieldSize)) / 60.0;

        if (hemisphereChar === 'S' || hemisphereChar === 'W')
            coordinate = - coordinate;
    }

    return coordinate;
}

NmeaSentence.prototype.extractPosition = function (start)
{
    var result = null;

    if (this.fields.length > (start + 3))
    {
        result = {};

        result.lat = this.deformatCoordinate (this.fields [start], 2, this.fields [start+1]);
        result.lon = this.deformatCoordinate (this.fields [start+2], 3, this.fields [start+3]);
    }

    return result;
}
