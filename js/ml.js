(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var _ = require('underscore');
module.exports = function (ML) {
  /**
   * ML.Analytics collects data of user actions and analytics it in MaxLeap.
   * @param {Object} options The initial configuration
   * @constructor
   */
  ML.Analytics = function(options){
    var UUID = uuid.v1();
    var UNKNOWN = this.UNKNOWN = '0,0';
    var INSTALLATION_FLAG = 'ml_installation_flag';
    var REFERRER_START = '8cf1f64d97224f6eba3867b57822f528';
    var detector = new ML.Detector();

    var installation = ML.store.get(INSTALLATION_FLAG);
    if(!installation){
      installation = uuid.v1();
    }
    this.options = _.extend({
      sdkVersion: ML.VERSION,
      appUserId: installation,
      sessionId: UUID,
      deviceId: installation,
      duration: 0,
      push: false,
      upgrade: false,
      url: window.location.href,
      referer: document.referrer || REFERRER_START,
      userAgent: window.navigator.userAgent,
      os: detector.getOSName(),
      osVersion: detector.getOSVersion(),
      resolution: detector.getResolution(),
      language: detector.getLanguage(),
      userCreateTime: new Date().getTime(),
      startTime: new Date().getTime(),
      ctimestamp: new Date().getTime(),
      channel: UNKNOWN,
      network: UNKNOWN,
      carrier: UNKNOWN,
      national: UNKNOWN,
      deviceModel: UNKNOWN
    }, options);

    this.trackPageBegin();
    //Track new user only one time.
    if(!ML.store.get(INSTALLATION_FLAG)){
      this._trackNewUser();
    }
    
    if(!ML.store.get(INSTALLATION_FLAG)){
      ML.store.set(INSTALLATION_FLAG, installation, { expires: '1Y' });
    }
  };

  _.extend(ML.Analytics.prototype, /** @lends ML.Analytics.prototype */{
    /**
     * Track data when an user open a page.
     * @returns {Promise}
     */
    trackPageBegin: function(){
      var data = {
        PageView: [
          _.extend({}, this.options, {
            uuid: uuid.v1()
          })
        ]
      };
      this._trackSessionBegin();
      return ML.Analytics._request(data, {appId: this.options.appId});
    },
    /**
     * Track custom event.
     * @param {String} eventId Id of the custom event.
     * @param {Object} attrs Key-value map of the custom event.
     * @returns {Promise}
     */
    trackEvent: function(eventId, attrs){
      var data = {
        Event: [
          _.extend({}, this.options, {
            eventId: eventId,
            attrs: attrs,
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    },

    /**
     * Track data when an user login.
     * @param {Object} data Event data of user login.
     * @returns {Promise}
     */
    trackUserlogin: function(data){
      var data = {
        TimeLineEvent: [
          _.extend({}, this.options, {
            eventId: data.eventId,
            eventName: this.UNKNOWN,
            eventNickName: this.UNKNOWN,
            eventType: 1,
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    },

    /**
     * Track data when an user register.
     * @param {Object} Event data of user register.
     * @returns {Promise}
     */
    trackUserRegister: function(data){
      var data = {
        TimeLineEvent: [
          _.extend({}, this.options, {
            eventId: data.eventId,
            eventName: this.UNKNOWN,
            eventNickName: this.UNKNOWN,
            eventType: 0,
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    },

    /**
     * Track data when an user logout.
     * @param {Object} Event data of user logout.
     * @returns {Promise}
     */
    trackUserLogout: function(data){
      var data = {
        TimeLineEvent: [
          _.extend({}, this.options, {
            eventId: data.eventId,
            eventName: this.UNKNOWN,
            eventNickName: this.UNKNOWN,
            eventType: 2,
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    },

    /**
     * Track data when an user open a page.
     * @param {Object} Event data of session start.
     * @returns {Promise}
     */
    trackSessionStart: function(data){
      var data = {
        TimeLineEvent: [
          _.extend({}, this.options, {
            eventId: data.eventId,
            eventName: this.UNKNOWN,
            eventNickName: this.UNKNOWN,
            eventType: 3,
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    },

    /**
     * Track data when an user open a page.
     * @returns {Promise}
     */
    _trackSessionBegin: function(){
      var data = {
        Session: [
          _.extend({}, this.options, {
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    },

    /**
     * Track data when an user open a website first time.
     * @returns {Promise}
     */
    _trackNewUser: function(){
      var data = {
        NewUser: [
          _.extend({}, this.options, {
            uuid: uuid.v1()
          })
        ]
      };
      return ML.Analytics._request(data, {appId: this.options.appId});
    }
  });

  _.extend(ML.Analytics, /** @lends ML.Analytics */{
    /**
     * Post data to server, and retry when fail.
     * @param {Object} data
     * @param {i} i Retry time, by default undefined.
     * @returns {Promise}
     * @private
     */
    _request: function(data, headers, i){
      if(!ML.analyticsEnable){
        return;
      }
      return ML._ajax('POST', ML.serverURL + '2.0/analytics/at', JSON.stringify(data), null, null, {
        'Content-Type': 'application/json',
        'X-ML-appid': headers.appId
      }).then(function(res){
        return res;
      }, function(res){
        i = i || 0;
        if(i < 2){
          ML.Analytics._request(data, headers, ++i);
        }
        return res;
      });
    }
  })
};
},{"underscore":22}],2:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function (ML) {

  ML.Detector = function () {
    this.detector = require('web-detector');
  };

  _.extend(ML.Detector.prototype, {
    getOSName: function () {
      return this.detector.os.name === 'na' ? 'unknown' : this.detector.os.name;
    },
    getOSVersion: function () {
      //如果是windows系统,web-detector返回的是NT的版本号,需要转换成windows版本
      if(this.detector.os.name === 'windows'){
        if (this.detector.os.version >= 10) {
          return '10';
        } else if (this.detector.os.version >= 6.3) {
          return '8.1';
        } else if (this.detector.os.version >= 6.2) {
          return '8';
        } else if (this.detector.os.version >= 6.1) {
          return '7';
        } else if (this.detector.os.version >= 6.0) {
          return 'vista';
        } else if (this.detector.os.version >= 5.1) {
          return 'xp';
        } else if (this.detector.os.version >= 5.0) {
          return '2000';
        }
      }
      return this.detector.os.fullVersion === '-1' ? 'unknown' : this.detector.os.fullVersion;
    },
    getResolution: function () {
      return screen.width + '*' + screen.height
    },
    getLanguage: function () {
      return (navigator.language || navigator.userLanguage).match(/\w+(?=-)/)[0];
    }
  });

};
},{"underscore":22,"web-detector":24}],3:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(ML) {

  /**
   * Constructs a new ML.Error object with the given code and message.
   * @param {Number} code An error code constant from <code>ML.Error</code>.
   * @param {String} message A detailed description of the error.
   * @class
   *
   * <p>Class used for all objects passed to error callbacks.</p>
   */
  ML.Error = function(code, message) {
    this.code = code;
    this.message = message;
  };

  _.extend(ML.Error, /** @lends ML.Error */ {
    /**
     * Error code indicating some error other than those enumerated here.
     * @constant
     */
    OTHER_CAUSE: -1,

    /**
     * Error code indicating that something has gone wrong with the server.
     * If you get this error code, it is ML's fault. Contact us at
     * https://maxleap.com/help
     * @constant
     */
    INTERNAL_SERVER_ERROR: 1,

    /**
     * Error code indicating the connection to the ML servers failed.
     * @constant
     */
    CONNECTION_FAILED: 100,

    /**
     * Error code indicating the specified object doesn't exist.
     * @constant
     */
    OBJECT_NOT_FOUND: 101,

    /**
     * Error code indicating you tried to query with a datatype that doesn't
     * support it, like exact matching an array or object.
     * @constant
     */
    INVALID_QUERY: 102,

    /**
     * Error code indicating a missing or invalid classname. Classnames are
     * case-sensitive. They must start with a letter, and a-zA-Z0-9_ are the
     * only valid characters.
     * @constant
     */
    INVALID_CLASS_NAME: 103,

    /**
     * Error code indicating an unspecified object id.
     * @constant
     */
    MISSING_OBJECT_ID: 104,

    /**
     * Error code indicating an invalid key name. Keys are case-sensitive. They
     * must start with a letter, and a-zA-Z0-9_ are the only valid characters.
     * @constant
     */
    INVALID_KEY_NAME: 105,

    /**
     * Error code indicating a malformed pointer. You should not see this unless
     * you have been mucking about changing internal ML code.
     * @constant
     */
    INVALID_POINTER: 106,

    /**
     * Error code indicating that badly formed JSON was received upstream. This
     * either indicates you have done something unusual with modifying how
     * things encode to JSON, or the network is failing badly.
     * @constant
     */
    INVALID_JSON: 107,

    /**
     * Error code indicating that the feature you tried to access is only
     * available internally for testing purposes.
     * @constant
     */
    COMMAND_UNAVAILABLE: 108,

    /**
     * You must call ML.initialize before using the ML library.
     * @constant
     */
    NOT_INITIALIZED: 109,

    /**
     * Error code indicating that a field was set to an inconsistent type.
     * @constant
     */
    INCORRECT_TYPE: 111,

    /**
     * Error code indicating an invalid channel name. A channel name is either
     * an empty string (the broadcast channel) or contains only a-zA-Z0-9_
     * characters and starts with a letter.
     * @constant
     */
    INVALID_CHANNEL_NAME: 112,

    /**
     * Error code indicating that push is misconfigured.
     * @constant
     */
    PUSH_MISCONFIGURED: 115,

    /**
     * Error code indicating that the object is too large.
     * @constant
     */
    OBJECT_TOO_LARGE: 116,

    /**
     * Error code indicating that the operation isn't allowed for clients.
     * @constant
     */
    OPERATION_FORBIDDEN: 119,

    /**
     * Error code indicating the result was not found in the cache.
     * @constant
     */
    CACHE_MISS: 120,

    /**
     * Error code indicating that an invalid key was used in a nested
     * JSONObject.
     * @constant
     */
    INVALID_NESTED_KEY: 121,

    /**
     * Error code indicating that an invalid filename was used for MLFile.
     * A valid file name contains only a-zA-Z0-9_. characters and is between 1
     * and 128 characters.
     * @constant
     */
    INVALID_FILE_NAME: 122,

    /**
     * Error code indicating that the request timed out on the server. Typically
     * this indicates that the request is too expensive to run.
     * @constant
     */
    TIMEOUT: 124,

    /**
     * Error code indicating that the email address was invalid.
     * @constant
     */
    INVALID_EMAIL_ADDRESS: 125,

    /**
     * Error code indicating a missing content type.
     * @constant
     */
    MISSING_CONTENT_TYPE: 126,

    /**
     * Error code indicating a missing content length.
     * @constant
     */
    MISSING_CONTENT_LENGTH: 127,

    /**
     * Error code indicating an invalid content length.
     * @constant
     */
    INVALID_CONTENT_LENGTH: 128,

    /**
     * Error code indicating a file that was too large.
     * @constant
     */
    FILE_TOO_LARGE: 129,

    /**
     * Error code indicating an error saving a file.
     * @constant
     */
    FILE_SAVE_ERROR: 130,

    /**
     * Error code indicating an error deleting a file.
     * @constant
     */
    FILE_DELETE_ERROR: 153,

    /**
     * Error code indicating that a unique field was given a value that is
     * already taken.
     * @constant
     */
    DUPLICATE_VALUE: 137,

    /**
     * Error code indicating that a role's name is invalid.
     * @constant
     */
    INVALID_ROLE_NAME: 139,

    /**
     * Error code indicating that an application quota was exceeded.  Upgrade to
     * resolve.
     * @constant
     */
    EXCEEDED_QUOTA: 140,

    /**
     * Error code indicating that a Cloud Code script failed.
     * @constant
     */
    SCRIPT_FAILED: 141,

    /**
     * Error code indicating that a Cloud Code validation failed.
     * @constant
     */
    VALIDATION_ERROR: 142,

    /**
     * Error code indicating that invalid image data was provided.
     * @constant
     */
    INVALID_IMAGE_DATA: 150,

    /**
     * Error code indicating an unsaved file.
     * @constant
     */
    UNSAVED_FILE_ERROR: 151,

    /**
     * Error code indicating an invalid push time.
     */
    INVALID_PUSH_TIME_ERROR: 152,

    /**
     * Error code indicating that the username is missing or empty.
     * @constant
     */
    USERNAME_MISSING: 200,

    /**
     * Error code indicating that the password is missing or empty.
     * @constant
     */
    PASSWORD_MISSING: 201,

    /**
     * Error code indicating that the username has already been taken.
     * @constant
     */
    USERNAME_TAKEN: 202,

    /**
     * Error code indicating that the email has already been taken.
     * @constant
     */
    EMAIL_TAKEN: 203,

    /**
     * Error code indicating that the email is missing, but must be specified.
     * @constant
     */
    EMAIL_MISSING: 204,

    /**
     * Error code indicating that a user with the specified email was not found.
     * @constant
     */
    EMAIL_NOT_FOUND: 205,

    /**
     * Error code indicating that a user object without a valid session could
     * not be altered.
     * @constant
     */
    SESSION_MISSING: 206,

    /**
     * Error code indicating that a user can only be created through signup.
     * @constant
     */
    MUST_CREATE_USER_THROUGH_SIGNUP: 207,

    /**
     * Error code indicating that an an account being linked is already linked
     * to another user.
     * @constant
     */
    ACCOUNT_ALREADY_LINKED: 208,

    /**
     * Error code indicating that password mismatch
     * to another user.
     * @constant
     */
    PASSWORD_MISMATCH: 210,
    /**
     * Error code indicating that a username not found
     * to another user.
     * @constant
     */
    NOT_FIND_USER: 211,

    /**
     * Error code indicating that a user cannot be linked to an account because
     * that account's id could not be found.
     * @constant
     */
    LINKED_ID_MISSING: 250,

    /**
     * Error code indicating that a user with a linked (e.g. Facebook) account
     * has an invalid session.
     * @constant
     */
    INVALID_LINKED_SESSION: 251,

    /**
     * Error code indicating that a service being linked (e.g. Facebook or
     * Twitter) is unsupported.
     * @constant
     */
    UNSUPPORTED_SERVICE: 252,
    /**
     * Error code indicating a real error code is unavailable because
     * we had to use an XDomainRequest object to allow CORS requests in
     * Internet Explorer, which strips the body from HTTP responses that have
     * a non-2XX status code.
     * @constant
     */
    X_DOMAIN_REQUEST: 602
  });

};

},{"underscore":22}],4:[function(require,module,exports){
/*global _: false */
module.exports = function(ML) {
  var eventSplitter = /\s+/;
  var slice = Array.prototype.slice;

  /**
   * <p>ML.Events is a fork of Backbone's Events module, provided for your
   * convenience.</p>
   *
   * <p>A module that can be mixed in to any object in order to provide
   * it with custom events. You may bind callback functions to an event
   * with `on`, or remove these functions with `off`.
   * Triggering an event fires all callbacks in the order that `on` was
   * called.
   *
   * <pre>
   *     var object = {};
   *     _.extend(object, ML.Events);
   *     object.on('expand', function(){ alert('expanded'); });
   *     object.trigger('expand');</pre></p>
   *
   * <p>For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#Events">Backbone
   * documentation</a>.</p>
   */
  ML.Events = {
    /**
     * Bind one or more space separated events, `events`, to a `callback`
     * function. Passing `"all"` will bind the callback to all events fired.
     */
    on: function(events, callback, context) {

      var calls, event, node, tail, list;
      if (!callback) {
        return this;
      }
      events = events.split(eventSplitter);
      calls = this._callbacks || (this._callbacks = {});

      // Create an immutable callback list, allowing traversal during
      // modification.  The tail is an empty object that will always be used
      // as the next node.
      event = events.shift();
      while (event) {
        list = calls[event];
        node = list ? list.tail : {};
        node.next = tail = {};
        node.context = context;
        node.callback = callback;
        calls[event] = {tail: tail, next: list ? list.next : node};
        event = events.shift();
      }

      return this;
    },

    /**
     * Remove one or many callbacks. If `context` is null, removes all callbacks
     * with that function. If `callback` is null, removes all callbacks for the
     * event. If `events` is null, removes all bound callbacks for all events.
     */
    off: function(events, callback, context) {
      var event, calls, node, tail, cb, ctx;

      // No events, or removing *all* events.
      if (!(calls = this._callbacks)) {
        return;
      }
      if (!(events || callback || context)) {
        delete this._callbacks;
        return this;
      }

      // Loop through the listed events and contexts, splicing them out of the
      // linked list of callbacks if appropriate.
      events = events ? events.split(eventSplitter) : _.keys(calls);
      event = events.shift();
      while (event) {
        node = calls[event];
        delete calls[event];
        if (!node || !(callback || context)) {
          continue;
        }
        // Create a new list, omitting the indicated callbacks.
        tail = node.tail;
        node = node.next;
        while (node !== tail) {
          cb = node.callback;
          ctx = node.context;
          if ((callback && cb !== callback) || (context && ctx !== context)) {
            this.on(event, cb, ctx);
          }
          node = node.next;
        }
        event = events.shift();
      }

      return this;
    },

    /**
     * Trigger one or many events, firing all bound callbacks. Callbacks are
     * passed the same arguments as `trigger` is, apart from the event name
     * (unless you're listening on `"all"`, which will cause your callback to
     * receive the true name of the event as the first argument).
     */
    trigger: function(events) {
      var event, node, calls, tail, args, all, rest;
      if (!(calls = this._callbacks)) {
        return this;
      }
      all = calls.all;
      events = events.split(eventSplitter);
      rest = slice.call(arguments, 1);

      // For each event, walk through the linked list of callbacks twice,
      // first to trigger the event, then to trigger any `"all"` callbacks.
      event = events.shift();
      while (event) {
        node = calls[event];
        if (node) {
          tail = node.tail;
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, rest);
          }
        }
        node = all;
        if (node) {
          tail = node.tail;
          args = [event].concat(rest);
          while ((node = node.next) !== tail) {
            node.callback.apply(node.context || this, args);
          }
        }
        event = events.shift();
      }

      return this;
    }
  };

  /**
   * @function
   */
  ML.Events.bind = ML.Events.on;

  /**
   * @function
   */
  ML.Events.unbind = ML.Events.off;
};

},{}],5:[function(require,module,exports){
(function (global){
/*!
 * LeapCloud JavaScript SDK
 * Built: Mon Jun 03 2013 13:45:00
 * https://maxleap.com
 *
 * Copyright 2015 leap.as, Inc.
 * The Leap Cloud JavaScript SDK is freely distributable under the MIT license.
 */

global.ML = module.exports = {};
global.uuid = require('node-uuid');
ML._ = require('underscore');
ML.VERSION = require('./version');

ML.Promise = require('./promise');
ML.localStorage = require('localStorage');
ML.store = require('./store')();

ML.useCNServer = function(){
  ML.serverURL = 'https://api.maxleap.cn/';
};

ML.useENServer = function(){
  ML.serverURL = 'https://api.maxleap.com/';
};

ML.useCNServer();

ML.analyticsEnable = true;

// The module order is important.
require('./detector')(ML);
require('./utils')(ML);
require('./error')(ML);
require('./event')(ML);
require('./geopoint')(ML);
require('./op')(ML);
require('./relation')(ML);
require('./file')(ML);
require('./object')(ML);
require('./view')(ML);
require('./user')(ML);
require('./query')(ML);
require('./analytics')(ML);

ML.ML = ML;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./analytics":1,"./detector":2,"./error":3,"./event":4,"./file":6,"./geopoint":7,"./object":8,"./op":9,"./promise":10,"./query":11,"./relation":12,"./store":13,"./user":14,"./utils":15,"./version":16,"./view":17,"localStorage":19,"node-uuid":20,"underscore":22}],6:[function(require,module,exports){
'use strict';
var _ = require('underscore');
module.exports = function () {

  /**
   * A ML.File is a local representation of a file that is saved to the ML cloud.
   * @param {String} name The file's name.
   * @param {Array} data The data for the file, as either:
   *     1. an Object like { base64: "..." } with a base64-encoded String.
   *     2. an Object url.
   * @class
   */
  ML.File = function (name, data) {
    this._name = name;
    this._source = new ML.Promise(function (resolve) {
      resolve(data);
    })
  };

  _.extend(ML.File.prototype, /** @lends ML.File.prototype */ {

    /**
     * Gets the name of the file. Before save is called, this is the filename
     * given by the user. After save is called, that name gets prefixed with a
     * unique identifier.
     * @returns {String}
     */
    name: function () {
      return this._name;
    },

    /**
     * Gets the url of the file. It is only available after you save the file or
     * after you get the file from a ML.Object.
     * @return {String}
     */
    url: function () {
      return this._url ? 'https://' + this._url.replace('https://', ''): '';
    },

    /**
     * Saves the file to the ML cloud.
     * @return {Promise} Promise that is resolved when the save finishes.
     */
    save: function () {
      var self = this;
      return this._source.then(function (source) {
        return ML._request('files', self._name, null, 'PUT', source).then(function (res) {
          self._name = res.name;
          self._url = res.url;
          return self;
        });
      });
    },

    /**
     * Destroy the file from the ML cloud.
     * @return {Promise} Promise that is resolved when the destroy finishes.
     */
    destroy: function () {
      return ML._request('files', null, null, 'DELETE', null, {'X-LAS-Fid': this._name});
    }
  });

};
},{"underscore":22}],7:[function(require,module,exports){
var _ = require('underscore');

/*global navigator: false */
module.exports = function(ML) {
  /**
   * Creates a new GeoPoint with any of the following forms:<br>
   *   <pre>
   *   new GeoPoint(otherGeoPoint)
   *   new GeoPoint(30, 30)
   *   new GeoPoint([30, 30])
   *   new GeoPoint({latitude: 30, longitude: 30})
   *   new GeoPoint()  // defaults to (0, 0)
   *   </pre>
   * @class
   *
   * <p>Represents a latitude / longitude point that may be associated
   * with a key in a MLObject or used as a reference point for geo queries.
   * This allows proximity-based queries on the key.</p>
   *
   * <p>Only one key in a class may contain a GeoPoint.</p>
   *
   * <p>Example:<pre>
   *   var point = new ML.GeoPoint(30.0, -20.0);
   *   var object = new ML.Object("PlaceObject");
   *   object.set("location", point);
   *   object.save();</pre></p>
   */
  ML.GeoPoint = function(arg1, arg2) {
    if (_.isArray(arg1)) {
      ML.GeoPoint._validate(arg1[0], arg1[1]);
      this.latitude = arg1[0];
      this.longitude = arg1[1];
    } else if (_.isObject(arg1)) {
      ML.GeoPoint._validate(arg1.latitude, arg1.longitude);
      this.latitude = arg1.latitude;
      this.longitude = arg1.longitude;
    } else if (_.isNumber(arg1) && _.isNumber(arg2)) {
      ML.GeoPoint._validate(arg1, arg2);
      this.latitude = arg1;
      this.longitude = arg2;
    } else {
      this.latitude = 0;
      this.longitude = 0;
    }

    // Add properties so that anyone using Webkit or Mozilla will get an error
    // if they try to set values that are out of bounds.
    var self = this;
    if (this.__defineGetter__ && this.__defineSetter__) {
      // Use _latitude and _longitude to actually store the values, and add
      // getters and setters for latitude and longitude.
      this._latitude = this.latitude;
      this._longitude = this.longitude;
      this.__defineGetter__("latitude", function() {
        return self._latitude;
      });
      this.__defineGetter__("longitude", function() {
        return self._longitude;
      });
      this.__defineSetter__("latitude", function(val) {
        ML.GeoPoint._validate(val, self.longitude);
        self._latitude = val;
      });
      this.__defineSetter__("longitude", function(val) {
        ML.GeoPoint._validate(self.latitude, val);
        self._longitude = val;
      });
    }
  };

  /**
   * @lends ML.GeoPoint.prototype
   * @property {float} latitude North-south portion of the coordinate, in range
   *   [-90, 90].  Throws an exception if set out of range in a modern browser.
   * @property {float} longitude East-west portion of the coordinate, in range
   *   [-180, 180].  Throws if set out of range in a modern browser.
   */

  /**
   * Throws an exception if the given lat-long is out of bounds.
   */
  ML.GeoPoint._validate = function(latitude, longitude) {
    if (latitude < -90.0) {
      throw "ML.GeoPoint latitude " + latitude + " < -90.0.";
    }
    if (latitude > 90.0) {
      throw "ML.GeoPoint latitude " + latitude + " > 90.0.";
    }
    if (longitude < -180.0) {
      throw "ML.GeoPoint longitude " + longitude + " < -180.0.";
    }
    if (longitude > 180.0) {
      throw "ML.GeoPoint longitude " + longitude + " > 180.0.";
    }
  };

  /**
   * Creates a GeoPoint with the user's current location, if available.
   * Calls options.success with a new GeoPoint instance or calls options.error.
   * @param {Object} options An object with success and error callbacks.
   */
  ML.GeoPoint.current = function(options) {
    var promise = new ML.Promise();
    navigator.geolocation.getCurrentPosition(function(location) {
      promise.resolve(new ML.GeoPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      }));

    }, function(error) {
      promise.reject(error);
    });

    return promise._thenRunCallbacks(options);
  };

  ML.GeoPoint.prototype = {
    /**
     * Returns a JSON representation of the GeoPoint, suitable for ML.
     * @return {Object}
     */
    toJSON: function() {
      ML.GeoPoint._validate(this.latitude, this.longitude);
      return {
        "__type": "GeoPoint",
        latitude: this.latitude,
        longitude: this.longitude
      };
    },

    /**
     * Returns the distance from this GeoPoint to another in radians.
     * @param {ML.GeoPoint} point the other ML.GeoPoint.
     * @return {Number}
     */
    radiansTo: function(point) {
      var d2r = Math.PI / 180.0;
      var lat1rad = this.latitude * d2r;
      var long1rad = this.longitude * d2r;
      var lat2rad = point.latitude * d2r;
      var long2rad = point.longitude * d2r;
      var deltaLat = lat1rad - lat2rad;
      var deltaLong = long1rad - long2rad;
      var sinDeltaLatDiv2 = Math.sin(deltaLat / 2);
      var sinDeltaLongDiv2 = Math.sin(deltaLong / 2);
      // Square of half the straight line chord distance between both points.
      var a = ((sinDeltaLatDiv2 * sinDeltaLatDiv2) +
               (Math.cos(lat1rad) * Math.cos(lat2rad) *
                sinDeltaLongDiv2 * sinDeltaLongDiv2));
      a = Math.min(1.0, a);
      return 2 * Math.asin(Math.sqrt(a));
    },

    /**
     * Returns the distance from this GeoPoint to another in kilometers.
     * @param {ML.GeoPoint} point the other ML.GeoPoint.
     * @return {Number}
     */
    kilometersTo: function(point) {
      return this.radiansTo(point) * 6371.0;
    },

    /**
     * Returns the distance from this GeoPoint to another in miles.
     * @param {ML.GeoPoint} point the other ML.GeoPoint.
     * @return {Number}
     */
    milesTo: function(point) {
      return this.radiansTo(point) * 3958.8;
    }
  };
};

},{"underscore":22}],8:[function(require,module,exports){
'use strict';

var _ = require('underscore');

// ML.Object is analogous to the Java MLObject.
// It also implements the same interface as a Backbone model.

module.exports = function (ML) {
  /**
   * Creates a new model with defined attributes. A client id (cid) is
   * automatically generated and assigned for you.
   *
   * <p>You won't normally call this method directly.  It is recommended that
   * you use a subclass of <code>ML.Object</code> instead, created by calling
   * <code>extend</code>.</p>
   *
   * <p>However, if you don't want to use a subclass, or aren't sure which
   * subclass is appropriate, you can use this form:<pre>
   *     var object = new ML.Object("ClassName");
   * </pre>
   * That is basically equivalent to:<pre>
   *     var MyClass = ML.Object.extend("ClassName");
   *     var object = new MyClass();
   * </pre></p>
   *
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @see ML.Object.extend
   *
   * @class
   *
   * <p>The fundamental unit of ML data, which implements the Backbone Model
   * interface.</p>
   */
  ML.Object = function (attributes, options) {
    // Allow new ML.Object("ClassName") as a shortcut to _create.
    if (_.isString(attributes)) {
      return ML.Object._create.apply(this, arguments);
    }

    attributes = attributes || {};
    if (options && options.parse) {
      attributes = this.parse(attributes);
    }
    var defaults = ML._getValue(this, 'defaults');
    if (defaults) {
      attributes = _.extend({}, defaults, attributes);
    }
    if (options && options.collection) {
      this.collection = options.collection;
    }

    this._serverData = {};  // The last known data for this object from cloud.
    this._opSetQueue = [{}];  // List of sets of changes to the data.
    this.attributes = {};  // The best estimate of this's current data.

    this._hashedJSON = {};  // Hash of values of containers at last save.
    this._escapedAttributes = {};
    this.cid = _.uniqueId('c');
    this.changed = {};
    this._silent = {};
    this._pending = {};
    if (!this.set(attributes, {silent: true})) {
      throw new Error("Can't create an invalid ML.Object");
    }
    this.changed = {};
    this._silent = {};
    this._pending = {};
    this._hasData = true;
    this._previousAttributes = _.clone(this.attributes);
    this.initialize.apply(this, arguments);
  };

  /**
   * @lends ML.Object.prototype
   * @property {String} id The objectId of the ML Object.
   */

  /**
   * Saves the given list of ML.Object.
   * If any error is encountered, stops and calls the error handler.
   * There are two ways you can call this function.
   *
   * The Backbone way:<pre>
   *   ML.Object.saveAll([object1, object2, ...], {
   *     success: function(list) {
   *       // All the objects were saved.
   *     },
   *     error: function(error) {
   *       // An error occurred while saving one of the objects.
   *     },
   *   });
   * </pre>
   * A simplified syntax:<pre>
   *   ML.Object.saveAll([object1, object2, ...], function(list, error) {
   *     if (list) {
   *       // All the objects were saved.
   *     } else {
   *       // An error occurred.
   *     }
   *   });
   * </pre>
   *
   * @param {Array} list A list of <code>ML.Object</code>.
   * @param {Object} options A Backbone-style callback object.
   */
  ML.Object.saveAll = function (list, options) {
    return ML.Object._deepSaveAsync(list)._thenRunCallbacks(options);
  };

  // Attach all inheritable methods to the ML.Object prototype.
  _.extend(ML.Object.prototype, ML.Events,
    /** @lends ML.Object.prototype */ {
      _existed: false,
      _fetchWhenSave: false,

      /**
       * Initialize is an empty function by default. Override it with your own
       * initialization logic.
       */
      initialize: function () {
      },

      /**
       * Set whether to enable fetchWhenSave option when updating object.
       * When set true, SDK would fetch the latest object after saving.
       * Default is false.
       * @param {boolean} enable  true to enable fetchWhenSave option.
       */
      fetchWhenSave: function (enable) {
        if (!_.isBoolean(enable)) {
          throw "Expect boolean value for fetchWhenSave";
        }
        this._fetchWhenSave = enable;
      },

      /**
       * Returns the object's objectId.
       * @return {String} the objectId.
       */
      getObjectId: function () {
        return this.id;
      },

      /**
       * Returns the object's createdAt attribute.
       * @return {Date}
       */
      getCreatedAt: function () {
        return this.createdAt || this.get('createdAt');
      },

      /**
       * Returns the object's updatedAt attribute.
       * @return {Date}
       */
      getUpdatedAt: function () {
        return this.updatedAt || this.get('updatedAt');
      },

      /**
       * Returns a JSON version of the object suitable for saving to ML.
       * @return {Object}
       */
      toJSON: function () {
        var json = this._toFullJSON();
        ML._arrayEach(["__type", "className"],
          function (key) {
            delete json[key];
          });
        return json;
      },

      _toFullJSON: function (seenObjects) {
        var json = _.clone(this.attributes);
        ML._objectEach(json, function (val, key) {
          json[key] = ML._encode(val, seenObjects);
        });
        ML._objectEach(this._operations, function (val, key) {
          json[key] = val;
        });

        if (_.has(this, "id")) {
          json.objectId = this.id;
        }
        if (_.has(this, "createdAt")) {
          if (_.isDate(this.createdAt)) {
            json.createdAt = this.createdAt.toJSON();
          } else {
            json.createdAt = this.createdAt;
          }
        }

        if (_.has(this, "updatedAt")) {
          if (_.isDate(this.updatedAt)) {
            json.updatedAt = this.updatedAt.toJSON();
          } else {
            json.updatedAt = this.updatedAt;
          }
        }
        json.__type = "Object";
        json.className = this.className;
        return json;
      },

      /**
       * Updates _hashedJSON to reflect the current state of this object.
       * Adds any changed hash values to the set of pending changes.
       */
      _refreshCache: function () {
        var self = this;
        if (self._refreshingCache) {
          return;
        }
        self._refreshingCache = true;
        ML._objectEach(this.attributes, function (value, key) {
          if (value instanceof ML.Object) {
            value._refreshCache();
          } else if (_.isObject(value)) {
            if (self._resetCacheForKey(key)) {
              self.set(key, new ML.Op.Set(value), {silent: true});
            }
          }
        });
        delete self._refreshingCache;
      },

      /**
       * Returns true if this object has been modified since its last
       * save/refresh.  If an attribute is specified, it returns true only if that
       * particular attribute has been modified since the last save/refresh.
       * @param {String} attr An attribute name (optional).
       * @return {Boolean}
       */
      dirty: function (attr) {
        this._refreshCache();

        var currentChanges = _.last(this._opSetQueue);

        if (attr) {
          return (currentChanges[attr] ? true : false);
        }
        if (!this.id) {
          return true;
        }
        if (_.keys(currentChanges).length > 0) {
          return true;
        }
        return false;
      },

      /**
       * Gets a Pointer referencing this Object.
       */
      _toPointer: function () {
        // if (!this.id) {
        //   throw new Error("Can't serialize an unsaved ML.Object");
        // }
        return {
          __type: "Pointer",
          className: this.className,
          objectId: this.id
        };
      },

      /**
       * Gets the value of an attribute.
       * @param {String} attr The string name of an attribute.
       */
      get: function (attr) {
        return this.attributes[attr];
      },

      /**
       * Gets a relation on the given class for the attribute.
       * @param String attr The attribute to get the relation for.
       */
      relation: function (attr) {
        var value = this.get(attr);
        if (value) {
          if (!(value instanceof ML.Relation)) {
            throw "Called relation() on non-relation field " + attr;
          }
          value._ensureParentAndKey(this, attr);
          return value;
        } else {
          return new ML.Relation(this, attr);
        }
      },

      /**
       * Gets the HTML-escaped value of an attribute.
       */
      escape: function (attr) {
        var html = this._escapedAttributes[attr];
        if (html) {
          return html;
        }
        var val = this.attributes[attr];
        var escaped;
        if (ML._isNullOrUndefined(val)) {
          escaped = '';
        } else {
          escaped = _.escape(val.toString());
        }
        this._escapedAttributes[attr] = escaped;
        return escaped;
      },

      /**
       * Returns <code>true</code> if the attribute contains a value that is not
       * null or undefined.
       * @param {String} attr The string name of the attribute.
       * @return {Boolean}
       */
      has: function (attr) {
        return !ML._isNullOrUndefined(this.attributes[attr]);
      },

      /**
       * Pulls "special" fields like objectId, createdAt, etc. out of attrs
       * and puts them on "this" directly.  Removes them from attrs.
       * @param attrs - A dictionary with the data for this ML.Object.
       */
      _mergeMagicFields: function (attrs) {
        // Check for changes of magic fields.
        var model = this;
        var specialFields = ["id", "objectId", "createdAt", "updatedAt"];
        ML._arrayEach(specialFields, function (attr) {
          if (attrs[attr]) {
            if (attr === "objectId") {
              model.id = attrs[attr];
            } else if ((attr === "createdAt" || attr === "updatedAt") && !_.isDate(attrs[attr])) {
              model[attr] = ML._parseDate(attrs[attr]);
            } else {
              model[attr] = attrs[attr];
            }
            delete attrs[attr];
          }
        });
      },

      /**
       * Returns the json to be sent to the server.
       */
      _startSave: function () {
        this._opSetQueue.push({});
      },

      /**
       * Called when a save fails because of an error. Any changes that were part
       * of the save need to be merged with changes made after the save. This
       * might throw an exception is you do conflicting operations. For example,
       * if you do:
       *   object.set("foo", "bar");
       *   object.set("invalid field name", "baz");
       *   object.save();
       *   object.increment("foo");
       * then this will throw when the save fails and the client tries to merge
       * "bar" with the +1.
       */
      _cancelSave: function () {
        var self = this;
        var failedChanges = _.first(this._opSetQueue);
        this._opSetQueue = _.rest(this._opSetQueue);
        var nextChanges = _.first(this._opSetQueue);
        ML._objectEach(failedChanges, function (op, key) {
          var op1 = failedChanges[key];
          var op2 = nextChanges[key];
          if (op1 && op2) {
            nextChanges[key] = op2._mergeWithPrevious(op1);
          } else if (op1) {
            nextChanges[key] = op1;
          }
        });
        this._saving = this._saving - 1;
      },

      /**
       * Called when a save completes successfully. This merges the changes that
       * were saved into the known server data, and overrides it with any data
       * sent directly from the server.
       */
      _finishSave: function (serverData) {
        // Grab a copy of any object referenced by this object. These instances
        // may have already been fetched, and we don't want to lose their data.
        // Note that doing it like this means we will unify separate copies of the
        // same object, but that's a risk we have to take.
        var fetchedObjects = {};
        ML._traverse(this.attributes, function (object) {
          if (object instanceof ML.Object && object.id && object._hasData) {
            fetchedObjects[object.id] = object;
          }
        });

        var savedChanges = _.first(this._opSetQueue);
        this._opSetQueue = _.rest(this._opSetQueue);
        this._applyOpSet(savedChanges, this._serverData);
        this._mergeMagicFields(serverData);
        var self = this;
        ML._objectEach(serverData, function (value, key) {
          self._serverData[key] = ML._decode(key, value);

          // Look for any objects that might have become unfetched and fix them
          // by replacing their values with the previously observed values.
          var fetched = ML._traverse(self._serverData[key], function (object) {
            if (object instanceof ML.Object && fetchedObjects[object.id]) {
              return fetchedObjects[object.id];
            }
          });
          if (fetched) {
            self._serverData[key] = fetched;
          }
        });
        this._rebuildAllEstimatedData();
        this._saving = this._saving - 1;
      },

      /**
       * Called when a fetch or login is complete to set the known server data to
       * the given object.
       */
      _finishFetch: function (serverData, hasData) {
        // Clear out any changes the user might have made previously.
        this._opSetQueue = [{}];

        // Bring in all the new server data.
        this._mergeMagicFields(serverData);
        var self = this;
        ML._objectEach(serverData, function (value, key) {
          self._serverData[key] = ML._decode(key, value);
        });

        // Refresh the attributes.
        this._rebuildAllEstimatedData();

        // Clear out the cache of mutable containers.
        this._refreshCache();
        this._opSetQueue = [{}];

        this._hasData = hasData;
      },

      /**
       * Applies the set of ML.Op in opSet to the object target.
       */
      _applyOpSet: function (opSet, target) {
        var self = this;
        ML._objectEach(opSet, function (change, key) {
          target[key] = change._estimate(target[key], self, key);
          if (target[key] === ML.Op._UNSET) {
            delete target[key];
          }
        });
      },

      /**
       * Replaces the cached value for key with the current value.
       * Returns true if the new value is different than the old value.
       */
      _resetCacheForKey: function (key) {
        var value = this.attributes[key];
        if (_.isObject(value) && !(value instanceof ML.Object) && !(value instanceof ML.File)) {

          value = value.toJSON ? value.toJSON() : value;
          var json = JSON.stringify(value);
          if (this._hashedJSON[key] !== json) {
            var wasSet = !!this._hashedJSON[key];
            this._hashedJSON[key] = json;
            return wasSet;
          }
        }
        return false;
      },

      /**
       * Populates attributes[key] by starting with the last known data from the
       * server, and applying all of the local changes that have been made to that
       * key since then.
       */
      _rebuildEstimatedDataForKey: function (key) {
        var self = this;
        delete this.attributes[key];
        if (this._serverData[key]) {
          this.attributes[key] = this._serverData[key];
        }
        ML._arrayEach(this._opSetQueue, function (opSet) {
          var op = opSet[key];
          if (op) {
            self.attributes[key] = op._estimate(self.attributes[key], self, key);
            if (self.attributes[key] === ML.Op._UNSET) {
              delete self.attributes[key];
            } else {
              self._resetCacheForKey(key);
            }
          }
        });
      },

      /**
       * Populates attributes by starting with the last known data from the
       * server, and applying all of the local changes that have been made since
       * then.
       */
      _rebuildAllEstimatedData: function () {
        var self = this;

        var previousAttributes = _.clone(this.attributes);

        this.attributes = _.clone(this._serverData);
        ML._arrayEach(this._opSetQueue, function (opSet) {
          self._applyOpSet(opSet, self.attributes);
          ML._objectEach(opSet, function (op, key) {
            self._resetCacheForKey(key);
          });
        });

        // Trigger change events for anything that changed because of the fetch.
        ML._objectEach(previousAttributes, function (oldValue, key) {
          if (self.attributes[key] !== oldValue) {
            self.trigger('change:' + key, self, self.attributes[key], {});
          }
        });
        ML._objectEach(this.attributes, function (newValue, key) {
          if (!_.has(previousAttributes, key)) {
            self.trigger('change:' + key, self, newValue, {});
          }
        });
      },

      /**
       * Sets a hash of model attributes on the object, firing
       * <code>"change"</code> unless you choose to silence it.
       *
       * <p>You can call it with an object containing keys and values, or with one
       * key and value.  For example:<pre>
       *   gameTurn.set({
     *     player: player1,
     *     diceRoll: 2
     *   }, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
       *
       *   game.set("currentPlayer", player2, {
     *     error: function(gameTurnAgain, error) {
     *       // The set failed validation.
     *     }
     *   });
       *
       *   game.set("finished", true);</pre></p>
       *
       * @param {String} key The key to set.
       * @param {} value The value to give it.
       * @param {Object} options A set of Backbone-like options for the set.
       *     The only supported options are <code>silent</code>,
       *     <code>error</code>, and <code>promise</code>.
       * @return {Boolean} true if the set succeeded.
       * @see ML.Object#validate
       * @see ML.Error
       */
      set: function (key, value, options) {
        var attrs, attr;
        if (_.isObject(key) || ML._isNullOrUndefined(key)) {
          attrs = key;
          ML._objectEach(attrs, function (v, k) {
            attrs[k] = ML._decode(k, v);
          });
          options = value;
        } else {
          attrs = {};
          attrs[key] = ML._decode(key, value);
        }

        // Extract attributes and options.
        options = options || {};
        if (!attrs) {
          return this;
        }
        if (attrs instanceof ML.Object) {
          attrs = attrs.attributes;
        }

        // If the unset option is used, every attribute should be a Unset.
        if (options.unset) {
          ML._objectEach(attrs, function (unused_value, key) {
            attrs[key] = new ML.Op.Unset();
          });
        }

        // Apply all the attributes to get the estimated values.
        var dataToValidate = _.clone(attrs);
        var self = this;
        ML._objectEach(dataToValidate, function (value, key) {
          if (value instanceof ML.Op) {
            dataToValidate[key] = value._estimate(self.attributes[key],
              self, key);
            if (dataToValidate[key] === ML.Op._UNSET) {
              delete dataToValidate[key];
            }
          }
        });

        // Run validation.
        if (!this._validate(attrs, options)) {
          return false;
        }

        this._mergeMagicFields(attrs);

        options.changes = {};
        var escaped = this._escapedAttributes;
        var prev = this._previousAttributes || {};

        // Update attributes.
        ML._arrayEach(_.keys(attrs), function (attr) {
          var val = attrs[attr];

          // If this is a relation object we need to set the parent correctly,
          // since the location where it was parsed does not have access to
          // this object.
          if (val instanceof ML.Relation) {
            val.parent = self;
          }

          if (!(val instanceof ML.Op)) {
            val = new ML.Op.Set(val);
          }

          // See if this change will actually have any effect.
          var isRealChange = true;
          if (val instanceof ML.Op.Set &&
            _.isEqual(self.attributes[attr], val.value)) {
            isRealChange = false;
          }

          if (isRealChange) {
            delete escaped[attr];
            if (options.silent) {
              self._silent[attr] = true;
            } else {
              options.changes[attr] = true;
            }
          }

          var currentChanges = _.last(self._opSetQueue);
          currentChanges[attr] = val._mergeWithPrevious(currentChanges[attr]);
          self._rebuildEstimatedDataForKey(attr);

          if (isRealChange) {
            self.changed[attr] = self.attributes[attr];
            if (!options.silent) {
              self._pending[attr] = true;
            }
          } else {
            delete self.changed[attr];
            delete self._pending[attr];
          }
        });

        if (!options.silent) {
          this.change(options);
        }
        return this;
      },

      /**
       * Remove an attribute from the model, firing <code>"change"</code> unless
       * you choose to silence it. This is a noop if the attribute doesn't
       * exist.
       */
      unset: function (attr, options) {
        options = options || {};
        options.unset = true;
        return this.set(attr, null, options);
      },

      /**
       * Atomically increments the value of the given attribute the next time the
       * object is saved. If no amount is specified, 1 is used by default.
       *
       * @param attr {String} The key.
       * @param amount {Number} The amount to increment by.
       */
      increment: function (attr, amount) {
        if (_.isUndefined(amount) || _.isNull(amount)) {
          amount = 1;
        }
        return this.set(attr, new ML.Op.Increment(amount));
      },

      /**
       * Atomically add an object to the end of the array associated with a given
       * key.
       * @param attr {String} The key.
       * @param item {} The item to add.
       */
      add: function (attr, item) {
        return this.set(attr, new ML.Op.Add([item]));
      },

      /**
       * Atomically add an object to the array associated with a given key, only
       * if it is not already present in the array. The position of the insert is
       * not guaranteed.
       *
       * @param attr {String} The key.
       * @param item {} The object to add.
       */
      addUnique: function (attr, item) {
        return this.set(attr, new ML.Op.AddUnique([item]));
      },

      /**
       * Atomically remove all instances of an object from the array associated
       * with a given key.
       *
       * @param attr {String} The key.
       * @param item {} The object to remove.
       */
      remove: function (attr, item) {
        return this.set(attr, new ML.Op.Remove([item]));
      },

      /**
       * Returns an instance of a subclass of ML.Op describing what kind of
       * modification has been performed on this field since the last time it was
       * saved. For example, after calling object.increment("x"), calling
       * object.op("x") would return an instance of ML.Op.Increment.
       *
       * @param attr {String} The key.
       * @returns {ML.Op} The operation, or undefined if none.
       */
      op: function (attr) {
        return _.last(this._opSetQueue)[attr];
      },

      /**
       * Clear all attributes on the model, firing <code>"change"</code> unless
       * you choose to silence it.
       */
      clear: function (options) {
        options = options || {};
        options.unset = true;
        var keysToClear = _.extend(this.attributes, this._operations);
        return this.set(keysToClear, options);
      },

      /**
       * Returns a JSON-encoded set of operations to be sent with the next save
       * request.
       */
      _getSaveJSON: function () {
        var json = _.clone(_.first(this._opSetQueue));
        ML._objectEach(json, function (op, key) {
          json[key] = op.toJSON();
        });
        return json;
      },

      /**
       * Returns true if this object can be serialized for saving.
       */
      _canBeSerialized: function () {
        return ML.Object._canBeSerializedAsValue(this.attributes);
      },

      /**
       * Fetch the model from the server. If the server's representation of the
       * model differs from its current attributes, they will be overriden,
       * triggering a <code>"change"</code> event.
       * @param {Object} fetchOptions Optional options to set 'keys' and
       *      'include' option.
       * @param {Object} options Optional Backbone-like options object to be
       *     passed in to set.
       * @return {ML.Promise} A promise that is fulfilled when the fetch
       *     completes.
       */
      fetch: function () {
        var options = null;
        var fetchOptions = {};
        if (arguments.length === 1) {
          options = arguments[0];
        } else if (arguments.length === 2) {
          fetchOptions = arguments[0];
          options = arguments[1];
        }

        var self = this;
        var request = ML._request("classes", this.className, this.id, 'GET',
          fetchOptions);
        return request.then(function (response, status, xhr) {
          self._finishFetch(self.parse(response, status, xhr), true);
          return self;
        })._thenRunCallbacks(options, this);
      },

      /**
       * Set a hash of model attributes, and save the model to the server.
       * updatedAt will be updated when the request returns.
       * You can either call it as:<pre>
       *   object.save();</pre>
       * or<pre>
       *   object.save(null, options);</pre>
       * or<pre>
       *   object.save(attrs, options);</pre>
       * or<pre>
       *   object.save(key, value, options);</pre>
       *
       * For example, <pre>
       *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }, {
     *     success: function(gameTurnAgain) {
     *       // The save was successful.
     *     },
     *     error: function(gameTurnAgain, error) {
     *       // The save failed.  Error is an instance of ML.Error.
     *     }
     *   });</pre>
       * or with promises:<pre>
       *   gameTurn.save({
     *     player: "Jake Cutter",
     *     diceRoll: 2
     *   }).then(function(gameTurnAgain) {
     *     // The save was successful.
     *   }, function(error) {
     *     // The save failed.  Error is an instance of ML.Error.
     *   });</pre>
       *
       * @return {ML.Promise} A promise that is fulfilled when the save
       *     completes.
       * @see ML.Error
       */
      save: function (arg1, arg2, arg3) {
        var i, attrs, current, options, saved;
        if (_.isObject(arg1) || ML._isNullOrUndefined(arg1)) {
          attrs = arg1;
          options = arg2;
        } else {
          attrs = {};
          attrs[arg1] = arg2;
          options = arg3;
        }

        // Make save({ success: function() {} }) work.
        if (!options && attrs) {
          var extra_keys = _.reject(attrs, function (value, key) {
            return _.include(["success", "error", "wait"], key);
          });
          if (extra_keys.length === 0) {
            var all_functions = true;
            if (_.has(attrs, "success") && !_.isFunction(attrs.success)) {
              all_functions = false;
            }
            if (_.has(attrs, "error") && !_.isFunction(attrs.error)) {
              all_functions = false;
            }
            if (all_functions) {
              // This attrs object looks like it's really an options object,
              // and there's no other options object, so let's just use it.
              return this.save(null, attrs);
            }
          }
        }

        options = _.clone(options) || {};
        if (options.wait) {
          current = _.clone(this.attributes);
        }

        var setOptions = _.clone(options) || {};
        if (setOptions.wait) {
          setOptions.silent = true;
        }
        var setError;
        setOptions.error = function (model, error) {
          setError = error;
        };
        if (attrs && !this.set(attrs, setOptions)) {
          return ML.Promise.error(setError)._thenRunCallbacks(options, this);
        }

        var model = this;

        // If there is any unsaved child, save it first.
        model._refreshCache();


        var unsavedChildren = [];
        var unsavedFiles = [];
        ML.Object._findUnsavedChildren(model.attributes,
          unsavedChildren,
          unsavedFiles);
        if (unsavedChildren.length + unsavedFiles.length > 0) {
          return ML.Object._deepSaveAsync(this.attributes, model).then(function () {
            return model.save(null, options);
          }, function (error) {
            return ML.Promise.error(error)._thenRunCallbacks(options, model);
          });
        }

        this._startSave();
        this._saving = (this._saving || 0) + 1;

        this._allPreviousSaves = this._allPreviousSaves || ML.Promise.as();
        this._allPreviousSaves = this._allPreviousSaves._continueWith(function () {
          var method = model.id ? 'PUT' : 'POST';

          var json = model._getSaveJSON();

          if (model._fetchWhenSave) {
            //Sepcial-case fetchWhenSave when updating object.
            json._fetchWhenSave = true;
          }

          var route = "classes";
          var className = model.className;
          if (model.className === "_User" && !model.id) {
            // Special-case user sign-up.
            route = "users";
            className = null;
          }
          //hook makeRequest in options.
          var makeRequest = options._makeRequest || ML._request;
          var request = makeRequest(route, className, model.id, method, json);

          request = request.then(function (resp, status, xhr) {
            var serverAttrs = model.parse(resp, status, xhr);
            if (options.wait) {
              serverAttrs = _.extend(attrs || {}, serverAttrs);
            }
            model._finishSave(serverAttrs);
            if (options.wait) {
              model.set(current, setOptions);
            }
            return model;

          }, function (error) {
            model._cancelSave();
            return ML.Promise.error(error);

          })._thenRunCallbacks(options, model);

          return request;
        });
        return this._allPreviousSaves;
      },

      /**
       * Destroy this model on the server if it was already persisted.
       * Optimistically removes the model from its collection, if it has one.
       * If `wait: true` is passed, waits for the server to respond
       * before removal.
       *
       * @return {ML.Promise} A promise that is fulfilled when the destroy
       *     completes.
       */
      destroy: function (options) {
        options = options || {};
        var model = this;

        var triggerDestroy = function () {
          model.trigger('destroy', model, model.collection, options);
        };

        if (!this.id) {
          return triggerDestroy();
        }

        if (!options.wait) {
          triggerDestroy();
        }

        var request =
          ML._request("classes", this.className, this.id, 'DELETE');
        return request.then(function () {
          if (options.wait) {
            triggerDestroy();
          }
          return model;
        })._thenRunCallbacks(options, this);
      },

      /**
       * Converts a response into the hash of attributes to be set on the model.
       * @ignore
       */
      parse: function (resp, status, xhr) {
        var output = _.clone(resp);
        _(["createdAt", "updatedAt"]).each(function (key) {
          if (output[key]) {
            output[key] = ML._parseDate(output[key]);
          }
        });
        if (!output.updatedAt) {
          output.updatedAt = output.createdAt;
        }
        if (status) {
          this._existed = (status !== 201);
        }
        return output;
      },

      /**
       * Creates a new model with identical attributes to this one.
       * @return {ML.Object}
       */
      clone: function () {
        return new this.constructor(this.attributes);
      },

      /**
       * Returns true if this object has never been saved to ML.
       * @return {Boolean}
       */
      isNew: function () {
        return !this.id;
      },

      /**
       * Call this method to manually fire a `"change"` event for this model and
       * a `"change:attribute"` event for each changed attribute.
       * Calling this will cause all objects observing the model to update.
       */
      change: function (options) {
        options = options || {};
        var changing = this._changing;
        this._changing = true;

        // Silent changes become pending changes.
        var self = this;
        ML._objectEach(this._silent, function (attr) {
          self._pending[attr] = true;
        });

        // Silent changes are triggered.
        var changes = _.extend({}, options.changes, this._silent);
        this._silent = {};
        ML._objectEach(changes, function (unused_value, attr) {
          self.trigger('change:' + attr, self, self.get(attr), options);
        });
        if (changing) {
          return this;
        }

        // This is to get around lint not letting us make a function in a loop.
        var deleteChanged = function (value, attr) {
          if (!self._pending[attr] && !self._silent[attr]) {
            delete self.changed[attr];
          }
        };

        // Continue firing `"change"` events while there are pending changes.
        while (!_.isEmpty(this._pending)) {
          this._pending = {};
          this.trigger('change', this, options);
          // Pending and silent changes still remain.
          ML._objectEach(this.changed, deleteChanged);
          self._previousAttributes = _.clone(this.attributes);
        }

        this._changing = false;
        return this;
      },

      /**
       * Returns true if this object was created by the ML server when the
       * object might have already been there (e.g. in the case of a Facebook
       * login)
       */
      existed: function () {
        return this._existed;
      },

      /**
       * Determine if the model has changed since the last <code>"change"</code>
       * event.  If you specify an attribute name, determine if that attribute
       * has changed.
       * @param {String} attr Optional attribute name
       * @return {Boolean}
       */
      hasChanged: function (attr) {
        if (!arguments.length) {
          return !_.isEmpty(this.changed);
        }
        return this.changed && _.has(this.changed, attr);
      },

      /**
       * Returns an object containing all the attributes that have changed, or
       * false if there are no changed attributes. Useful for determining what
       * parts of a view need to be updated and/or what attributes need to be
       * persisted to the server. Unset attributes will be set to undefined.
       * You can also pass an attributes object to diff against the model,
       * determining if there *would be* a change.
       */
      changedAttributes: function (diff) {
        if (!diff) {
          return this.hasChanged() ? _.clone(this.changed) : false;
        }
        var changed = {};
        var old = this._previousAttributes;
        ML._objectEach(diff, function (diffVal, attr) {
          if (!_.isEqual(old[attr], diffVal)) {
            changed[attr] = diffVal;
          }
        });
        return changed;
      },

      /**
       * Gets the previous value of an attribute, recorded at the time the last
       * <code>"change"</code> event was fired.
       * @param {String} attr Name of the attribute to get.
       */
      previous: function (attr) {
        if (!arguments.length || !this._previousAttributes) {
          return null;
        }
        return this._previousAttributes[attr];
      },

      /**
       * Gets all of the attributes of the model at the time of the previous
       * <code>"change"</code> event.
       * @return {Object}
       */
      previousAttributes: function () {
        return _.clone(this._previousAttributes);
      },

      /**
       * Checks if the model is currently in a valid state. It's only possible to
       * get into an *invalid* state if you're using silent changes.
       * @return {Boolean}
       */
      isValid: function () {
        return !this.validate(this.attributes);
      },

      /**
       * Run validation against a set of incoming attributes, returning `true`
       * if all is well. If a specific `error` callback has been passed,
       * call that instead of firing the general `"error"` event.
       */
      _validate: function (attrs, options) {
        if (options.silent || !this.validate) {
          return true;
        }
        attrs = _.extend({}, this.attributes, attrs);
        var error = this.validate(attrs, options);
        if (!error) {
          return true;
        }
        if (options && options.error) {
          options.error(this, error, options);
        } else {
          this.trigger('error', this, error, options);
        }
        return false;
      },

    });

  /**
   * Creates an instance of a subclass of ML.Object for the give classname
   * and id.
   * @param  {String} className The name of the ML class backing this model.
   * @param {String} id The object id of this model.
   * @return {ML.Object} A new subclass instance of ML.Object.
   */
  ML.Object.createWithoutData = function (className, id, hasData) {
    var result = new ML.Object(className);
    result.id = id;
    result._hasData = hasData;
    return result;
  };
  /**
   * Delete objects in batch.The objects className must be the same.
   * @param {Array} The ParseObject array to be deleted.
   * @param {Object} options Standard options object with success and error
   *     callbacks.
   * @return {ML.Promise} A promise that is fulfilled when the save
   *     completes.
   */
  ML.Object.destroyAll = function (objects, options) {
    if (objects == null || objects.length == 0) {
      return ML.Promise.as()._thenRunCallbacks(options);
    }
    var dataObject = {
      requests: []
    };

    objects.forEach(function (obj) {
      dataObject.requests.push({
        method: 'delete',
        path: 'classes/' + objects[0].className + '/' + obj.id
      });
    });
    var request =
      ML._request('batch', null, null, 'POST', dataObject);
    return request._thenRunCallbacks(options);
  };

  /**
   * Returns the appropriate subclass for making new instances of the given
   * className string.
   */
  ML.Object._getSubclass = function (className) {
    if (!_.isString(className)) {
      throw "ML.Object._getSubclass requires a string argument.";
    }
    var ObjectClass = ML.Object._classMap[className];
    if (!ObjectClass) {
      ObjectClass = ML.Object.extend(className);
      ML.Object._classMap[className] = ObjectClass;
    }
    return ObjectClass;
  };

  /**
   * Creates an instance of a subclass of ML.Object for the given classname.
   */
  ML.Object._create = function (className, attributes, options) {
    var ObjectClass = ML.Object._getSubclass(className);
    return new ObjectClass(attributes, options);
  };

  // Set up a map of className to class so that we can create new instances of
  // ML Objects from JSON automatically.
  ML.Object._classMap = {};

  ML.Object._extend = ML._extend;

  /**
   * Creates a new model with defined attributes,
   * It's the same with
   * <pre>
   *   new ML.Object(attributes, options);
   *  </pre>
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @return {ML.Object}
   * @since v0.4.4
   * @see ML.Object
   * @see ML.Object.extend
   */
  ML.Object.new = function (attributes, options) {
    return new ML.Object(attributes, options);
  };

  /**
   * Creates a new subclass of ML.Object for the given ML class name.
   *
   * <p>Every extension of a ML class will inherit from the most recent
   * previous extension of that class. When a ML.Object is automatically
   * created by parsing JSON, it will use the most recent extension of that
   * class.</p>
   *
   * <p>You should call either:<pre>
   *     var MyClass = ML.Object.extend("MyClass", {
   *         <i>Instance properties</i>
   *     }, {
   *         <i>Class properties</i>
   *     });</pre>
   * or, for Backbone compatibility:<pre>
   *     var MyClass = ML.Object.extend({
   *         className: "MyClass",
   *         <i>Other instance properties</i>
   *     }, {
   *         <i>Class properties</i>
   *     });</pre></p>
   *
   * @param {String} className The name of the ML class backing this model.
   * @param {Object} protoProps Instance properties to add to instances of the
   *     class returned from this method.
   * @param {Object} classProps Class properties to add the class returned from
   *     this method.
   * @return {Class} A new subclass of ML.Object.
   */
  ML.Object.extend = function (className, protoProps, classProps) {
    // Handle the case with only two args.
    if (!_.isString(className)) {
      if (className && _.has(className, "className")) {
        return ML.Object.extend(className.className, className, protoProps);
      } else {
        throw new Error(
          "ML.Object.extend's first argument should be the className.");
      }
    }

    // If someone tries to subclass "User", coerce it to the right type.
    if (className === "User") {
      className = "_User";
    }

    var NewClassObject = null;
    if (_.has(ML.Object._classMap, className)) {
      var OldClassObject = ML.Object._classMap[className];
      // This new subclass has been told to extend both from "this" and from
      // OldClassObject. This is multiple inheritance, which isn't supported.
      // For now, let's just pick one.
      NewClassObject = OldClassObject._extend(protoProps, classProps);
    } else {
      protoProps = protoProps || {};
      protoProps.className = className;
      NewClassObject = this._extend(protoProps, classProps);
    }
    // Extending a subclass should reuse the classname automatically.
    NewClassObject.extend = function (arg0) {
      if (_.isString(arg0) || (arg0 && _.has(arg0, "className"))) {
        return ML.Object.extend.apply(NewClassObject, arguments);
      }
      var newArguments = [className].concat(ML._.toArray(arguments));
      return ML.Object.extend.apply(NewClassObject, newArguments);
    };
    NewClassObject.new = function (attributes, options) {
      return new NewClassObject(attributes, options);
    };
    ML.Object._classMap[className] = NewClassObject;
    return NewClassObject;
  };

  ML.Object._findUnsavedChildren = function (object, children, files) {
    ML._traverse(object, function (object) {
      if (object instanceof ML.Object) {
        object._refreshCache();
        if (object.dirty()) {
          children.push(object);
        }
        return;
      }

      if (object instanceof ML.File) {
        if (!object.url() && !object.id) {
          files.push(object);
        }
        return;
      }
    });
  };

  ML.Object._canBeSerializedAsValue = function (object) {
    var canBeSerializedAsValue = true;

    if (object instanceof ML.Object) {
      canBeSerializedAsValue = !!object.id;

    } else if (_.isArray(object)) {
      ML._arrayEach(object, function (child) {
        if (!ML.Object._canBeSerializedAsValue(child)) {
          canBeSerializedAsValue = false;
        }
      });

    } else if (_.isObject(object)) {
      ML._objectEach(object, function (child) {
        if (!ML.Object._canBeSerializedAsValue(child)) {
          canBeSerializedAsValue = false;
        }
      });
    }

    return canBeSerializedAsValue;
  };

  ML.Object._deepSaveAsync = function (object, model) {
    var unsavedChildren = [];
    var unsavedFiles = [];
    ML.Object._findUnsavedChildren(object, unsavedChildren, unsavedFiles);
    if (model) {
      unsavedChildren = _.filter(unsavedChildren, function (object) {
        return object != model;
      });
    }

    var promise = ML.Promise.as();
    _.each(unsavedFiles, function (file) {
      promise = promise.then(function () {
        return file.save();
      });
    });

    var objects = _.uniq(unsavedChildren);
    var remaining = _.uniq(objects);

    return promise.then(function () {
      return ML.Promise._continueWhile(function () {
        return remaining.length > 0;
      }, function () {

        // Gather up all the objects that can be saved in this batch.
        var batch = [];
        var newRemaining = [];
        ML._arrayEach(remaining, function (object) {
          // Limit batches to 20 objects.
          if (batch.length > 20) {
            newRemaining.push(object);
            return;
          }

          if (object._canBeSerialized()) {
            batch.push(object);
          } else {
            newRemaining.push(object);
          }
        });
        remaining = newRemaining;

        // If we can't save any objects, there must be a circular reference.
        if (batch.length === 0) {
          return ML.Promise.error(
            new ML.Error(ML.Error.OTHER_CAUSE,
              "Tried to save a batch with a cycle."));
        }

        // Reserve a spot in every object's save queue.
        var readyToStart = ML.Promise.when(_.map(batch, function (object) {
          return object._allPreviousSaves || ML.Promise.as();
        }));
        var batchFinished = new ML.Promise();
        ML._arrayEach(batch, function (object) {
          object._allPreviousSaves = batchFinished;
        });
        // Save a single batch, whether previous saves succeeded or failed.
        return readyToStart._continueWith(function () {
          return ML._request("batch", null, null, "POST", {
            requests: _.map(batch, function (object) {
              var json = object._getSaveJSON();
              var method = "POST";

              var path = "/2.0/classes/" + object.className;
              if (object.id) {
                path = path + "/" + object.id;
                method = "PUT";
              }

              object._startSave();

              return {
                method: method,
                path: path,
                body: json
              };
            })

          }).then(function (response, status, xhr) {
            var error;
            ML._arrayEach(batch, function (object, i) {
              object._finishSave(
                object.parse(response[i], status, xhr));
            });
            if (error) {
              return ML.Promise.error(
                new ML.Error(error.code, error.error));
            }

          }).then(function (results) {
            batchFinished.resolve(results);
            return results;
          }, function (error) {
            batchFinished.reject(error);
            return ML.Promise.error(error);
          });
        });
      });
    }).then(function () {
      return object;
    });
  };

};

},{"underscore":22}],9:[function(require,module,exports){
'use strict';
var _ = require('underscore');

module.exports = function(ML) {

  /**
   * A ML.Op is an atomic operation that can be applied to a field in a
   * ML.Object. For example, calling <code>object.set("foo", "bar")</code>
   * is an example of a ML.Op.Set. Calling <code>object.unset("foo")</code>
   * is a ML.Op.Unset. These operations are stored in a ML.Object and
   * sent to the server as part of <code>object.save()</code> operations.
   * Instances of ML.Op should be immutable.
   *
   * You should not create subclasses of ML.Op or instantiate ML.Op
   * directly.
   */
  ML.Op = function() {
    this._initialize.apply(this, arguments);
  };

  ML.Op.prototype = {
    _initialize: function() {}
  };

  _.extend(ML.Op, {
    /**
     * To create a new Op, call ML.Op._extend();
     */
    _extend: ML._extend,

    // A map of __op string to decoder function.
    _opDecoderMap: {},

    /**
     * Registers a function to convert a json object with an __op field into an
     * instance of a subclass of ML.Op.
     */
    _registerDecoder: function(opName, decoder) {
      ML.Op._opDecoderMap[opName] = decoder;
    },

    /**
     * Converts a json object into an instance of a subclass of ML.Op.
     */
    _decode: function(json) {
      var decoder = ML.Op._opDecoderMap[json.__op];
      if (decoder) {
        return decoder(json);
      } else {
        return undefined;
      }
    }
  });

  /*
   * Add a handler for Batch ops.
   */
  ML.Op._registerDecoder("Batch", function(json) {
    var op = null;
    ML._arrayEach(json.ops, function(nextOp) {
      nextOp = ML.Op._decode(nextOp);
      op = nextOp._mergeWithPrevious(op);
    });
    return op;
  });

  /**
   * A Set operation indicates that either the field was changed using
   * ML.Object.set, or it is a mutable container that was detected as being
   * changed.
   */
  ML.Op.Set = ML.Op._extend(/** @lends ML.Op.Set.prototype */ {
    _initialize: function(value) {
      this._value = value;
    },

    /**
     * Returns the new value of this field after the set.
     */
    value: function() {
      return this._value;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      return ML._encode(this.value());
    },

    _mergeWithPrevious: function(previous) {
      return this;
    },

    _estimate: function(oldValue) {
      return this.value();
    }
  });

  /**
   * A sentinel value that is returned by ML.Op.Unset._estimate to
   * indicate the field should be deleted. Basically, if you find _UNSET as a
   * value in your object, you should remove that key.
   */
  ML.Op._UNSET = {};

  /**
   * An Unset operation indicates that this field has been deleted from the
   * object.
   */
  ML.Op.Unset = ML.Op._extend(/** @lends ML.Op.Unset.prototype */ {
    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Delete" };
    },

    _mergeWithPrevious: function(previous) {
      return this;
    },

    _estimate: function(oldValue) {
      return ML.Op._UNSET;
    }
  });

  ML.Op._registerDecoder("Delete", function(json) {
    return new ML.Op.Unset();
  });

  /**
   * An Increment is an atomic operation where the numeric value for the field
   * will be increased by a given amount.
   */
  ML.Op.Increment = ML.Op._extend(
      /** @lends ML.Op.Increment.prototype */ {

    _initialize: function(amount) {
      this._amount = amount;
    },

    /**
     * Returns the amount to increment by.
     * @return {Number} the amount to increment by.
     */
    amount: function() {
      return this._amount;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Increment", amount: this._amount };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof ML.Op.Unset) {
        return new ML.Op.Set(this.amount());
      } else if (previous instanceof ML.Op.Set) {
        return new ML.Op.Set(previous.value() + this.amount());
      } else if (previous instanceof ML.Op.Increment) {
        return new ML.Op.Increment(this.amount() + previous.amount());
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return this.amount();
      }
      return oldValue + this.amount();
    }
  });

  ML.Op._registerDecoder("Increment", function(json) {
    return new ML.Op.Increment(json.amount);
  });

  /**
   * Add is an atomic operation where the given objects will be appended to the
   * array that is stored in this field.
   */
  ML.Op.Add = ML.Op._extend(/** @lends ML.Op.Add.prototype */ {
    _initialize: function(objects) {
      this._objects = objects;
    },

    /**
     * Returns the objects to be added to the array.
     * @return {Array} The objects to be added to the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      return ML._encode(this.objects());
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof ML.Op.Unset) {
        return new ML.Op.Set(this.objects());
      } else if (previous instanceof ML.Op.Set) {
        return new ML.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof ML.Op.Add) {
        return new ML.Op.Add(previous.objects().concat(this.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return _.clone(this.objects());
      } else {
        return oldValue.concat(this.objects());
      }
    }
  });

  ML.Op._registerDecoder("Add", function(json) {
    return new ML.Op.Add(ML._decode(undefined, json.objects));
  });

  /**
   * AddUnique is an atomic operation where the given items will be appended to
   * the array that is stored in this field only if they were not already
   * present in the array.
   */
  ML.Op.AddUnique = ML.Op._extend(
      /** @lends ML.Op.AddUnique.prototype */ {

    _initialize: function(objects) {
      this._objects = _.uniq(objects);
    },

    /**
     * Returns the objects to be added to the array.
     * @return {Array} The objects to be added to the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "AddUnique", objects: ML._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof ML.Op.Unset) {
        return new ML.Op.Set(this.objects());
      } else if (previous instanceof ML.Op.Set) {
        return new ML.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof ML.Op.AddUnique) {
        return new ML.Op.AddUnique(this._estimate(previous.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return _.clone(this.objects());
      } else {
        // We can't just take the _.uniq(_.union(...)) of oldValue and
        // this.objects, because the uniqueness may not apply to oldValue
        // (especially if the oldValue was set via .set())
        var newValue = _.clone(oldValue);
        ML._arrayEach(this.objects(), function(obj) {
          if (obj instanceof ML.Object && obj.id) {
            var matchingObj = _.find(newValue, function(anObj) {
              return (anObj instanceof ML.Object) && (anObj.id === obj.id);
            });
            if (!matchingObj) {
              newValue.push(obj);
            } else {
              var index = _.indexOf(newValue, matchingObj);
              newValue[index] = obj;
            }
          } else if (!_.contains(newValue, obj)) {
            newValue.push(obj);
          }
        });
        return newValue;
      }
    }
  });

  ML.Op._registerDecoder("AddUnique", function(json) {
    return new ML.Op.AddUnique(ML._decode(undefined, json.objects));
  });

  /**
   * Remove is an atomic operation where the given objects will be removed from
   * the array that is stored in this field.
   */
  ML.Op.Remove = ML.Op._extend(/** @lends ML.Op.Remove.prototype */ {
    _initialize: function(objects) {
      this._objects = _.uniq(objects);
    },

    /**
     * Returns the objects to be removed from the array.
     * @return {Array} The objects to be removed from the array.
     */
    objects: function() {
      return this._objects;
    },

    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      return { __op: "Remove", objects: ML._encode(this.objects()) };
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof ML.Op.Unset) {
        return previous;
      } else if (previous instanceof ML.Op.Set) {
        return new ML.Op.Set(this._estimate(previous.value()));
      } else if (previous instanceof ML.Op.Remove) {
        return new ML.Op.Remove(_.union(previous.objects(), this.objects()));
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue) {
      if (!oldValue) {
        return [];
      } else {
        var newValue = _.difference(oldValue, this.objects());
        // If there are saved ML Objects being removed, also remove them.
        ML._arrayEach(this.objects(), function(obj) {
          if (obj instanceof ML.Object && obj.id) {
            newValue = _.reject(newValue, function(other) {
              return (other instanceof ML.Object) && (other.id === obj.id);
            });
          }
        });
        return newValue;
      }
    }
  });

  ML.Op._registerDecoder("Remove", function(json) {
    return new ML.Op.Remove(ML._decode(undefined, json.objects));
  });

  /**
   * A Relation operation indicates that the field is an instance of
   * ML.Relation, and objects are being added to, or removed from, that
   * relation.
   */
  ML.Op.Relation = ML.Op._extend(
      /** @lends ML.Op.Relation.prototype */ {

    _initialize: function(adds, removes) {
      this._targetClassName = null;

      var self = this;

      var pointerToId = function(object) {
        if (object instanceof ML.Object) {
          if (!object.id) {
            throw "You can't add an unsaved ML.Object to a relation.";
          }
          if (!self._targetClassName) {
            self._targetClassName = object.className;
          }
          if (self._targetClassName !== object.className) {
            throw "Tried to create a ML.Relation with 2 different types: " +
                  self._targetClassName + " and " + object.className + ".";
          }
          return object.id;
        }
        return object;
      };

      this.relationsToAdd = _.uniq(_.map(adds, pointerToId));
      this.relationsToRemove = _.uniq(_.map(removes, pointerToId));
    },

    /**
     * Returns an array of unfetched ML.Object that are being added to the
     * relation.
     * @return {Array}
     */
    added: function() {
      var self = this;
      return _.map(this.relationsToAdd, function(objectId) {
        var object = ML.Object._create(self._targetClassName);
        object.id = objectId;
        return object;
      });
    },

    /**
     * Returns an array of unfetched ML.Object that are being removed from
     * the relation.
     * @return {Array}
     */
    removed: function() {
      var self = this;
      return _.map(this.relationsToRemove, function(objectId) {
        var object = ML.Object._create(self._targetClassName);
        object.id = objectId;
        return object;
      });
    },

    /**
     * Returns a JSON version of the operation suitable for sending to ML.
     * @return {Object}
     */
    toJSON: function() {
      var adds = null;
      var removes = null;
      var self = this;
      var idToPointer = function(id) {
        return { __type: 'Pointer',
                 className: self._targetClassName,
                 objectId: id };
      };
      var pointers = null;
      if (this.relationsToAdd.length > 0) {
        pointers = _.map(this.relationsToAdd, idToPointer);
        adds = { "__op": "AddRelation", "objects": pointers };
      }

      if (this.relationsToRemove.length > 0) {
        pointers = _.map(this.relationsToRemove, idToPointer);
        removes = { "__op": "RemoveRelation", "objects": pointers };
      }

      if (adds && removes) {
        return { "__op": "Batch", "ops": [adds, removes]};
      }

      return adds || removes || {};
    },

    _mergeWithPrevious: function(previous) {
      if (!previous) {
        return this;
      } else if (previous instanceof ML.Op.Unset) {
        throw "You can't modify a relation after deleting it.";
      } else if (previous instanceof ML.Op.Relation) {
        if (previous._targetClassName &&
            previous._targetClassName !== this._targetClassName) {
          throw "Related object must be of class " + previous._targetClassName +
              ", but " + this._targetClassName + " was passed in.";
        }
        var newAdd = _.union(_.difference(previous.relationsToAdd,
                                          this.relationsToRemove),
                             this.relationsToAdd);
        var newRemove = _.union(_.difference(previous.relationsToRemove,
                                             this.relationsToAdd),
                                this.relationsToRemove);

        var newRelation = new ML.Op.Relation(newAdd, newRemove);
        newRelation._targetClassName = this._targetClassName;
        return newRelation;
      } else {
        throw "Op is invalid after previous op.";
      }
    },

    _estimate: function(oldValue, object, key) {
      if (!oldValue) {
        var relation = new ML.Relation(object, key);
        relation.targetClassName = this._targetClassName;
      } else if (oldValue instanceof ML.Relation) {
        if (this._targetClassName) {
          if (oldValue.targetClassName) {
            if (oldValue.targetClassName !== this._targetClassName) {
              throw "Related object must be a " + oldValue.targetClassName +
                  ", but a " + this._targetClassName + " was passed in.";
            }
          } else {
            oldValue.targetClassName = this._targetClassName;
          }
        }
        return oldValue;
      } else {
        throw "Op is invalid after previous op.";
      }
    }
  });

  ML.Op._registerDecoder("AddRelation", function(json) {
    return new ML.Op.Relation(ML._decode(undefined, json.objects), []);
  });
  ML.Op._registerDecoder("RemoveRelation", function(json) {
    return new ML.Op.Relation([], ML._decode(undefined, json.objects));
  });

};

},{"underscore":22}],10:[function(require,module,exports){
(function (process){
'use strict';
var _ = require('underscore');

var Promise = module.exports = function Promise(fn) {
  /**
   * A Promise is returned by async methods as a hook to provide callbacks to be
   * called when the async task is fulfilled.
   *
   * <p>Typical usage would be like:<pre>
   *    query.find().then(function(results) {
   *      results[0].set("foo", "bar");
   *      return results[0].saveAsync();
   *    }).then(function(result) {
   *      console.log("Updated " + result.id);
   *    });
   * </pre></p>
   * <p>Another example:<pre>
   *    var promise = new ML.Promise(function(resolve, reject) {
   *      resolve(42);
   *    });
   *    promise.then(function(value){
   *      console.log(value);
   *    }).catch(function(error){
   *      console.error(error);
   *    });
   * </pre></p>
   * @param {Function} fn An optional function with two arguments resolve
   *                   and reject.The first argument fulfills the promise,
   *                   the second argument rejects it. We can call these
    *                  functions, once our operation is completed.
   * @see ML.Promise.prototype.then
   * @class
   */
    this._resolved = false;
    this._rejected = false;
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];

    this.doResolve(fn);
};

var _isNullOrUndefined = function _isNullOrUndefined(x) {
  return _.isNull(x) || _.isUndefined(x);
};

var _isNode = false;

if (typeof(process) !== "undefined" &&
    process.versions &&
    process.versions.node) {
      _isNode = true;
}

_.extend(Promise, /** @lends ML.Promise */ {

  _isPromisesAPlusCompliant: !_isNode,
  _debugError: false,

  setPromisesAPlusCompliant: function(isCompliant) {
    Promise._isPromisesAPlusCompliant = isCompliant;
  },

  setDebugError: function(enable) {
    Promise._debugError = enable;
  },

  /**
   * Returns true iff the given object fulfils the Promise interface.
   * @return {Boolean}
   */
  is: function(promise) {
    return promise && promise.then && _.isFunction(promise.then);
  },

  /**
   * Returns a new promise that is resolved with a given value.
   * @return {ML.Promise} the new promise.
   */
  as: function() {
    var promise = new Promise();
    promise.resolve.apply(promise, arguments);
    return promise;
  },

  /**
   * Returns a new promise that is rejected with a given error.
   * @return {ML.Promise} the new promise.
   */
  error: function() {
    var promise = new Promise();
    promise.reject.apply(promise, arguments);
    return promise;
  },

  /**
   * Returns a new promise that is fulfilled when all of the input promises
   * are resolved. If any promise in the list fails, then the returned promise
   * will fail with the last error. If they all succeed, then the returned
   * promise will succeed, with the results being the results of all the input
   * promises. For example: <pre>
   *   var p1 = ML.Promise.as(1);
   *   var p2 = ML.Promise.as(2);
   *   var p3 = ML.Promise.as(3);
   *
   *   ML.Promise.when(p1, p2, p3).then(function(r1, r2, r3) {
   *     console.log(r1);  // prints 1
   *     console.log(r2);  // prints 2
   *     console.log(r3);  // prints 3
   *   });</pre>
   *
   * The input promises can also be specified as an array: <pre>
   *   var promises = [p1, p2, p3];
   *   ML.Promise.when(promises).then(function(r1, r2, r3) {
   *     console.log(r1);  // prints 1
   *     console.log(r2);  // prints 2
   *     console.log(r3);  // prints 3
   *   });
   * </pre>
   * @param {Array} promises a list of promises to wait for.
   * @return {ML.Promise} the new promise.
   */
  when: function(promises) {
    // Allow passing in Promises as separate arguments instead of an Array.
    var objects;
    if (promises && _isNullOrUndefined(promises.length)) {
      objects = arguments;
    } else {
      objects = promises;
    }
    var isAll = _.last(arguments);
    isAll = _.isBoolean(isAll) ? isAll : false;

    var total = objects.length;
    var hadError = false;
    var results = [];
    var errors = [];
    results.length = objects.length;
    errors.length = objects.length;

    if (total === 0) {
      if(isAll) {
        return Promise.as.call(this, results);
      } else {
        return Promise.as.apply(this, results);
      }
    }

    var promise = new Promise();

    var resolveOne = function(i) {
      total = total - 1;
      if(hadError && !promise._rejected && isAll) {
        promise.reject.call(promise, errors[i]);
        return;
      }

      if (total === 0) {
        if (hadError && !promise._rejected) {
          promise.reject.call(promise, errors);
        } else {
          if(isAll) {
            if(!promise._rejected) {
              promise.resolve.call(promise, results);
            } else {
              //It's rejected already, so we ignore it.
            }
          } else {
            promise.resolve.apply(promise, results);
          }
        }
      }
    };

    _.each(objects, function(object, i) {
      if (Promise.is(object)) {
        object.then(function(result) {
          results[i] = result;
          resolveOne(i);
        }, function(error) {
          errors[i] = error;
          hadError = true;
          resolveOne(i);
        });
      } else {
        results[i] = object;
        resolveOne(i);
      }
    });

    return promise;
  },

  /**
   * Returns a promise that resolves or rejects as soon as one
   * of the promises in the iterable resolves or rejects, with
   * the value or reason from that promise.Returns a new promise
   * that is fulfilled when one of the input promises.
   * For example: <pre>
   *   var p1 = ML.Promise.as(1);
   *   var p2 = ML.Promise.as(2);
   *   var p3 = ML.Promise.as(3);
   *
   *   ML.Promise.race(p1, p2, p3).then(function(result) {
   *     console.log(result);  // prints 1
   *   });</pre>
   *
   * The input promises can also be specified as an array: <pre>
   *   var promises = [p1, p2, p3];
   *   ML.Promise.when(promises).then(function(result) {
   *     console.log(result);  // prints 1
   *   });
   * </pre>
   * @param {Array} promises a list of promises to wait for.
   * @return {ML.Promise} the new promise.
   */
  race: function(promises) {
    // Allow passing in Promises as separate arguments instead of an Array.
    var objects;
    if (promises && _isNullOrUndefined(promises.length)) {
      objects = arguments;
    } else {
      objects = promises;
    }

    var total = objects.length;
    var hadError = false;
    var results = [];
    var errors = [];

    results.length = errors.length = objects.length;

    if (total === 0) {
      return Promise.as.call(this);
    }

    var promise = new Promise();

    var resolveOne = function(i) {
      if (!promise._resolved && !promise._rejected) {
        if (hadError) {
          promise.reject.call(promise, errors[i]);
        } else {
          promise.resolve.call(promise, results[i]);
        }
      }
    };

    _.each(objects, function(object, i) {
      if (Promise.is(object)) {
        object.then(function(result) {
          results[i] = result;
          resolveOne(i);
        }, function(error) {
          errors[i] = error;
          hadError = true;
          resolveOne(i);
        });
      } else {
        results[i] = object;
        resolveOne(i);
      }
    });

    return promise;
  },

  /**
   * Runs the given asyncFunction repeatedly, as long as the predicate
   * function returns a truthy value. Stops repeating if asyncFunction returns
   * a rejected promise.
   * @param {Function} predicate should return false when ready to stop.
   * @param {Function} asyncFunction should return a Promise.
   */
  _continueWhile: function(predicate, asyncFunction) {
    if (predicate()) {
      return asyncFunction().then(function() {
        return Promise._continueWhile(predicate, asyncFunction);
      });
    }
    return Promise.as();
  }
});

/**
 * Just like ML.Promise.when, but it calls resolveCallbck function
 * with one results array and calls rejectCallback function as soon as any one
 * of the input promises rejects.
 * @see ML.Promise.when
 */
Promise.all = function(promises) {
  return Promise.when(promises, true);
};

_.extend(Promise.prototype, /** @lends ML.Promise.prototype */ {

  /**
   * Marks this promise as fulfilled, firing any callbacks waiting on it.
   * @param {Object} result the result to pass to the callbacks.
   */
  resolve: function(result) {
    if (this._resolved || this._rejected) {
      throw "A promise was resolved even though it had already been " +
        (this._resolved ? "resolved" : "rejected") + ".";
    }
    this._resolved = true;
    this._result = arguments;
    var results = arguments;
    _.each(this._resolvedCallbacks, function(resolvedCallback) {
      resolvedCallback.apply(this, results);
    });
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];
  },

  doResolve: function(fn){
    if (!fn) return;
    var done = false;
    var self = this;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        self.resolve.call(self, value);
      }, function (reason) {
           if (done) return;
           done = true;
           self.reject.call(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      self.reject.call(self, ex);
    }
  },

  /**
   * Marks this promise as fulfilled, firing any callbacks waiting on it.
   * @param {Object} error the error to pass to the callbacks.
   */
  reject: function(error) {
    if (this._resolved || this._rejected) {
      throw "A promise was rejected even though it had already been " +
        (this._resolved ? "resolved" : "rejected") + ".";
    }
    this._rejected = true;
    this._error = error;
    _.each(this._rejectedCallbacks, function(rejectedCallback) {
      rejectedCallback(error);
    });
    this._resolvedCallbacks = [];
    this._rejectedCallbacks = [];
  },

  /**
   * Adds callbacks to be called when this promise is fulfilled. Returns a new
   * Promise that will be fulfilled when the callback is complete. It allows
   * chaining. If the callback itself returns a Promise, then the one returned
   * by "then" will not be fulfilled until that one returned by the callback
   * is fulfilled.
   * @param {Function} resolvedCallback Function that is called when this
   * Promise is resolved. Once the callback is complete, then the Promise
   * returned by "then" will also be fulfilled.
   * @param {Function} rejectedCallback Function that is called when this
   * Promise is rejected with an error. Once the callback is complete, then
   * the promise returned by "then" with be resolved successfully. If
   * rejectedCallback is null, or it returns a rejected Promise, then the
   * Promise returned by "then" will be rejected with that error.
   * @return {ML.Promise} A new Promise that will be fulfilled after this
   * Promise is fulfilled and either callback has completed. If the callback
   * returned a Promise, then this Promise will not be fulfilled until that
   * one is.
   */
  then: function(resolvedCallback, rejectedCallback) {
    var promise = new Promise();

    var wrappedResolvedCallback = function() {
      var result = arguments;
      if (resolvedCallback) {
        if (Promise._isPromisesAPlusCompliant) {
          try {
            result = [resolvedCallback.apply(this, result)];
          } catch (e) {
            if(Promise._debugError && e) {
              console.error('Error occurred in promise resolve callback.', e.stack || e);
            }
            result = [Promise.error(e)];
          }
        } else {
          result = [resolvedCallback.apply(this, result)];
        }
      }
      if (result.length === 1 && Promise.is(result[0])) {
        result[0].then(function() {
          promise.resolve.apply(promise, arguments);
        }, function(error) {
          promise.reject(error);
        });
      } else {
        promise.resolve.apply(promise, result);
      }
    };

    var wrappedRejectedCallback = function(error) {
      var result = [];
      if (rejectedCallback) {
        if (Promise._isPromisesAPlusCompliant) {
          try {
            result = [rejectedCallback(error)];
          } catch (e) {
            if(Promise._debugError && e) {
              console.error('Error occurred in promise reject callback.', e.stack || e);
            }
            result = [Promise.error(e)];
          }
        } else {
          result = [rejectedCallback(error)];
        }
        if (result.length === 1 && Promise.is(result[0])) {
          result[0].then(function() {
            promise.resolve.apply(promise, arguments);
          }, function(error) {
            promise.reject(error);
          });
        } else {
          if (Promise._isPromisesAPlusCompliant) {
            promise.resolve.apply(promise, result);
          } else {
            promise.reject(result[0]);
          }
        }
      } else {
        promise.reject(error);
      }
    };

    var runLater = function(func) {
      func.call();
    };
    if (Promise._isPromisesAPlusCompliant) {
      if (typeof(window) !== 'undefined' && _.isFunction(window.setImmediate)) {
        runLater = function(func) {
          window.setImmediate(func);
        };
      } else if (typeof(process) !== 'undefined' && process.nextTick) {
        runLater = function(func) {
           process.nextTick(func);
        };
      } else if (typeof(setTimeout) !== 'undefined' && _.isFunction(setTimeout)) {
        runLater = function(func) {
          setTimeout(func, 0);
        };
      }
    }

    var self = this;
    if (this._resolved) {
      runLater(function() {
        wrappedResolvedCallback.apply(self, self._result);
      });
    } else if (this._rejected) {
      runLater(function() {
        wrappedRejectedCallback.apply(self, [self._error]);
      });
    } else {
      this._resolvedCallbacks.push(wrappedResolvedCallback);
      this._rejectedCallbacks.push(wrappedRejectedCallback);
    }

    return promise;
  },

  /**
   * Add handlers to be called when the Promise object is rejected.
   *
   * @param {Function} rejectedCallback Function that is called when this
   *                   Promise is rejected with an error.
   * @return {ML.Promise} A new Promise that will be fulfilled after this
   *                   Promise is fulfilled and either callback has completed. If the callback
   * returned a Promise, then this Promise will not be fulfilled until that
   *                   one is.
   * @function
   */
  catch: function(onRejected) {
    return this.then(undefined, onRejected);
  },

  /**
   * Add handlers to be called when the promise
   * is either resolved or rejected
   */
  always: function(callback) {
    return this.then(callback, callback);
  },

  /**
   * Add handlers to be called when the Promise object is resolved
   */
  done: function(callback) {
    return this.then(callback);
  },

  /**
   * Add handlers to be called when the Promise object is rejected
   */
  fail: function(callback) {
    return this.then(null, callback);
  },

  /**
   * Run the given callbacks after this promise is fulfilled.
   * @param optionsOrCallback {} A Backbone-style options callback, or a
   * callback function. If this is an options object and contains a "model"
   * attributes, that will be passed to error callbacks as the first argument.
   * @param model {} If truthy, this will be passed as the first result of
   * error callbacks. This is for Backbone-compatability.
   * @return {ML.Promise} A promise that will be resolved after the
   * callbacks are run, with the same result as this.
   */
  _thenRunCallbacks: function(optionsOrCallback, model) {
    var options;
    if (_.isFunction(optionsOrCallback)) {
      var callback = optionsOrCallback;
      options = {
        success: function(result) {
          callback(result, null);
        },
        error: function(error) {
          callback(null, error);
        }
      };
    } else {
      options = _.clone(optionsOrCallback);
    }
    options = options || {};

    return this.then(function(result) {
      if (options.success) {
        options.success.apply(this, arguments);
      } else if (model) {
        // When there's no callback, a sync event should be triggered.
        model.trigger('sync', model, result, options);
      }
      return Promise.as.apply(Promise, arguments);
    }, function(error) {
      if (options.error) {
        if (!_.isUndefined(model)) {
          options.error(model, error);
        } else {
          options.error(error);
        }
      } else if (model) {
        // When there's no error callback, an error event should be triggered.
        model.trigger('error', model, error, options);
      }
      // By explicitly returning a rejected Promise, this will work with
      // either jQuery or Promises/A semantics.
      return Promise.error(error);
    });
  },

  /**
   * Adds a callback function that should be called regardless of whether
   * this promise failed or succeeded. The callback will be given either the
   * array of results for its first argument, or the error as its second,
   * depending on whether this Promise was rejected or resolved. Returns a
   * new Promise, like "then" would.
   * @param {Function} continuation the callback.
   */
  _continueWith: function(continuation) {
    return this.then(function() {
      return continuation(arguments, null);
    }, function(error) {
      return continuation(null, error);
    });
  }

});

/**
 * Alias of ML.Promise.prototype.always
 * @function
 * @see ML.Promise#always
 */
Promise.prototype.finally = Promise.prototype.always;

/**
 * Alias of ML.Promise.prototype.done
 * @function
 * @see ML.Promise#done
 */
Promise.prototype.try = Promise.prototype.done;

}).call(this,require("1YiZ5S"))
},{"1YiZ5S":18,"underscore":22}],11:[function(require,module,exports){
'use strict';

var _ = require('underscore');

// ML.Query is a way to create a list of ML.Objects.
module.exports = function(ML) {
  /**
   * Creates a new maxleap ML.Query for the given ML.Object subclass.
   * @param objectClass -
   *   An instance of a subclass of ML.Object, or a ML className string.
   * @class
   *
   * <p>ML.Query defines a query that is used to fetch ML.Objects. The
   * most common use case is finding all objects that match a query through the
   * <code>find</code> method. For example, this sample code fetches all objects
   * of class <code>MyClass</code>. It calls a different function depending on
   * whether the fetch succeeded or not.
   *
   * <pre>
   * var query = new ML.Query(MyClass);
   * query.find({
   *   success: function(results) {
   *     // results is an array of ML.Object.
   *   },
   *
   *   error: function(error) {
   *     // error is an instance of ML.Error.
   *   }
   * });</pre></p>
   *
   * <p>A ML.Query can also be used to retrieve a single object whose id is
   * known, through the get method. For example, this sample code fetches an
   * object of class <code>MyClass</code> and id <code>myId</code>. It calls a
   * different function depending on whether the fetch succeeded or not.
   *
   * <pre>
   * var query = new ML.Query(MyClass);
   * query.get(myId, {
   *   success: function(object) {
   *     // object is an instance of ML.Object.
   *   },
   *
   *   error: function(object, error) {
   *     // error is an instance of ML.Error.
   *   }
   * });</pre></p>
   *
   * <p>A ML.Query can also be used to count the number of objects that match
   * the query without retrieving all of those objects. For example, this
   * sample code counts the number of objects of the class <code>MyClass</code>
   * <pre>
   * var query = new ML.Query(MyClass);
   * query.count({
   *   success: function(number) {
   *     // There are number instances of MyClass.
   *   },
   *
   *   error: function(error) {
   *     // error is an instance of ML.Error.
   *   }
   * });</pre></p>
   */
  ML.Query = function(objectClass) {
    if (_.isString(objectClass)) {
      objectClass = ML.Object._getSubclass(objectClass);
    }

    this.objectClass = objectClass;

    this.className = objectClass.prototype.className;

    this._where = {};
    this._include = [];
    this._limit = -1; // negative limit means, do not send a limit
    this._skip = 0;
    this._extraOptions = {};
  };

  /**
   * Constructs a ML.Query that is the OR of the passed in queries.  For
   * example:
   * <pre>var compoundQuery = ML.Query.or(query1, query2, query3);</pre>
   *
   * will create a compoundQuery that is an or of the query1, query2, and
   * query3.
   * @param {...ML.Query} var_args The list of queries to OR.
   * @return {ML.Query} The query that is the OR of the passed in queries.
   */
  ML.Query.or = function() {
    var queries = _.toArray(arguments);
    var className = null;
    ML._arrayEach(queries, function(q) {
      if (_.isNull(className)) {
        className = q.className;
      }

      if (className !== q.className) {
        throw "All queries must be for the same class";
      }
    });
    var query = new ML.Query(className);
    query._orQuery(queries);
    return query;
  };

  /**
   * Constructs a ML.Query that is the AND of the passed in queries.  For
   * example:
   * <pre>var compoundQuery = ML.Query.and(query1, query2, query3);</pre>
   *
   * will create a compoundQuery that is an 'and' of the query1, query2, and
   * query3.
   * @param {...ML.Query} var_args The list of queries to AND.
   * @return {ML.Query} The query that is the AND of the passed in queries.
   */
  ML.Query.and = function() {
    var queries = _.toArray(arguments);
    var className = null;
    ML._arrayEach(queries, function(q) {
      if (_.isNull(className)) {
        className = q.className;
      }

      if (className !== q.className) {
        throw "All queries must be for the same class";
      }
    });
    var query = new ML.Query(className);
    query._andQuery(queries);
    return query;
  };

  /**
   * Retrieves a list of MLObjects that satisfy the CQL.
   * CQL syntax please see <a href='https://cn.maxleap.com/docs/cql_guide.html'>CQL Guide.</a>
   * Either options.success or options.error is called when the find
   * completes.
   *
   * @param {String} cql,  A CQL string, see <a href='https://cn.maxleap.com/docs/cql_guide.html'>CQL Guide.</a>
   * @param {Array} pvalues, An array contains placeholder values.
   * @param {Object} options A Backbone-style options object,it's optional.
   * @return {ML.Promise} A promise that is resolved with the results when
   * the query completes,it's optional.
   */
  ML.Query.doCloudQuery = function(cql, pvalues, options) {
    var params = { cql: cql };
    if(_.isArray(pvalues)){
      params.pvalues = pvalues;
    } else {
      options = pvalues;
    }

    var request = ML._request("cloudQuery", null, null, 'GET', params);
    return request.then(function(response) {
      //query to process results.
      var query = new ML.Query(response.className);
      var results = _.map(response.results, function(json) {
        var obj = query._newObject(response);
        obj._finishFetch(query._processResult(json), true);
          return obj;
      });
      return {
        results: results,
        count:  response.count,
        className: response.className
      };
    })._thenRunCallbacks(options);
  };

  ML.Query._extend = ML._extend;

  ML.Query.prototype = {
     //hook to iterate result. Added by dennis<xzhuang@maxleap.com>.
     _processResult: function(obj){
        return obj;
    },

    /**
     * Constructs a ML.Object whose id is already known by fetching data from
     * the server.  Either options.success or options.error is called when the
     * find completes.
     *
     * @param {} objectId The id of the object to be fetched.
     * @param {Object} options A Backbone-style options object.
     */
    get: function(objectId, options) {
      if(!objectId) {
        var errorObject = new ML.Error(ML.Error.OBJECT_NOT_FOUND,
                                          "Object not found.");
        return ML.Promise.error(errorObject);
      }

      var self = this;
      self.equalTo('objectId', objectId);

      return self.first().then(function(response) {
        if (!ML._.isEmpty(response)) {
          return response;
        }

        var errorObject = new ML.Error(ML.Error.OBJECT_NOT_FOUND,
                                          "Object not found.");
        return ML.Promise.error(errorObject);

      })._thenRunCallbacks(options, null);
    },

    /**
     * Returns a JSON representation of this query.
     * @return {Object}
     */
    toJSON: function() {
      var params = {
        where: this._where
      };

      if (this._include.length > 0) {
        params.include = this._include.join(",");
      }
      if (this._select) {
        params.keys = this._select.join(",");
      }
      if (this._limit >= 0) {
        params.limit = this._limit;
      }
      if (this._skip > 0) {
        params.skip = this._skip;
      }
      if (this._order !== undefined) {
        params.order = this._order;
      }

      ML._objectEach(this._extraOptions, function(v, k) {
        params[k] = v;
      });

      return params;
    },

    _newObject: function(response){
      var obj;
      if (response && response.className) {
        obj = new ML.Object(response.className);
      } else {
        obj = new this.objectClass();
      }
      return obj;
    },
    _createRequest: function(params){
      //后端接收的api是 /2.0/classes/{{classname}}/query
      return ML._request("classes", this.className + '/query', null, "POST",
                                   params || this.toJSON());
    },

    /**
     * Retrieves a list of MLObjects that satisfy this query.
     * Either options.success or options.error is called when the find
     * completes.
     *
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is resolved with the results when
     * the query completes.
     */
    find: function(options) {
      var self = this;

      var request = this._createRequest();

      return request.then(function(response) {
        return _.map(response.results, function(json) {
          var obj = self._newObject(response);
          obj._finishFetch(self._processResult(json), true);
          return obj;
        });
      })._thenRunCallbacks(options);
    },

   /**
    * Delete objects retrieved by this query.
    * @param {Object} options Standard options object with success and error
    *     callbacks.
    * @return {ML.Promise} A promise that is fulfilled when the save
    *     completes.
    */
     destroyAll: function(options){
       var self = this;
       return self.find().then(function(objects){
           return ML.Object.destroyAll(objects);
       })._thenRunCallbacks(options);
     },

    /**
     * Counts the number of objects that match this query.
     * Either options.success or options.error is called when the count
     * completes.
     *
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is resolved with the count when
     * the query completes.
     */
    count: function(options) {
      var params = this.toJSON();
      params.limit = 0;
      params.count = 1;
      var request = this._createRequest(params);
      return request.then(function(response) {
        return response.count;
      })._thenRunCallbacks(options);
    },

    /**
     * Retrieves at most one ML.Object that satisfies this query.
     *
     * Either options.success or options.error is called when it completes.
     * success is passed the object if there is one. otherwise, undefined.
     *
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is resolved with the object when
     * the query completes.
     */
    first: function(options) {
      var self = this;

      var params = this.toJSON();
      params.limit = 1;
      var request = this._createRequest(params);

      return request.then(function(response) {
        return _.map(response.results, function(json) {
          var obj = self._newObject();
          obj._finishFetch(self._processResult(json), true);
          return obj;
        })[0];
      })._thenRunCallbacks(options);
    },

    /**
     * Returns a new instance of ML.Collection backed by this query.
     * @return {ML.Collection}
     */
    collection: function(items, options) {
      options = options || {};
      return new ML.Collection(items, _.extend(options, {
        model: this._objectClass || this.objectClass,
        query: this
      }));
    },

    /**
     * Sets the number of results to skip before returning any results.
     * This is useful for pagination.
     * Default is to skip zero results.
     * @param {Number} n the number of results to skip.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    skip: function(n) {
      this._skip = n;
      return this;
    },

    /**
     * Sets the limit of the number of results to return. The default limit is
     * 100, with a maximum of 1000 results being returned at a time.
     * @param {Number} n the number of results to limit to.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    limit: function(n) {
      this._limit = n;
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that the ML.Object must contain.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    equalTo: function(key, value) {
      this._where[key] = ML._encode(value);
      return this;
    },

    /**
     * Helper for condition queries
     */
    _addCondition: function(key, condition, value) {
      // Check if we already have a condition
      if (!this._where[key]) {
        this._where[key] = {};
      }
      this._where[key][condition] = ML._encode(value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular
     * <strong>array</strong> key's length to be equal to the provided value.
     * @param {String} key The array key to check.
     * @param value The length value.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    sizeEqualTo: function(key, value) {
      this._addCondition(key, "$size", value);
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be not equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that must not be equalled.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    notEqualTo: function(key, value) {
      this._addCondition(key, "$ne", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be less than the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an upper bound.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    lessThan: function(key, value) {
      this._addCondition(key, "$lt", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be greater than the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an lower bound.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    greaterThan: function(key, value) {
      this._addCondition(key, "$gt", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be less than or equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an upper bound.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    lessThanOrEqualTo: function(key, value) {
      this._addCondition(key, "$lte", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be greater than or equal to the provided value.
     * @param {String} key The key to check.
     * @param value The value that provides an lower bound.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    greaterThanOrEqualTo: function(key, value) {
      this._addCondition(key, "$gte", value);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * be contained in the provided list of values.
     * @param {String} key The key to check.
     * @param {Array} values The values that will match.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    containedIn: function(key, values) {
      this._addCondition(key, "$in", values);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * not be contained in the provided list of values.
     * @param {String} key The key to check.
     * @param {Array} values The values that will not match.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    notContainedIn: function(key, values) {
      this._addCondition(key, "$nin", values);
      return this;
    },

    /**
     * Add a constraint to the query that requires a particular key's value to
     * contain each one of the provided list of values.
     * @param {String} key The key to check.  This key's value must be an array.
     * @param {Array} values The values that will match.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    containsAll: function(key, values) {
      this._addCondition(key, "$all", values);
      return this;
    },


    /**
     * Add a constraint for finding objects that contain the given key.
     * @param {String} key The key that should exist.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    exists: function(key) {
      this._addCondition(key, "$exists", true);
      return this;
    },

    /**
     * Add a constraint for finding objects that do not contain a given key.
     * @param {String} key The key that should not exist
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    doesNotExist: function(key) {
      this._addCondition(key, "$exists", false);
      return this;
    },

    /**
     * Add a regular expression constraint for finding string values that match
     * the provided regular expression.
     * This may be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {RegExp} regex The regular expression pattern to match.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    matches: function(key, regex, modifiers) {
      this._addCondition(key, "$regex", regex);
      if (!modifiers) { modifiers = ""; }
      // Javascript regex options support mig as inline options but store them
      // as properties of the object. We support mi & should migrate them to
      // modifiers
      if (regex.ignoreCase) { modifiers += 'i'; }
      if (regex.multiline) { modifiers += 'm'; }

      if (modifiers && modifiers.length) {
        this._addCondition(key, "$options", modifiers);
      }
      return this;
    },

    /**
     * Add a constraint that requires that a key's value matches a ML.Query
     * constraint.
     * @param {String} key The key that the contains the object to match the
     *                     query.
     * @param {ML.Query} query The query that should match.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    matchesQuery: function(key, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$inQuery", queryJSON);
      return this;
    },

   /**
     * Add a constraint that requires that a key's value not matches a
     * ML.Query constraint.
     * @param {String} key The key that the contains the object to match the
     *                     query.
     * @param {ML.Query} query The query that should not match.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    doesNotMatchQuery: function(key, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$notInQuery", queryJSON);
      return this;
    },


    /**
     * Add a constraint that requires that a key's value matches a value in
     * an object returned by a different ML.Query.
     * @param {String} key The key that contains the value that is being
     *                     matched.
     * @param {String} queryKey The key in the objects returned by the query to
     *                          match against.
     * @param {ML.Query} query The query to run.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    matchesKeyInQuery: function(key, queryKey, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$select",
                         { key: queryKey, query: queryJSON });
      return this;
    },

    /**
     * Add a constraint that requires that a key's value not match a value in
     * an object returned by a different ML.Query.
     * @param {String} key The key that contains the value that is being
     *                     excluded.
     * @param {String} queryKey The key in the objects returned by the query to
     *                          match against.
     * @param {ML.Query} query The query to run.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    doesNotMatchKeyInQuery: function(key, queryKey, query) {
      var queryJSON = query.toJSON();
      queryJSON.className = query.className;
      this._addCondition(key, "$dontSelect",
                         { key: queryKey, query: queryJSON });
      return this;
    },

    /**
     * Add constraint that at least one of the passed in queries matches.
     * @param {Array} queries
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    _orQuery: function(queries) {
      var queryJSON = _.map(queries, function(q) {
        return q.toJSON().where;
      });

      this._where.$or = queryJSON;
      return this;
    },

    /**
     * Add constraint that both of the passed in queries matches.
     * @param {Array} queries
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    _andQuery: function(queries) {
      var queryJSON = _.map(queries, function(q) {
        return q.toJSON().where;
      });

      this._where.$and = queryJSON;
      return this;
    },


    /**
     * Converts a string into a regex that matches it.
     * Surrounding with \Q .. \E does this, we just need to escape \E's in
     * the text separately.
     */
    _quote: function(s) {
      return "\\Q" + s.replace("\\E", "\\E\\\\E\\Q") + "\\E";
    },

    /**
     * Add a constraint for finding string values that contain a provided
     * string.  This may be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} substring The substring that the value must contain.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    contains: function(key, value) {
      this._addCondition(key, "$regex", this._quote(value));
      return this;
    },

    /**
     * Add a constraint for finding string values that start with a provided
     * string.  This query will use the backend index, so it will be fast even
     * for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} prefix The substring that the value must start with.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    startsWith: function(key, value) {
      this._addCondition(key, "$regex", "^" + this._quote(value));
      return this;
    },

    /**
     * Add a constraint for finding string values that end with a provided
     * string.  This will be slow for large datasets.
     * @param {String} key The key that the string to match is stored in.
     * @param {String} suffix The substring that the value must end with.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    endsWith: function(key, value) {
      this._addCondition(key, "$regex", this._quote(value) + "$");
      return this;
    },

    /**
     * Sorts the results in ascending order by the given key.
     *
     * @param {String} key The key to order by.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    ascending: function(key) {
      this._order = key;
      return this;
    },

  /**
   * Also sorts the results in ascending order by the given key. The previous sort keys have
   * precedence over this key.
   *
   * @param {String} key The key to order by
   * @return {ML.Query} Returns the query so you can chain this call.
   */
   addAscending: function(key){
     if(this._order)
       this._order +=  ','  + key;
    else
       this._order = key;
    return this;
   },

    /**
     * Sorts the results in descending order by the given key.
     *
     * @param {String} key The key to order by.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    descending: function(key) {
      this._order = "-" + key;
      return this;
    },

     /**
   * Also sorts the results in descending order by the given key. The previous sort keys have
   * precedence over this key.
   *
   * @param {String} key The key to order by
   * @return {ML.Query} Returns the query so you can chain this call.
   */
   addDescending: function(key){
     if(this._order)
       this._order += ',-' + key;
     else
       this._order = '-' + key;
     return key;
   },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given.
     * @param {String} key The key that the ML.GeoPoint is stored in.
     * @param {ML.GeoPoint} point The reference ML.GeoPoint that is used.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    near: function(key, point) {
      if (!(point instanceof ML.GeoPoint)) {
        // Try to cast it to a GeoPoint, so that near("loc", [20,30]) works.
        point = new ML.GeoPoint(point);
      }
      this._addCondition(key, "$nearSphere", point);
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * @param {String} key The key that the ML.GeoPoint is stored in.
     * @param {ML.GeoPoint} point The reference ML.GeoPoint that is used.
     * @param maxDistance Maximum distance (in radians) of results to return.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    withinRadians: function(key, point, distance) {
      this.near(key, point);
      this._addCondition(key, "$maxDistance", distance);
      return this;
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * Radius of earth used is 3958.8 miles.
     * @param {String} key The key that the ML.GeoPoint is stored in.
     * @param {ML.GeoPoint} point The reference ML.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in miles) of results to
     *     return.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    withinMiles: function(key, point, distance) {
      return this.withinRadians(key, point, distance / 3958.8);
    },

    /**
     * Add a proximity based constraint for finding objects with key point
     * values near the point given and within the maximum distance given.
     * Radius of earth used is 6371.0 kilometers.
     * @param {String} key The key that the ML.GeoPoint is stored in.
     * @param {ML.GeoPoint} point The reference ML.GeoPoint that is used.
     * @param {Number} maxDistance Maximum distance (in kilometers) of results
     *     to return.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    withinKilometers: function(key, point, distance) {
      return this.withinRadians(key, point, distance / 6371.0);
    },

    /**
     * Add a constraint to the query that requires a particular key's
     * coordinates be contained within a given rectangular geographic bounding
     * box.
     * @param {String} key The key to be constrained.
     * @param {ML.GeoPoint} southwest
     *     The lower-left inclusive corner of the box.
     * @param {ML.GeoPoint} northeast
     *     The upper-right inclusive corner of the box.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    withinGeoBox: function(key, southwest, northeast) {
      if (!(southwest instanceof ML.GeoPoint)) {
        southwest = new ML.GeoPoint(southwest);
      }
      if (!(northeast instanceof ML.GeoPoint)) {
        northeast = new ML.GeoPoint(northeast);
      }
      this._addCondition(key, '$within', { '$box': [southwest, northeast] });
      return this;
    },

    /**
     * Include nested ML.Objects for the provided key.  You can use dot
     * notation to specify which fields in the included object are also fetch.
     * @param {String} key The name of the key to include.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    include: function() {
      var self = this;
      ML._arrayEach(arguments, function(key) {
        if (_.isArray(key)) {
          self._include = self._include.concat(key);
        } else {
          self._include.push(key);
        }
      });
      return this;
    },

    /**
     * Restrict the fields of the returned ML.Objects to include only the
     * provided keys.  If this is called multiple times, then all of the keys
     * specified in each of the calls will be included.
     * @param {Array} keys The names of the keys to include.
     * @return {ML.Query} Returns the query, so you can chain this call.
     */
    select: function() {
      var self = this;
      this._select = this._select || [];
      ML._arrayEach(arguments, function(key) {
        if (_.isArray(key)) {
          self._select = self._select.concat(key);
        } else {
          self._select.push(key);
        }
      });
      return this;
    },

    /**
     * Iterates over each result of a query, calling a callback for each one. If
     * the callback returns a promise, the iteration will not continue until
     * that promise has been fulfilled. If the callback returns a rejected
     * promise, then iteration will stop with that error. The items are
     * processed in an unspecified order. The query may not have any sort order,
     * and may not use limit or skip.
     * @param callback {Function} Callback that will be called with each result
     *     of the query.
     * @param options {Object} An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     * @return {ML.Promise} A promise that will be fulfilled once the
     *     iteration has completed.
     */
    each: function(callback, options) {
      options = options || {};

      if (this._order || this._skip || (this._limit >= 0)) {
        var error =
          "Cannot iterate on a query with sort, skip, or limit.";
        return ML.Promise.error(error)._thenRunCallbacks(options);
      }

      var promise = new ML.Promise();

      var query = new ML.Query(this.objectClass);
      // We can override the batch size from the options.
      // This is undocumented, but useful for testing.
      query._limit = options.batchSize || 100;
      query._where = _.clone(this._where);
      query._include = _.clone(this._include);

      query.ascending('objectId');

      var finished = false;
      return ML.Promise._continueWhile(function() {
        return !finished;

      }, function() {
        return query.find().then(function(results) {
          var callbacksDone = ML.Promise.as();
          ML._.each(results, function(result) {
            callbacksDone = callbacksDone.then(function() {
              return callback(result);
            });
          });

          return callbacksDone.then(function() {
            if (results.length >= query._limit) {
              query.greaterThan("objectId", results[results.length - 1].id);
            } else {
              finished = true;
            }
          });
        });
      })._thenRunCallbacks(options);
    }
  };

   ML.FriendShipQuery = ML.Query._extend({
     _objectClass: ML.User,
     _newObject: function(){
      return new ML.User();
    },
     _processResult: function(json){
      var user = json[this._friendshipTag];
      if(user.__type === 'Pointer' && user.className === '_User'){
        delete user.__type;
        delete user.className;
      }
      return user;
    },
   });
};

},{"underscore":22}],12:[function(require,module,exports){
'use strict';
var _ = require('underscore');

module.exports = function(ML) {
  /**
   * Creates a new Relation for the given parent object and key. This
   * constructor should rarely be used directly, but rather created by
   * ML.Object.relation.
   * @param {ML.Object} parent The parent of this relation.
   * @param {String} key The key for this relation on the parent.
   * @see ML.Object#relation
   * @class
   *
   * <p>
   * A class that is used to access all of the children of a many-to-many
   * relationship.  Each instance of ML.Relation is associated with a
   * particular parent object and key.
   * </p>
   */
  ML.Relation = function(parent, key) {
    if (! _.isString(key)) {
      throw new TypeError('key must be a string');
    }
    this.parent = parent;
    this.key = key;
    this.targetClassName = null;
  };

  /**
   * Creates a query that can be used to query the parent objects in this relation.
   * @param {String} parentClass The parent class or name.
   * @param {String} relationKey The relation field key in parent.
   * @param {ML.Object} child The child object.
   * @return {ML.Query}
   */
  ML.Relation.reverseQuery = function(parentClass, relationKey, child){
    var query = new ML.Query(parentClass);
    query.equalTo(relationKey, child._toPointer());
    return query;
  };

  ML.Relation.prototype = {
    /**
     * Makes sure that this relation has the right parent and key.
     */
    _ensureParentAndKey: function(parent, key) {
      this.parent = this.parent || parent;
      this.key = this.key || key;
      if (this.parent !== parent) {
        throw "Internal Error. Relation retrieved from two different Objects.";
      }
      if (this.key !== key) {
        throw "Internal Error. Relation retrieved from two different keys.";
      }
    },

    /**
     * Adds a ML.Object or an array of ML.Objects to the relation.
     * @param {} objects The item or items to add.
     */
    add: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      var change = new ML.Op.Relation(objects, []);
      this.parent.set(this.key, change);
      this.targetClassName = change._targetClassName;
    },

    /**
     * Removes a ML.Object or an array of ML.Objects from this relation.
     * @param {} objects The item or items to remove.
     */
    remove: function(objects) {
      if (!_.isArray(objects)) {
        objects = [objects];
      }

      var change = new ML.Op.Relation([], objects);
      this.parent.set(this.key, change);
      this.targetClassName = change._targetClassName;
    },

    /**
     * Returns a JSON version of the object suitable for saving to disk.
     * @return {Object}
     */
    toJSON: function() {
      return { "__type": "Relation", "className": this.targetClassName };
    },

    /**
     * Returns a ML.Query that is limited to objects in this
     * relation.
     * @return {ML.Query}
     */
    query: function() {
      var targetClass;
      var query;
      if (!this.targetClassName) {
        targetClass = ML.Object._getSubclass(this.parent.className);
        query = new ML.Query(targetClass);
        query._extraOptions.redirectClassNameForKey = this.key;
      } else {
        targetClass = ML.Object._getSubclass(this.targetClassName);
        query = new ML.Query(targetClass);
      }
      query._addCondition("$relatedTo", "object", this.parent._toPointer());
      query._addCondition("$relatedTo", "key", this.key);

      return query;
    }
  };
};

},{"underscore":22}],13:[function(require,module,exports){
'use strict';

module.exports = function(){

  var cookie = require('tiny-cookie');

  function set(key, value, options){
    cookie.set(key, value, options);
  }

  function get(key){
    return cookie.get(key);
  }

  return {
    set: set,
    get: get
  }
};
},{"tiny-cookie":21}],14:[function(require,module,exports){
'use strict';

var _ = require('underscore');

module.exports = function(ML) {
  /**
   * @class
   *
   * <p>A ML.User object is a local representation of a user persisted to the
   * ML cloud. This class is a subclass of a ML.Object, and retains the
   * same functionality of a ML.Object, but also extends it with various
   * user specific methods, like authentication, signing up, and validation of
   * uniqueness.</p>
   */
  ML.User = ML.Object.extend("_User", /** @lends ML.User.prototype */ {
    // Instance Variables
    _isCurrentUser: false,


    // Instance Methods

    /**
     * Internal method to handle special fields in a _User response.
     */
    _mergeMagicFields: function(attrs) {
      if (attrs.sessionToken) {
        this._sessionToken = attrs.sessionToken;
        delete attrs.sessionToken;
      }
      ML.User.__super__._mergeMagicFields.call(this, attrs);
    },

    /**
     * Removes null values from authData (which exist temporarily for
     * unlinking)
     */
    _cleanupAuthData: function() {
      if (!this.isCurrent()) {
        return;
      }
      var authData = this.get('authData');
      if (!authData) {
        return;
      }
      ML._objectEach(this.get('authData'), function(value, key) {
        if (!authData[key]) {
          delete authData[key];
        }
      });
    },

    /**
     * Synchronizes authData for all providers.
     */
    _synchronizeAllAuthData: function() {
      var authData = this.get('authData');
      if (!authData) {
        return;
      }

      var self = this;
      ML._objectEach(this.get('authData'), function(value, key) {
        self._synchronizeAuthData(key);
      });
    },

    /**
     * Synchronizes auth data for a provider (e.g. puts the access token in the
     * right place to be used by the Facebook SDK).
     */
    _synchronizeAuthData: function(provider) {
      if (!this.isCurrent()) {
        return;
      }
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = ML.User._authProviders[authType];
      } else {
        authType = provider.getAuthType();
      }
      var authData = this.get('authData');
      if (!authData || !provider) {
        return;
      }
      var success = provider.restoreAuthentication(authData[authType]);
      if (!success) {
        this._unlinkFrom(provider);
      }
    },

    _handleSaveResult: function(makeCurrent) {
      // Clean up and synchronize the authData object, removing any unset values
      if (makeCurrent) {
        this._isCurrentUser = true;
      }
      this._cleanupAuthData();
      this._synchronizeAllAuthData();
      // Don't keep the password around.
      delete this._serverData.password;
      this._rebuildEstimatedDataForKey("password");
      this._refreshCache();
      if (makeCurrent || this.isCurrent()) {
        ML.User._saveCurrentUser(this);
      }
    },

    /**
     * Unlike in the Android/iOS SDKs, logInWith is unnecessary, since you can
     * call linkWith on the user (even if it doesn't exist yet on the server).
     */
    _linkWith: function(provider, options) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = ML.User._authProviders[provider];
      } else {
        authType = provider.getAuthType();
      }
      if (_.has(options, 'authData')) {
        var authData = this.get('authData') || {};
        authData[authType] = options.authData;
        this.set('authData', authData);

        // Overridden so that the user can be made the current user.
        var newOptions = _.clone(options) || {};
        newOptions.success = function(model) {
          model._handleSaveResult(true);
          if (options.success) {
            options.success.apply(this, arguments);
          }
        };
        return this.save({'authData': authData}, newOptions);
      } else {
        var self = this;
        var promise = new ML.Promise();
        provider.authenticate({
          success: function(provider, result) {
            self._linkWith(provider, {
              authData: result,
              success: options.success,
              error: options.error
            }).then(function() {
              promise.resolve(self);
            });
          },
          error: function(provider, error) {
            if (options.error) {
              options.error(self, error);
            }
            promise.reject(error);
          }
        });
        return promise;
      }
    },

    /**
     * Unlinks a user from a service.
     */
    _unlinkFrom: function(provider, options) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
        provider = ML.User._authProviders[provider];
      } else {
        authType = provider.getAuthType();
      }
      var newOptions = _.clone(options);
      var self = this;
      newOptions.authData = null;
      newOptions.success = function(model) {
        self._synchronizeAuthData(provider);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this._linkWith(provider, newOptions);
    },

    /**
     * Checks whether a user is linked to a service.
     */
    _isLinked: function(provider) {
      var authType;
      if (_.isString(provider)) {
        authType = provider;
      } else {
        authType = provider.getAuthType();
      }
      var authData = this.get('authData') || {};
      return !!authData[authType];
    },

    /**
     * Deauthenticates all providers.
     */
    _logOutWithAll: function() {
      var authData = this.get('authData');
      if (!authData) {
        return;
      }
      var self = this;
      ML._objectEach(this.get('authData'), function(value, key) {
        self._logOutWith(key);
      });
    },

    /**
     * Deauthenticates a single provider (e.g. removing access tokens from the
     * Facebook SDK).
     */
    _logOutWith: function(provider) {
      if (!this.isCurrent()) {
        return;
      }
      if (_.isString(provider)) {
        provider = ML.User._authProviders[provider];
      }
      if (provider && provider.deauthenticate) {
        provider.deauthenticate();
      }
    },

    /**
     * Signs up a new user. You should call this instead of save for
     * new ML.Users. This will create a new ML.User on the server, and
     * also persist the session on disk so that you can access the user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling signUp.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} attrs Extra fields to set on the new user, or null.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled when the signup
     *     finishes.
     * @see ML.User.signUp
     */
    signUp: function(attrs, options) {
      var error;
      options = options || {};

      var username = (attrs && attrs.username) || this.get("username");
      if (!username || (username === "")) {
        error = new ML.Error(
            ML.Error.OTHER_CAUSE,
            "Cannot sign up user with an empty name.");
        if (options && options.error) {
          options.error(this, error);
        }
        return ML.Promise.error(error);
      }

      var password = (attrs && attrs.password) || this.get("password");
      if (!password || (password === "")) {
        error = new ML.Error(
            ML.Error.OTHER_CAUSE,
            "Cannot sign up user with an empty password.");
        if (options && options.error) {
          options.error(this, error);
        }
        return ML.Promise.error(error);
      }

      // Overridden so that the user can be made the current user.
      var newOptions = _.clone(options);
      newOptions.success = function(model) {
        model._handleSaveResult(true);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this.save(attrs, newOptions);
    },

    /**
     * Signs up a new anonymous user.
     * @return {Promise} A promise that is resolved when the signup
     *     finishes.
     */
    anonymousSignUp: function () {
      var model = this;
      var authData = {
        anonymous: {
          id: uuid.v1()
        }
      };
      model.set('authData', authData);
      return this.save().then(function (resp) {
        model._handleSaveResult();
        return model;
      });
    },

    /**
     * Signs up a new user with mobile phone and sms code.
     * You should call this instead of save for
     * new ML.Users. This will create a new ML.User on the server, and
     * also persist the session on disk so that you can access the user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling signUp.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} attrs Extra fields to set on the new user, or null.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled when the signup
     *     finishes.
     * @see ML.User.signUpOrlogInWithMobilePhone
     * @see ML.Cloud.requestSmsCode
     */
    signUpOrlogInWithMobilePhone: function(attrs, options) {
      var error;
      options = options || {};

      var mobilePhoneNumber = (attrs && attrs.mobilePhoneNumber) ||
                              this.get("mobilePhoneNumber");
      if (!mobilePhoneNumber || (mobilePhoneNumber === "")) {
        error = new ML.Error(
            ML.Error.OTHER_CAUSE,
            "Cannot sign up or login user by mobilePhoneNumber " +
            "with an empty mobilePhoneNumber.");
        if (options && options.error) {
          options.error(this, error);
        }
        return ML.Promise.error(error);
      }

      var smsCode = (attrs && attrs.smsCode) || this.get("smsCode");
      if (!smsCode || (smsCode === "")) {
        error = new ML.Error(
            ML.Error.OTHER_CAUSE,
             "Cannot sign up or login user by mobilePhoneNumber  " +
             "with an empty smsCode.");
        if (options && options.error) {
          options.error(this, error);
        }
        return ML.Promise.error(error);
      }

      // Overridden so that the user can be made the current user.
      var newOptions = _.clone(options);
      newOptions._makeRequest = function(route, className, id, method, json) {
        return ML._request('usersByMobilePhone', null, null, "POST", json);
      };
      newOptions.success = function(model) {
        model._handleSaveResult(true);
        delete model.attributes.smsCode;
        delete model._serverData.smsCode;
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return this.save(attrs, newOptions);
    },

    /**
     * Logs in a ML.User. On success, this saves the session to localStorage,
     * so you can retrieve the currently logged in user using
     * <code>current</code>.
     *
     * <p>A username and password must be set before calling logIn.</p>
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {Object} options A Backbone-style options object.
     * @see ML.User.logIn
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the login is complete.
     */
    logIn: function(options) {
      var model = this;
      var request = ML._request("login", null, null, "POST", this.toJSON());
      return request.then(function(resp, status, xhr) {
        var serverAttrs = model.parse(resp, status, xhr);
        model._finishFetch(serverAttrs);
        model._handleSaveResult(true);
        if(!serverAttrs.smsCode)
          delete model.attributes['smsCode'];
        return model;
      })._thenRunCallbacks(options, this);
    },

    /**
     * @see ML.Object#save
     */
    save: function(arg1, arg2, arg3) {
      var i, attrs, current, options, saved;
      if (_.isObject(arg1) || _.isNull(arg1) || _.isUndefined(arg1)) {
        attrs = arg1;
        options = arg2;
      } else {
        attrs = {};
        attrs[arg1] = arg2;
        options = arg3;
      }
      options = options || {};

      var newOptions = _.clone(options);
      newOptions.success = function(model) {
        model._handleSaveResult(false);
        if (options.success) {
          options.success.apply(this, arguments);
        }
      };
      return ML.Object.prototype.save.call(this, attrs, newOptions);
    },

    /**
     * Follow a user
     * @since 0.3.0
     * @param {} target The target user or user's objectId to follow.
     * @param {Object} options An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     */
    follow: function(target, options){
      if(!this.id){
          throw "Please signin.";
      }
      if(!target){
          throw "Invalid target user.";
      }
      var userObjectId = _.isString(target) ? target: target.id;
      if(!userObjectId){
          throw "Invalid target user.";
      }
      var route = 'users/' + this.id + '/friendship/' + userObjectId;
      var request = ML._request(route, null, null, 'POST', null);
      return request._thenRunCallbacks(options);
    },

    /**
     * Unfollow a user.
     * @since 0.3.0
     * @param {} target The target user or user's objectId to unfollow.
     * @param options {Object} An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     */
    unfollow: function(target, options){
      if(!this.id){
          throw "Please signin.";
      }
      if(!target){
          throw "Invalid target user.";
      }
      var userObjectId = _.isString(target) ? target: target.id;
      if(!userObjectId){
          throw "Invalid target user.";
      }
      var route = 'users/' + this.id + '/friendship/' + userObjectId;
      var request = ML._request(route, null, null, 'DELETE', null);
      return request._thenRunCallbacks(options);
    },

    /**
     *Create a follower query to query the user's followers.
     * @since 0.3.0
     * @see ML.User#followerQuery
     */
    followerQuery: function() {
        return ML.User.followerQuery(this.id);
    },

    /**
     *Create a followee query to query the user's followees.
     * @since 0.3.0
     * @see ML.User#followeeQuery
     */
    followeeQuery: function() {
        return ML.User.followeeQuery(this.id);
    },

    /**
     * @see ML.Object#fetch
     */
    fetch: function(options) {
      var newOptions = options ? _.clone(options) : {};
      newOptions.success = function(model) {
        model._handleSaveResult(false);
        if (options && options.success) {
          options.success.apply(this, arguments);
        }
      };
      return ML.Object.prototype.fetch.call(this, newOptions);
    },

    /**
     * Update user's new password safely based on old password.
     * @param {String} oldPassword, the old password.
     * @param {String} newPassword, the new password.
     * @param {Object} An optional Backbone-like options object with
     *     success and error callbacks that will be invoked once the iteration
     *     has finished.
     */
    updatePassword: function(oldPassword, newPassword, options) {
      var route = 'updatePassword';
      var params = {
        password: oldPassword,
        newPassword: newPassword
      };
      var request = ML._request(route, null, null, 'POST', params);
      return request._thenRunCallbacks(options, this);
    },

    /**
     * Returns true if <code>current</code> would return this user.
     * @see ML.User#current
     */
    isCurrent: function() {
      return this._isCurrentUser;
    },

    /**
     * Returns get("username").
     * @return {String}
     * @see ML.Object#get
     */
    getUsername: function() {
      return this.get("username");
    },

    /**
     * Returns get("mobilePhoneNumber").
     * @return {String}
     * @see ML.Object#get
     */
    getMobilePhoneNumber: function(){
      return this.get("mobilePhoneNumber");
    },

    /**
     * Calls set("mobilePhoneNumber", phoneNumber, options) and returns the result.
     * @param {String} mobilePhoneNumber
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see ML.Object.set
     */
    setMobilePhoneNumber: function(phone, options) {
      return this.set("mobilePhoneNumber", phone, options);
    },

    /**
     * Calls set("username", username, options) and returns the result.
     * @param {String} username
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see ML.Object.set
     */
    setUsername: function(username, options) {
      return this.set("username", username, options);
    },

    /**
     * Calls set("password", password, options) and returns the result.
     * @param {String} password
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see ML.Object.set
     */
    setPassword: function(password, options) {
      return this.set("password", password, options);
    },

    /**
     * Returns get("email").
     * @return {String}
     * @see ML.Object#get
     */
    getEmail: function() {
      return this.get("email");
    },

    /**
     * Calls set("email", email, options) and returns the result.
     * @param {String} email
     * @param {Object} options A Backbone-style options object.
     * @return {Boolean}
     * @see ML.Object.set
     */
    setEmail: function(email, options) {
      return this.set("email", email, options);
    },

    /**
     * Checks whether this user is the current user and has been authenticated.
     * @return (Boolean) whether this user is the current user and is logged in.
     */
    authenticated: function() {
      return !!this._sessionToken &&
          (ML.User.current() && ML.User.current().id === this.id);
    }

  }, /** @lends ML.User */ {
    // Class Variables

    // The currently logged-in user.
    _currentUser: null,

    // Whether currentUser is known to match the serialized version on disk.
    // This is useful for saving a localstorage check if you try to load
    // _currentUser frequently while there is none stored.
    _currentUserMatchesDisk: false,

    // The localStorage key suffix that the current user is stored under.
    _CURRENT_USER_KEY: "currentUser",

    // The mapping of auth provider names to actual providers
    _authProviders: {},


    // Class Methods

    /**
     * Signs up a new user with a username (or email) and password.
     * This will create a new ML.User on the server, and also persist the
     * session in localStorage so that you can access the user using
     * {@link #current}.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} username The username (or email) to sign up with.
     * @param {String} password The password to sign up with.
     * @param {Object} attrs Extra fields to set on the new user.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the signup completes.
     * @see ML.User#signUp
     */
    signUp: function(username, password, attrs, options) {
      attrs = attrs || {};
      attrs.username = username;
      attrs.password = password;
      var user = ML.Object._create("_User");
      return user.signUp(attrs, options);
    },

    /**
     * Logs in a user with a username (or email) and password. On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} username The username (or email) to log in with.
     * @param {String} password The password to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see ML.User#logIn
     */
    logIn: function(username, password, options) {
      var user = ML.Object._create("_User");
      user._finishFetch({ username: username, password: password });
      return user.logIn(options);
    },

    /**
     * Logs in a user with a session token. On success, this saves the session
     * to disk, so you can retrieve the currently logged in user using
     * <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} sessionToken The sessionToken to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     */
    become: function(sessionToken, options) {
      options = options || {};

      var user = ML.Object._create("_User");
      return ML._request(
          "users",
          "me",
          null,
          "GET",
          {
            useMasterKey: options.useMasterKey,
            session_token: sessionToken
          }
      ).then(function(resp, status, xhr) {
          var serverAttrs = user.parse(resp, status, xhr);
          user._finishFetch(serverAttrs);
          user._handleSaveResult(true);
          return user;

      })._thenRunCallbacks(options, user);
    },

    /**
     * Logs in a user with a mobile phone number and sms code sent by
     * ML.User.requestLoginSmsCode.On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The user's mobilePhoneNumber
     * @param {String} smsCode The sms code sent by ML.User.requestLoginSmsCode
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see ML.User#logIn
     */
   logInWithMobilePhoneSmsCode: function(mobilePhone, smsCode, options){
      var user = ML.Object._create("_User");
      user._finishFetch({ mobilePhoneNumber: mobilePhone, smsCode: smsCode });
      return user.logIn(options);
   },

    /**
     * Sign up or logs in a user with a mobilePhoneNumber and smsCode.
     * On success, this saves the session to disk, so you can retrieve the currently
     * logged in user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhoneNumber The user's mobilePhoneNumber.
     * @param {String} smsCode The sms code sent by ML.Cloud.requestSmsCode
     * @param {Object} attributes  The user's other attributes such as username etc.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see ML.User#signUpOrlogInWithMobilePhone
     * @see ML.Cloud.requestSmsCode
     */
    signUpOrlogInWithMobilePhone: function(mobilePhoneNumber, smsCode, attrs, options) {
      attrs = attrs || {};
      attrs.mobilePhoneNumber = mobilePhoneNumber;
      attrs.smsCode = smsCode;
      var user = ML.Object._create("_User");
      return user.signUpOrlogInWithMobilePhone(attrs, options);
    },


    /**
     * Logs in a user with a mobile phone number and password. On success, this
     * saves the session to disk, so you can retrieve the currently logged in
     * user using <code>current</code>.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The user's mobilePhoneNumber
     * @param {String} password The password to log in with.
     * @param {Object} options A Backbone-style options object.
     * @return {ML.Promise} A promise that is fulfilled with the user when
     *     the login completes.
     * @see ML.User#logIn
     */
   logInWithMobilePhone: function(mobilePhone, password, options){
      var user = ML.Object._create("_User");
      user._finishFetch({ mobilePhoneNumber: mobilePhone, password: password });
      return user.logIn(options);
   },

    /**
     * Logs out the currently logged in user session. This will remove the
     * session from disk, log out of linked services, and future calls to
     * <code>current</code> will return <code>null</code>.
     */
    logOut: function() {
      if (ML.User._currentUser !== null) {
        ML.User._currentUser._logOutWithAll();
        ML.User._currentUser._isCurrentUser = false;
      }
      ML.User._currentUserMatchesDisk = true;
      ML.User._currentUser = null;
      ML.localStorage.removeItem(
          ML._getMLPath(ML.User._CURRENT_USER_KEY));
    },

    /**
     *Create a follower query for special user to query the user's followers.
     * @param userObjectId {String} The user object id.
     * @since 0.3.0
     */
    followerQuery: function(userObjectId) {
        if(!userObjectId || !_.isString(userObjectId)) {
          throw "Invalid user object id.";
        }
        var query = new ML.FriendShipQuery('_Follower');
        query._friendshipTag ='follower';
        query.equalTo('user', ML.Object.createWithoutData('_User', userObjectId));
        return query;
    },

    /**
     *Create a followee query for special user to query the user's followees.
     * @param userObjectId {String} The user object id.
     * @since 0.3.0
     */
    followeeQuery: function(userObjectId) {
        if(!userObjectId || !_.isString(userObjectId)) {
          throw "Invalid user object id.";
        }
        var query = new ML.FriendShipQuery('_Followee');
        query._friendshipTag ='followee';
        query.equalTo('user', ML.Object.createWithoutData('_User', userObjectId));
        return query;
    },

    /**
     * Requests a password reset email to be sent to the specified email address
     * associated with the user account. This email allows the user to securely
     * reset their password on the ML site.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} email The email address associated with the user that
     *     forgot their password.
     * @param {Object} options A Backbone-style options object.
     */
    requestPasswordReset: function(email, options) {
      var json = { email: email };
      var request = ML._request("requestPasswordReset", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Requests a verify email to be sent to the specified email address
     * associated with the user account. This email allows the user to securely
     * verify their email address on the ML site.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} email The email address associated with the user that
     *     doesn't verify their email address.
     * @param {Object} options A Backbone-style options object.
     */
    requestEmailVerify: function(email, options) {
      var json = { email: email };
      var request = ML._request("requestEmailVerify", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

   /**
    * @Deprecated typo error, please use requestEmailVerify
    */
    requestEmailVerfiy: function(email, options) {
      var json = { email: email };
      var request = ML._request("requestEmailVerify", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Requests a verify sms code to be sent to the specified mobile phone
     * number associated with the user account. This sms code allows the user to
     * verify their mobile phone number by calling ML.User.verifyMobilePhone
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The mobile phone number  associated with the
     *                  user that doesn't verify their mobile phone number.
     * @param {Object} options A Backbone-style options object.
     */
    requestMobilePhoneVerify: function(mobilePhone, options){
      var json = { mobilePhoneNumber: mobilePhone };
      var request = ML._request("requestMobilePhoneVerify", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },


    /**
     * Requests a reset password sms code to be sent to the specified mobile phone
     * number associated with the user account. This sms code allows the user to
     * reset their account's password by calling ML.User.resetPasswordBySmsCode
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The mobile phone number  associated with the
     *                  user that doesn't verify their mobile phone number.
     * @param {Object} options A Backbone-style options object.
     */
    requestPasswordResetBySmsCode: function(mobilePhone, options){
      var json = { mobilePhoneNumber: mobilePhone };
      var request = ML._request("requestPasswordResetBySmsCode", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Makes a call to reset user's account password by sms code and new password.
    * The sms code is sent by ML.User.requestPasswordResetBySmsCode.
     * @param {String} code The sms code sent by ML.User.Cloud.requestSmsCode
     * @param {String} password The new password.
     * @param {Object} options A Backbone-style options object
     * @return {ML.Promise} A promise that will be resolved with the result
     * of the function.
     */
    resetPasswordBySmsCode: function(code, password, options){
      var json = { password: password};
      var request = ML._request("resetPasswordBySmsCode", null, code, "PUT",
                                json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Makes a call to verify sms code that sent by ML.User.Cloud.requestSmsCode
     * If verify successfully,the user mobilePhoneVerified attribute will be true.
     * @param {String} code The sms code sent by ML.User.Cloud.requestSmsCode
     * @param {Object} options A Backbone-style options object
     * @return {ML.Promise} A promise that will be resolved with the result
     * of the function.
     */
    verifyMobilePhone: function(code, options){
      var request = ML._request("verifyMobilePhone", null, code, "POST",
                                null);
      return request._thenRunCallbacks(options);
    },

    /**
     * Requests a logIn sms code to be sent to the specified mobile phone
     * number associated with the user account. This sms code allows the user to
     * login by ML.User.logInWithMobilePhoneSmsCode function.
     *
     * <p>Calls options.success or options.error on completion.</p>
     *
     * @param {String} mobilePhone The mobile phone number  associated with the
     *           user that want to login by ML.User.logInWithMobilePhoneSmsCode
     * @param {Object} options A Backbone-style options object.
     */
    requestLoginSmsCode: function(mobilePhone, options){
      var json = { mobilePhoneNumber: mobilePhone };
      var request = ML._request("requestLoginSmsCode", null, null, "POST",
                                   json);
      return request._thenRunCallbacks(options);
    },

    /**
     * Retrieves the currently logged in MLUser with a valid session,
     * either from memory or localStorage, if necessary.
     * @return {ML.Object} The currently logged in ML.User.
     */
    current: function() {
      if (ML.User._currentUser) {
        return ML.User._currentUser;
      }

      if (ML.User._currentUserMatchesDisk) {

        return ML.User._currentUser;
      }

      // Load the user from local storage.
      ML.User._currentUserMatchesDisk = true;

      var userData = ML.localStorage.getItem(ML._getMLPath(
          ML.User._CURRENT_USER_KEY));
      if (!userData) {

        return null;
      }
      ML.User._currentUser = ML.Object._create("_User");
      ML.User._currentUser._isCurrentUser = true;

      var json = JSON.parse(userData);
      ML.User._currentUser.id = json._id;
      delete json._id;
      ML.User._currentUser._sessionToken = json._sessionToken;
      delete json._sessionToken;
      ML.User._currentUser._finishFetch(json);
      //ML.User._currentUser.set(json);

      ML.User._currentUser._synchronizeAllAuthData();
      ML.User._currentUser._refreshCache();
      ML.User._currentUser._opSetQueue = [{}];
      return ML.User._currentUser;
    },

    /**
     * Persists a user as currentUser to localStorage, and into the singleton.
     */
    _saveCurrentUser: function(user) {
      if (ML.User._currentUser !== user) {
        ML.User.logOut();
      }
      user._isCurrentUser = true;
      ML.User._currentUser = user;
      ML.User._currentUserMatchesDisk = true;

      var json = user.toJSON();
      json._id = user.id;
      json._sessionToken = user._sessionToken;
      ML.localStorage.setItem(
          ML._getMLPath(ML.User._CURRENT_USER_KEY),
          JSON.stringify(json));
    },

    _registerAuthenticationProvider: function(provider) {
      ML.User._authProviders[provider.getAuthType()] = provider;
      // Synchronize the current user with the auth provider.
      if (ML.User.current()) {
        ML.User.current()._synchronizeAuthData(provider.getAuthType());
      }
    },

    _logInWith: function(provider, options) {
      var user = ML.Object._create("_User");
      return user._linkWith(provider, options);
    }

  });
};

},{"underscore":22}],15:[function(require,module,exports){
(function (process){
'use strict';

var _ = require('underscore');

/*global _: false, $: false, localStorage: false, process: true,
 XMLHttpRequest: false, XDomainRequest: false, exports: false,
 require: false */
module.exports = function (ML) {
  /**
   * Contains all ML API classes and functions.
   * @name ML
   * @namespace
   *
   * Contains all ML API classes and functions.
   */

  // If jQuery or Zepto has been included, grab a reference to it.
  if (typeof($) !== "undefined") {
    ML.$ = $;
  }

  // Helpers
  // -------

  // Shared empty constructor function to aid in prototype-chain creation.
  var EmptyConstructor = function () {
  };


  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var inherits = function (parent, protoProps, staticProps) {
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
      child = protoProps.constructor;
    } else {
      /** @ignore */
      child = function () {
        parent.apply(this, arguments);
      };
    }

    // Inherit class (static) properties from parent.
    ML._.extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    EmptyConstructor.prototype = parent.prototype;
    child.prototype = new EmptyConstructor();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) {
      ML._.extend(child.prototype, protoProps);
    }

    // Add static properties to the constructor function, if supplied.
    if (staticProps) {
      ML._.extend(child, staticProps);
    }

    // Correctly set child's `prototype.constructor`.
    child.prototype.constructor = child;

    // Set a convenience property in case the parent's prototype is
    // needed later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Check whether we are running in Node.js.
  if (typeof(process) !== "undefined" &&
    process.versions &&
    process.versions.node) {
    ML._isNode = true;
  }

  /**
   * Call this method first to set up your authentication tokens for ML.
   * You can get your keys from the Data Browser on maxleap.com.
   * @param {String} applicationId Your ML Application ID.
   * @param {String} applicationKey Your ML JavaScript Key.
   * @param {String} masterKey (optional) Your LeapCloud Master Key. (Node.js only!).
   */
  ML.initialize = function (applicationId, applicationKey, masterKey) {
    if (masterKey) {
      throw new Error("ML.initialize() was passed a Master Key, which is only " +
        "allowed from within Node.js.");
    }
    ML._initialize(applicationId, applicationKey, masterKey);
  };

  /**
   * Call this method first to set up authentication tokens for ML.
   * This method is for ML's own private use.
   * @param {String} applicationId Your ML Application ID.
   * @param {String} applicationKey Your ML Application Key
   */
  ML._initialize = function (applicationId, applicationKey, masterKey) {
    if (ML.applicationId !== undefined &&
      applicationId !== ML.applicationId &&
      applicationKey !== ML.applicationKey &&
      masterKey !== ML.masterKey) {
      console.warn('LeapCloud SDK is already initialized, please don\'t reinitialize it.');
    }
    ML.applicationId = applicationId;
    ML.applicationKey = applicationKey;
    ML.masterKey = masterKey;
    ML._useMasterKey = false;
  };


  /**
   * Call this method to set production environment variable.
   * @param {Boolean} production True is production environment,and
   *  it's true by default.
   */
  ML.setProduction = function (production) {
    if (!ML._isNullOrUndefined(production)) {
      //make sure it's a number
      production = production ? 1 : 0;
    }
    //default is 1
    ML.applicationProduction = ML._isNullOrUndefined(production) ? 1 : production;
  };

  // If we're running in node.js, allow using the master key.
  if (ML._isNode) {
    ML.initialize = ML._initialize;

    ML.Cloud = ML.Cloud || {};
    /**
     * Switches the LeapCloud SDK to using the Master key.  The Master key grants
     * priveleged access to the data in LeapCloud and can be used to bypass ACLs and
     * other restrictions that are applied to the client SDKs.
     * <p><strong><em>Available in Cloud Code and Node.js only.</em></strong>
     * </p>
     */
    ML.Cloud.useMasterKey = function () {
      ML._useMasterKey = true;
    };
  }


  /**
   *Use china maxleap API service:https://maxleap.cn
   */
  ML.useLeapCloudCN = function () {
    ML.serverURL = "https://maxleap.cn";
  };

  /**
   *Use USA maxleap API service:https://maxleap.com
   */
  ML.useLeapCloudUS = function () {
    ML.serverURL = "https://maxleap.com";
  };

  /**
   * Returns prefix for localStorage keys used by this instance of ML.
   * @param {String} path The relative suffix to append to it.
   *     null or undefined is treated as the empty string.
   * @return {String} The full key name.
   */
  ML._getMLPath = function (path) {
    if (!ML.applicationId) {
      throw "You need to call ML.initialize before using ML.";
    }
    if (!path) {
      path = "";
    }
    if (!ML._.isString(path)) {
      throw "Tried to get a localStorage path that wasn't a String.";
    }
    if (path[0] === "/") {
      path = path.substring(1);
    }
    return "ML/" + ML.applicationId + "/" + path;
  };

  /**
   * Returns the unique string for this app on this machine.
   * Gets reset when localStorage is cleared.
   */
  ML._installationId = null;
  ML._getInstallationId = function () {
    // See if it's cached in RAM.
    if (ML._installationId) {
      return ML._installationId;
    }

    // Try to get it from localStorage.
    var path = ML._getMLPath("installationId");
    ML._installationId = ML.localStorage.getItem(path);

    if (!ML._installationId || ML._installationId === "") {
      // It wasn't in localStorage, so create a new one.
      var hexOctet = function () {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      };
      ML._installationId = (
      hexOctet() + hexOctet() + "-" +
      hexOctet() + "-" +
      hexOctet() + "-" +
      hexOctet() + "-" +
      hexOctet() + hexOctet() + hexOctet());
      ML.localStorage.setItem(path, ML._installationId);
    }

    return ML._installationId;
  };

  ML._parseDate = function (iso8601) {
    var regexp = new RegExp(
      "^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})" + "T" +
      "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})" +
      "(.([0-9]+))?" + "Z$");
    var match = regexp.exec(iso8601);
    if (!match) {
      return null;
    }

    var year = match[1] || 0;
    var month = (match[2] || 1) - 1;
    var day = match[3] || 0;
    var hour = match[4] || 0;
    var minute = match[5] || 0;
    var second = match[6] || 0;
    var milli = match[8] || 0;

    return new Date(Date.UTC(year, month, day, hour, minute, second, milli));
  };

  ML._ajaxIE8 = function (method, url, data) {
    var promise = new ML.Promise();
    var xdr = new XDomainRequest();
    xdr.onload = function () {
      var response;
      try {
        response = JSON.parse(xdr.responseText);
      } catch (e) {
        promise.reject(e);
      }
      if (response) {
        promise.resolve(response);
      }
    };
    xdr.onerror = xdr.ontimeout = function () {
      // Let's fake a real error message.
      var fakeResponse = {
        responseText: JSON.stringify({
          code: ML.Error.X_DOMAIN_REQUEST,
          error: "IE's XDomainRequest does not supply error info."
        })
      };
      promise.reject(xdr);
    };
    xdr.onprogress = function () {
    };
    xdr.open(method, url);
    xdr.send(data);
    return promise;
  };

  ML._useXDomainRequest = function () {
    if (typeof(XDomainRequest) !== "undefined") {
      // We're in IE 8+.
      if ('withCredentials' in new XMLHttpRequest()) {
        // We're in IE 10+.
        return false;
      }
      return true;
    }
    return false;
  };

  ML._ajax = function (method, url, data, success, error, headers) {
    var options = {
      success: success,
      error: error
    };

    if (ML._useXDomainRequest()) {
      return ML._ajaxIE8(method, url, data)._thenRunCallbacks(options);
    }

    var promise = new ML.Promise();
    var handled = false;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (handled) {
          return;
        }
        handled = true;

        if (xhr.status >= 200 && xhr.status < 300) {
          var response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            //对于一些请求(如delete files)，服务器不返回response，只能通过xhr.status判断请求结果
            promise.resolve(xhr.status);
          }
          if(xhr.status !== 204){ //204是文件删除接口的状态返回码
            if (response && !response.errorCode) {
              promise.resolve(response, xhr.status, xhr);
            }else{
              promise.reject(xhr);
            }
          }

        } else {
          promise.reject(xhr);
        }
      }
    };
    xhr.open(method, url, true);
    if(!url.match('analytics/at')){
      xhr.setRequestHeader("X-ML-AppId", ML.applicationId);
      xhr.setRequestHeader("X-ML-APIKey", ML.applicationKey);
    }
    
    for (var key in headers) {
      xhr.setRequestHeader(key, headers[key]);
    }

    //xhr.setRequestHeader("X-LAS-Fid", "zcf-7dd01734-8272-40de-89e7-dbb199f04bf9.txt");

    if (ML._isNode) {
      // Add a special user agent just for request from node.js.
      xhr.setRequestHeader("User-Agent",
        "ML/" + ML.VERSION +
        " (NodeJS " + process.versions.node + ")");
    }
    xhr.send(data);
    return promise._thenRunCallbacks(options);
  };

  // A self-propagating extend function.
  ML._extend = function (protoProps, classProps) {
    var child = inherits(this, protoProps, classProps);
    child.extend = this.extend;
    return child;
  };

  /**
   * route is classes, users, login, etc.
   * objectId is null if there is no associated objectId.
   * method is the http method for the REST API.
   * dataObject is the payload as an object, or null if there is none.
   * headers is extra http headers.
   * @ignore
   */
  ML._request = function (route, className, objectId, method, dataObject, headers) {
    if (!ML.applicationId) {
      throw "You must specify your applicationId using ML.initialize";
    }

    if (!ML.applicationKey && !ML.masterKey) {
      throw "You must specify a key using ML.initialize";
    }


    if (route !== "batch" &&
      route !== "classes" &&
      route !== "files" &&
      route !== "functions" &&
      route !== "login" &&
      route !== "marketing/push/msg" &&
      route !== "search/select" &&
      route !== "requestPasswordReset" &&
      route !== "requestEmailVerify" &&
      route !== "requestPasswordResetBySmsCode" &&
      route !== "resetPasswordBySmsCode" &&
      route !== "requestMobilePhoneVerify" &&
      route !== "requestLoginSmsCode" &&
      route !== "verifyMobilePhone" &&
      route !== "requestSmsCode" &&
      route !== "verifySmsCode" &&
      route !== "users" &&
      route !== 'updatePassword' &&
      route !== "usersByMobilePhone" &&
      route !== "cloudQuery" &&
      route !== "statuses" &&
      route !== "bigquery" &&
      route !== 'search/select' &&
      route !== 'subscribe/statuses/count' &&
      route !== 'subscribe/statuses' && !(/users\/[^\/]+\/updatePassword/.test(route)) && !(/users\/[^\/]+\/friendship\/[^\/]+/.test(route))) {
      throw "Bad route: '" + route + "'.";
    }



    var url = ML.serverURL;
    if (url.charAt(url.length - 1) !== "/") {
      url += "/";
    }
    url += "2.0/" + route;
    if (className) {
      url += "/" + className;
    }
    if (objectId) {
      url += "/" + objectId;
    }
    if ((route === 'users' || route === 'classes') && dataObject && dataObject._fetchWhenSave) {
      delete dataObject._fetchWhenSave;
      url += '?new=true';
    }

    headers = headers || {};
    var data = dataObject;
    var currentUser = ML.User.current();
    if (currentUser && currentUser._sessionToken) {
      headers['X-ML-Session-Token'] = currentUser._sessionToken;
    }

    if(!(data instanceof File)){
      dataObject = ML._.clone(dataObject || {});
      if (method !== "POST") {
        dataObject._method = method;
      }

      dataObject._ApplicationId = ML.applicationId;
      dataObject._ApplicationKey = ML.applicationKey;
      if (!ML._isNullOrUndefined(ML.applicationProduction)) {
        dataObject._ApplicationProduction = ML.applicationProduction;
      }
      if (ML._useMasterKey)
        dataObject._MasterKey = ML.masterKey;
      dataObject._ClientVersion = ML.VERSION;
      dataObject._InstallationId = ML._getInstallationId();
      // Pass the session token on every request.
      var currentUser = ML.User.current();
      if (currentUser && currentUser._sessionToken) {
        dataObject._SessionToken = currentUser._sessionToken;
      }
      data = JSON.stringify(dataObject);


      //files服务器不接受Content-Type跨域头
      if (route !== 'files') {
        headers['Content-Type'] = 'application/json';
      }
    }
    return ML._ajax(method, url, data, null, null, headers).then(null, function (response) {
      // Transform the error into an instance of ML.Error by trying to parse
      // the error string as JSON.
      var error;
      if (response && response.responseText) {
        try {
          var errorJSON = JSON.parse(response.responseText);
          if (errorJSON) {
            error = new ML.Error(errorJSON.errorCode, errorJSON.errorMessage);
          }
        } catch (e) {
          // If we fail to parse the error text, that's okay.
        }
      }
      error = error || new ML.Error(-1, response.responseText);
      // By explicitly returning a rejected Promise, this will work with
      // either jQuery or Promises/A semantics.
      return ML.Promise.error(error);
    });
  };

  // Helper function to get a value from a Backbone object as a property
  // or as a function.
  ML._getValue = function (object, prop) {
    if (!(object && object[prop])) {
      return null;
    }
    return ML._.isFunction(object[prop]) ? object[prop]() : object[prop];
  };

  /**
   * Converts a value in a ML Object into the appropriate representation.
   * This is the JS equivalent of Java's ML.maybeReferenceAndEncode(Object)
   * if seenObjects is falsey. Otherwise any ML.Objects not in
   * seenObjects will be fully embedded rather than encoded
   * as a pointer.  This array will be used to prevent going into an infinite
   * loop because we have circular references.  If <seenObjects>
   * is set, then none of the ML Objects that are serialized can be dirty.
   */
  ML._encode = function (value, seenObjects, disallowObjects) {
    var _ = ML._;
    if (value instanceof ML.Object) {
      if (disallowObjects) {
        throw "ML.Objects not allowed here";
      }
      if (!seenObjects || _.include(seenObjects, value) || !value._hasData) {
        return value._toPointer();
      }
      if (!value.dirty()) {
        seenObjects = seenObjects.concat(value);
        return ML._encode(value._toFullJSON(seenObjects),
          seenObjects,
          disallowObjects);
      }
      throw "Tried to save an object with a pointer to a new, unsaved object.";
    }
    if (_.isDate(value)) {
      return {"__type": "Date", "iso": value.toJSON()};
    }
    if (value instanceof ML.GeoPoint) {
      return value.toJSON();
    }
    if (_.isArray(value)) {
      return _.map(value, function (x) {
        return ML._encode(x, seenObjects, disallowObjects);
      });
    }
    if (_.isRegExp(value)) {
      return value.source;
    }
    if (value instanceof ML.Relation) {
      return value.toJSON();
    }
    if (value instanceof ML.Op) {
      return value.toJSON();
    }
    if (value instanceof ML.File) {
      if (!value.url() && !value.id) {
        throw "Tried to save an object containing an unsaved file.";
      }
      return {
        __type: "File",
        id: value.id,
        name: value.name(),
        url: value.url()
      };
    }
    if (_.isObject(value)) {
      var output = {};
      ML._objectEach(value, function (v, k) {
        output[k] = ML._encode(v, seenObjects, disallowObjects);
      });
      return output;
    }
    return value;
  };

  /**
   * The inverse function of ML._encode.
   * TODO: make decode not mutate value.
   */
  ML._decode = function (key, value) {
    var _ = ML._;
    if (!_.isObject(value)) {
      return value;
    }
    if (_.isArray(value)) {
      ML._arrayEach(value, function (v, k) {
        value[k] = ML._decode(k, v);
      });
      return value;
    }
    if (value instanceof ML.Object) {
      return value;
    }
    if (value instanceof ML.File) {
      return value;
    }
    if (value instanceof ML.Op) {
      return value;
    }
    if (value.__op) {
      return ML.Op._decode(value);
    }
    if (value.__type === "Pointer") {
      var className = value.className;
      var pointer = ML.Object._create(className);
      if (value.createdAt) {
        delete value.__type;
        delete value.className;
        pointer._finishFetch(value, true);
      } else {
        pointer._finishFetch({objectId: value.objectId}, false);
      }
      return pointer;
    }
    if (value.__type === "Object") {
      // It's an Object included in a query result.
      var className = value.className;
      delete value.__type;
      delete value.className;
      var object = ML.Object._create(className);
      object._finishFetch(value, true);
      return object;
    }
    if (value.__type === "Date") {
      return ML._parseDate(value.iso);
    }
    if (value.__type === "GeoPoint") {
      return new ML.GeoPoint({
        latitude: value.latitude,
        longitude: value.longitude
      });
    }
    if (value.__type === "Relation") {
      var relation = new ML.Relation(null, key);
      relation.targetClassName = value.className;
      return relation;
    }
    if (value.__type === "File") {
      var file = new ML.File(value.name);
      file._metaData = value.metaData || {};
      file._url = value.url;
      file.id = value.objectId;
      return file;
    }
    ML._objectEach(value, function (v, k) {
      value[k] = ML._decode(k, v);
    });
    return value;
  };

  ML._arrayEach = ML._.each;

  /**
   * Does a deep traversal of every item in object, calling func on every one.
   * @param {Object} object The object or array to traverse deeply.
   * @param {Function} func The function to call for every item. It will
   *     be passed the item as an argument. If it returns a truthy value, that
   *     value will replace the item in its parent container.
   * @returns {} the result of calling func on the top-level object itself.
   */
  ML._traverse = function (object, func, seen) {
    if (object instanceof ML.Object) {
      seen = seen || [];
      if (ML._.indexOf(seen, object) >= 0) {
        // We've already visited this object in this call.
        return;
      }
      seen.push(object);
      ML._traverse(object.attributes, func, seen);
      return func(object);
    }
    if (object instanceof ML.Relation || object instanceof ML.File) {
      // Nothing needs to be done, but we don't want to recurse into the
      // object's parent infinitely, so we catch this case.
      return func(object);
    }
    if (ML._.isArray(object)) {
      ML._.each(object, function (child, index) {
        var newChild = ML._traverse(child, func, seen);
        if (newChild) {
          object[index] = newChild;
        }
      });
      return func(object);
    }
    if (ML._.isObject(object)) {
      ML._each(object, function (child, key) {
        var newChild = ML._traverse(child, func, seen);
        if (newChild) {
          object[key] = newChild;
        }
      });
      return func(object);
    }
    return func(object);
  };

  /**
   * This is like _.each, except:
   * * it doesn't work for so-called array-like objects,
   * * it does work for dictionaries with a "length" attribute.
   */
  ML._objectEach = ML._each = function (obj, callback) {
    var _ = ML._;
    if (_.isObject(obj)) {
      _.each(_.keys(obj), function (key) {
        callback(obj[key], key);
      });
    } else {
      _.each(obj, callback);
    }
  };

  // Helper function to check null or undefined.
  ML._isNullOrUndefined = function (x) {
    return ML._.isNull(x) || ML._.isUndefined(x);
  };
};

}).call(this,require("1YiZ5S"))
},{"1YiZ5S":18,"underscore":22}],16:[function(require,module,exports){
'use strict';

module.exports = "v2.0.4";

},{}],17:[function(require,module,exports){
'use strict';

var _ = require('underscore');

/*global _: false, document: false */
module.exports = function(ML) {
  /**
   * Creating a ML.View creates its initial element outside of the DOM,
   * if an existing element is not provided...
   *
   * <p>A fork of Backbone.View, provided for your convenience.  If you use this
   * class, you must also include jQuery, or another library that provides a
   * jQuery-compatible $ function.  For more information, see the
   * <a href="http://documentcloud.github.com/backbone/#View">Backbone
   * documentation</a>.</p>
   * <p><strong><em>Available in the client SDK only.</em></strong></p>
   */
  ML.View = function(options) {
    console.warn("ML.View is deprecated, please don't use it anymore.");
    this.cid = _.uniqueId('view');
    this._configure(options || {});
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var eventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.

  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes',
                     'className', 'tagName'];

  // Set up all inheritable **ML.View** properties and methods.
  _.extend(ML.View.prototype, ML.Events,
           /** @lends ML.View.prototype */ {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    /**
     * jQuery delegate for element lookup, scoped to DOM elements within the
     * current view. This should be prefered to global lookups where possible.
     */
    $: function(selector) {
      return this.$el.find(selector);
    },

    /**
     * Initialize is an empty function by default. Override it with your own
     * initialization logic.
     */
    initialize: function(){},

    /**
     * The core function that your view should override, in order
     * to populate its element (`this.el`), with the appropriate HTML. The
     * convention is for **render** to always return `this`.
     */
    render: function() {
      return this;
    },

    /**
     * Remove this view from the DOM. Note that the view isn't present in the
     * DOM by default, so calling this method may be a no-op.
     */
    remove: function() {
      this.$el.remove();
      return this;
    },

    /**
     * For small amounts of DOM Elements, where a full-blown template isn't
     * needed, use **make** to manufacture elements, one at a time.
     * <pre>
     *     var el = this.make('li', {'class': 'row'},
     *                        this.model.escape('title'));</pre>
     */
    make: function(tagName, attributes, content) {
      var el = document.createElement(tagName);
      if (attributes) {
        ML.$(el).attr(attributes);
      }
      if (content) {
        ML.$(el).html(content);
      }
      return el;
    },

    /**
     * Changes the view's element (`this.el` property), including event
     * re-delegation.
     */
    setElement: function(element, delegate) {
      this.$el = ML.$(element);
      this.el = this.$el[0];
      if (delegate !== false) {
        this.delegateEvents();
      }
      return this;
    },

    /**
     * Set callbacks.  <code>this.events</code> is a hash of
     * <pre>
     * *{"event selector": "callback"}*
     *
     *     {
     *       'mousedown .title':  'edit',
     *       'click .button':     'save'
     *       'click .open':       function(e) { ... }
     *     }
     * </pre>
     * pairs. Callbacks will be bound to the view, with `this` set properly.
     * Uses event delegation for efficiency.
     * Omitting the selector binds the event to `this.el`.
     * This only works for delegate-able events: not `focus`, `blur`, and
     * not `change`, `submit`, and `reset` in Internet Explorer.
     */
    delegateEvents: function(events) {
      events = events || ML._getValue(this, 'events');
      if (!events) {
        return;
      }
      this.undelegateEvents();
      var self = this;
      ML._objectEach(events, function(method, key) {
        if (!_.isFunction(method)) {
          method = self[events[key]];
        }
        if (!method) {
          throw new Error('Event "' + events[key] + '" does not exist');
        }
        var match = key.match(eventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, self);
        eventName += '.delegateEvents' + self.cid;
        if (selector === '') {
          self.$el.bind(eventName, method);
        } else {
          self.$el.delegate(selector, eventName, method);
        }
      });
    },

    /**
     * Clears all callbacks previously bound to the view with `delegateEvents`.
     * You usually don't need to use this, but may wish to if you have multiple
     * Backbone views attached to the same DOM element.
     */
    undelegateEvents: function() {
      this.$el.unbind('.delegateEvents' + this.cid);
    },

    /**
     * Performs the initial configuration of a View with a set of options.
     * Keys with special meaning *(model, collection, id, className)*, are
     * attached directly to the view.
     */
    _configure: function(options) {
      if (this.options) {
        options = _.extend({}, this.options, options);
      }
      var self = this;
      _.each(viewOptions, function(attr) {
        if (options[attr]) {
          self[attr] = options[attr];
        }
      });
      this.options = options;
    },

    /**
     * Ensure that the View has a DOM element to render into.
     * If `this.el` is a string, pass it through `$()`, take the first
     * matching element, and re-assign it to `el`. Otherwise, create
     * an element from the `id`, `className` and `tagName` properties.
     */
    _ensureElement: function() {
      if (!this.el) {
        var attrs = ML._getValue(this, 'attributes') || {};
        if (this.id) {
          attrs.id = this.id;
        }
        if (this.className) {
          attrs['class'] = this.className;
        }
        this.setElement(this.make(this.tagName, attrs), false);
      } else {
        this.setElement(this.el, false);
      }
    }

  });

  /**
   * @function
   * @param {Object} instanceProps Instance properties for the view.
   * @param {Object} classProps Class properies for the view.
   * @return {Class} A new subclass of <code>ML.View</code>.
   */
  ML.View.extend = ML._extend;

};

},{"underscore":22}],18:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],19:[function(require,module,exports){
(function (global){
// http://www.rajdeepd.com/articles/chrome/localstrg/LocalStorageSample.htm

// NOTE:
// this varies from actual localStorage in some subtle ways

// also, there is no persistence
// TODO persist
(function () {
  "use strict";

  var db;

  function LocalStorage() {
  }
  db = LocalStorage;

  db.prototype.getItem = function (key) {
    if (this.hasOwnProperty(key)) {
      return String(this[key]);
    }
    return null;
  };

  db.prototype.setItem = function (key, val) {
    this[key] = String(val);
  };

  db.prototype.removeItem = function (key) {
    delete this[key];
  };

  db.prototype.clear = function () {
    var self = this;
    Object.keys(self).forEach(function (key) {
      self[key] = undefined;
      delete self[key];
    });
  };

  db.prototype.key = function (i) {
    i = i || 0;
    return Object.keys(this)[i];
  };

  db.prototype.__defineGetter__('length', function () {
    return Object.keys(this).length;
  });

  if (global.localStorage) {
    module.exports = localStorage;
  } else {
    module.exports = new LocalStorage();
  }
}());

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
 

  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

},{}],21:[function(require,module,exports){
/*!
 * tiny-cookie - A tiny cookie manipulation plugin
 * https://github.com/Alex1990/tiny-cookie
 * Under the MIT license | (c) Alex Chao
 */

!(function(root, factory) {

  // Uses CommonJS, AMD or browser global to create a jQuery plugin.
  // See: https://github.com/umdjs/umd
  if (typeof define === 'function' && define.amd) {
    // Expose this plugin as an AMD module. Register an anonymous module.
    define(factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS module
    module.exports = factory();
  } else {
    // Browser globals 
    root.Cookie = factory();
  }

}(this, function() {

  'use strict';

  // The public function which can get/set/remove cookie.
  function Cookie(key, value, opts) {
    if (value === void 0) {
      return Cookie.get(key);
    } else if (value === null) {
      Cookie.remove(key);
    } else {
      Cookie.set(key, value, opts);
    }
  }

  // Check if the cookie is enabled.
  Cookie.enabled = function() {
    var key = '__test_key';
    var enabled;

    document.cookie = key + '=1';
    enabled = !!document.cookie;

    if (enabled) Cookie.remove(key);

    return enabled;
  };

  // Get the cookie value by the key.
  Cookie.get = function(key, raw) {
    if (typeof key !== 'string' || !key) return null;

    key = '(?:^|; )' + escapeRe(key) + '(?:=([^;]*?))?(?:;|$)';

    var reKey = new RegExp(key);
    var res = reKey.exec(document.cookie);

    return res !== null ? (raw ? res[1] : decodeURIComponent(res[1])) : null;
  };

  // Get the cookie's value without decoding.
  Cookie.getRaw = function(key) {
    return Cookie.get(key, true);
  };

  // Set a cookie.
  Cookie.set = function(key, value, raw, opts) {
    if (raw !== true) {
      opts = raw;
      raw = false;
    }
    opts = opts ? convert(opts) : convert({});
    var cookie = key + '=' + (raw ? value : encodeURIComponent(value)) + opts;
    document.cookie = cookie;
  };

  // Set a cookie without encoding the value.
  Cookie.setRaw = function(key, value, opts) {
    Cookie.set(key, value, true, opts);
  };

  // Remove a cookie by the specified key.
  Cookie.remove = function(key) {
    Cookie.set(key, 'a', { expires: new Date() });
  };

  // Helper function
  // ---------------

  // Escape special characters.
  function escapeRe(str) {
    return str.replace(/[.*+?^$|[\](){}\\-]/g, '\\$&');
  }

  // Convert an object to a cookie option string.
  function convert(opts) {
    var res = '';

    for (var p in opts) {
      if (opts.hasOwnProperty(p)) {

        if (p === 'expires') {
          var expires = opts[p];
          if (typeof expires !== 'object') {
            expires += typeof expires === 'number' ? 'D' : '';
            expires = computeExpires(expires);
          }
          opts[p] = expires.toUTCString();
        }

        res += ';' + p + '=' + opts[p];
      }
    }

    if (!opts.hasOwnProperty('path')) {
      res += ';path=/';
    }

    return res;
  }

  // Return a future date by the given string.
  function computeExpires(str) {
    var expires = new Date();
    var lastCh = str.charAt(str.length - 1);
    var value = parseInt(str, 10);

    switch (lastCh) {
      case 'Y': expires.setFullYear(expires.getFullYear() + value); break;
      case 'M': expires.setMonth(expires.getMonth() + value); break;
      case 'D': expires.setDate(expires.getDate() + value); break;
      case 'h': expires.setHours(expires.getHours() + value); break;
      case 'm': expires.setMinutes(expires.getMinutes() + value); break;
      case 's': expires.setSeconds(expires.getSeconds() + value); break;
      default: expires = new Date(str);
    }

    return expires;
  }

  return Cookie;

}));

},{}],22:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],23:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NA_VERSION = "-1";
var NA = {
  name: "na",
  version: NA_VERSION
};

function typeOf(type) {
  return function (object) {
    return Object.prototype.toString.call(object) === "[object " + type + "]";
  };
}
var isString = typeOf("String");
var isRegExp = typeOf("RegExp");
var isObject = typeOf("Object");
var isFunction = typeOf("Function");

function each(object, factory) {
  for (var i = 0, l = object.length; i < l; i++) {
    if (factory.call(object, object[i], i) === false) {
      break;
    }
  }
}

// UserAgent Detector.
// @param {String} ua, userAgent.
// @param {Object} expression
// @return {Object}
//    返回 null 表示当前表达式未匹配成功。
function detect(name, expression, ua) {
  var expr = isFunction(expression) ? expression.call(null, ua) : expression;
  if (!expr) {
    return null;
  }
  var info = {
    name: name,
    version: NA_VERSION,
    codename: ""
  };
  if (expr === true) {
    return info;
  } else if (isString(expr)) {
    if (ua.indexOf(expr) !== -1) {
      return info;
    }
  } else if (isObject(expr)) {
    if (expr.hasOwnProperty("version")) {
      info.version = expr.version;
    }
    return info;
  } else if (isRegExp(expr)) {
    var m = expr.exec(ua);
    if (m) {
      if (m.length >= 2 && m[1]) {
        info.version = m[1].replace(/_/g, ".");
      } else {
        info.version = NA_VERSION;
      }
      return info;
    }
  }
}

// 初始化识别。
function init(ua, patterns, factory, detector) {
  var detected = NA;
  each(patterns, function (pattern) {
    var d = detect(pattern[0], pattern[1], ua);
    if (d) {
      detected = d;
      return false;
    }
  });
  factory.call(detector, detected.name, detected.version);
}

var Detector = function () {
  function Detector(rules) {
    _classCallCheck(this, Detector);

    this._rules = rules;
  }

  // 解析 UserAgent 字符串
  // @param {String} ua, userAgent string.
  // @return {Object}


  _createClass(Detector, [{
    key: "parse",
    value: function parse(ua) {
      ua = (ua || "").toLowerCase();
      var d = {};

      init(ua, this._rules.device, function (name, version) {
        var v = parseFloat(version);
        d.device = {
          name: name,
          version: v,
          fullVersion: version
        };
        d.device[name] = v;
      }, d);

      init(ua, this._rules.os, function (name, version) {
        var v = parseFloat(version);
        d.os = {
          name: name,
          version: v,
          fullVersion: version
        };
        d.os[name] = v;
      }, d);

      var ieCore = this.IEMode(ua);

      init(ua, this._rules.engine, function (name, version) {
        var mode = version;
        // IE 内核的浏览器，修复版本号及兼容模式。
        if (ieCore) {
          version = ieCore.engineVersion || ieCore.engineMode;
          mode = ieCore.engineMode;
        }
        var v = parseFloat(version);
        d.engine = {
          name: name,
          version: v,
          fullVersion: version,
          mode: parseFloat(mode),
          fullMode: mode,
          compatible: ieCore ? ieCore.compatible : false
        };
        d.engine[name] = v;
      }, d);

      init(ua, this._rules.browser, function (name, version) {
        var mode = version;
        // IE 内核的浏览器，修复浏览器版本及兼容模式。
        if (ieCore) {
          // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
          if (name === "ie") {
            version = ieCore.browserVersion;
          }
          mode = ieCore.browserMode;
        }
        var v = parseFloat(version);
        d.browser = {
          name: name,
          version: v,
          fullVersion: version,
          mode: parseFloat(mode),
          fullMode: mode,
          compatible: ieCore ? ieCore.compatible : false
        };
        d.browser[name] = v;
      }, d);
      return d;
    }

    // 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
    // @param {String} ua, userAgent string.
    // @return {Object}

  }, {
    key: "IEMode",
    value: function IEMode(ua) {
      if (!this._rules.re_msie.test(ua)) {
        return null;
      }

      var m = void 0;
      var engineMode = void 0;
      var engineVersion = void 0;
      var browserMode = void 0;
      var browserVersion = void 0;

      // IE8 及其以上提供有 Trident 信息，
      // 默认的兼容模式，UA 中 Trident 版本不发生变化。
      if (ua.indexOf("trident/") !== -1) {
        m = /\btrident\/([0-9.]+)/.exec(ua);
        if (m && m.length >= 2) {
          // 真实引擎版本。
          engineVersion = m[1];
          var v_version = m[1].split(".");
          v_version[0] = parseInt(v_version[0], 10) + 4;
          browserVersion = v_version.join(".");
        }
      }

      m = this._rules.re_msie.exec(ua);
      browserMode = m[1];
      var v_mode = m[1].split(".");
      if (typeof browserVersion === "undefined") {
        browserVersion = browserMode;
      }
      v_mode[0] = parseInt(v_mode[0], 10) - 4;
      engineMode = v_mode.join(".");
      if (typeof engineVersion === "undefined") {
        engineVersion = engineMode;
      }

      return {
        browserVersion: browserVersion,
        browserMode: browserMode,
        engineVersion: engineVersion,
        engineMode: engineMode,
        compatible: engineVersion !== engineMode
      };
    }
  }]);

  return Detector;
}();

module.exports = Detector;
},{}],24:[function(require,module,exports){
"use strict";

require('es5-shim');

var Detector = require("./detector.js");
var WebRules = require("./web-rules.js");

var userAgent = navigator.userAgent || "";
//const platform = navigator.platform || "";
var appVersion = navigator.appVersion || "";
var vendor = navigator.vendor || "";
var ua = userAgent + " " + appVersion + " " + vendor;

var detector = new Detector(WebRules);

// 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
// @param {String} ua, userAgent string.
// @return {Object}
function IEMode(ua) {
  if (!WebRules.re_msie.test(ua)) {
    return null;
  }

  var m = void 0;
  var engineMode = void 0;
  var engineVersion = void 0;
  var browserMode = void 0;
  var browserVersion = void 0;

  // IE8 及其以上提供有 Trident 信息，
  // 默认的兼容模式，UA 中 Trident 版本不发生变化。
  if (ua.indexOf("trident/") !== -1) {
    m = /\btrident\/([0-9.]+)/.exec(ua);
    if (m && m.length >= 2) {
      // 真实引擎版本。
      engineVersion = m[1];
      var v_version = m[1].split(".");
      v_version[0] = parseInt(v_version[0], 10) + 4;
      browserVersion = v_version.join(".");
    }
  }

  m = WebRules.re_msie.exec(ua);
  browserMode = m[1];
  var v_mode = m[1].split(".");
  if (typeof browserVersion === "undefined") {
    browserVersion = browserMode;
  }
  v_mode[0] = parseInt(v_mode[0], 10) - 4;
  engineMode = v_mode.join(".");
  if (typeof engineVersion === "undefined") {
    engineVersion = engineMode;
  }

  return {
    browserVersion: browserVersion,
    browserMode: browserMode,
    engineVersion: engineVersion,
    engineMode: engineMode,
    compatible: engineVersion !== engineMode
  };
}

function WebParse(ua) {
  var d = detector.parse(ua);

  var ieCore = IEMode(ua);

  // IE 内核的浏览器，修复版本号及兼容模式。
  if (ieCore) {
    var engineName = d.engine.name;
    var engineVersion = ieCore.engineVersion || ieCore.engineMode;
    var ve = parseFloat(engineVersion);
    var engineMode = ieCore.engineMode;

    d.engine = {
      name: engineName,
      version: ve,
      fullVersion: engineVersion,
      mode: parseFloat(engineMode),
      fullMode: engineMode,
      compatible: ieCore ? ieCore.compatible : false
    };
    d.engine[d.engine.name] = ve;

    var browserName = d.browser.name;
    // IE 内核的浏览器，修复浏览器版本及兼容模式。
    // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
    var browserVersion = d.browser.fullVersion;
    if (browserName === "ie") {
      browserVersion = ieCore.browserVersion;
    }
    var browserMode = ieCore.browserMode;
    var vb = parseFloat(browserVersion);
    d.browser = {
      name: browserName,
      version: vb,
      fullVersion: browserVersion,
      mode: parseFloat(browserMode),
      fullMode: browserMode,
      compatible: ieCore ? ieCore.compatible : false
    };
    d.browser[browserName] = vb;
  }
  return d;
}

var Tan = WebParse(ua);
Tan.parse = WebParse;
module.exports = Tan;
},{"./detector.js":23,"./web-rules.js":25,"es5-shim":26}],25:[function(require,module,exports){
(function (global){
"use strict";

var win = typeof window === "undefined" ? global : window;
var external = win.external;
var re_msie = /\b(?:msie |ie |trident\/[0-9].*rv[ :])([0-9.]+)/;
var re_blackberry_10 = /\bbb10\b.+?\bversion\/([\d.]+)/;
var re_blackberry_6_7 = /\bblackberry\b.+\bversion\/([\d.]+)/;
var re_blackberry_4_5 = /\bblackberry\d+\/([\d.]+)/;

var NA_VERSION = "-1";

// 硬件设备信息识别表达式。
// 使用数组可以按优先级排序。
var DEVICES = [["nokia", function (ua) {
  // 不能将两个表达式合并，因为可能出现 "nokia; nokia 960"
  // 这种情况下会优先识别出 nokia/-1
  if (ua.indexOf("nokia ") !== -1) {
    return (/\bnokia ([0-9]+)?/
    );
  } else {
    return (/\bnokia([a-z0-9]+)?/
    );
  }
}],
// 三星有 Android 和 WP 设备。
["samsung", function (ua) {
  if (ua.indexOf("samsung") !== -1) {
    return (/\bsamsung(?:[ \-](?:sgh|gt|sm))?-([a-z0-9]+)/
    );
  } else {
    return (/\b(?:sgh|sch|gt|sm)-([a-z0-9]+)/
    );
  }
}], ["wp", function (ua) {
  return ua.indexOf("windows phone ") !== -1 || ua.indexOf("xblwp") !== -1 || ua.indexOf("zunewp") !== -1 || ua.indexOf("windows ce") !== -1;
}], ["pc", "windows"], ["ipad", "ipad"],
// ipod 规则应置于 iphone 之前。
["ipod", "ipod"], ["iphone", /\biphone\b|\biph(\d)/], ["mac", "macintosh"],
// 小米
["mi", /\bmi[ \-]?([a-z0-9 ]+(?= build|\)))/],
// 红米
["hongmi", /\bhm[ \-]?([a-z0-9]+)/], ["aliyun", /\baliyunos\b(?:[\-](\d+))?/], ["meizu", function (ua) {
  return ua.indexOf("meizu") >= 0 ? /\bmeizu[\/ ]([a-z0-9]+)\b/ : /\bm([0-9cx]{1,4})\b/;
}], ["nexus", /\bnexus ([0-9s.]+)/], ["huawei", function (ua) {
  var re_mediapad = /\bmediapad (.+?)(?= build\/huaweimediapad\b)/;
  if (ua.indexOf("huawei-huawei") !== -1) {
    return (/\bhuawei\-huawei\-([a-z0-9\-]+)/
    );
  } else if (re_mediapad.test(ua)) {
    return re_mediapad;
  } else {
    return (/\bhuawei[ _\-]?([a-z0-9]+)/
    );
  }
}], ["lenovo", function (ua) {
  if (ua.indexOf("lenovo-lenovo") !== -1) {
    return (/\blenovo\-lenovo[ \-]([a-z0-9]+)/
    );
  } else {
    return (/\blenovo[ \-]?([a-z0-9]+)/
    );
  }
}],
// 中兴
["zte", function (ua) {
  if (/\bzte\-[tu]/.test(ua)) {
    return (/\bzte-[tu][ _\-]?([a-su-z0-9\+]+)/
    );
  } else {
    return (/\bzte[ _\-]?([a-su-z0-9\+]+)/
    );
  }
}],
// 步步高
["vivo", /\bvivo(?: ([a-z0-9]+))?/], ["htc", function (ua) {
  if (/\bhtc[a-z0-9 _\-]+(?= build\b)/.test(ua)) {
    return (/\bhtc[ _\-]?([a-z0-9 ]+(?= build))/
    );
  } else {
    return (/\bhtc[ _\-]?([a-z0-9 ]+)/
    );
  }
}], ["oppo", /\boppo[_]([a-z0-9]+)/], ["konka", /\bkonka[_\-]([a-z0-9]+)/], ["sonyericsson", /\bmt([a-z0-9]+)/], ["coolpad", /\bcoolpad[_ ]?([a-z0-9]+)/], ["lg", /\blg[\-]([a-z0-9]+)/], ["android", /\bandroid\b|\badr\b/], ["blackberry", function (ua) {
  if (ua.indexOf("blackberry") >= 0) {
    return (/\bblackberry\s?(\d+)/
    );
  }
  return "bb10";
}]];

// 操作系统信息识别表达式
var OS = [["wp", function (ua) {
  if (ua.indexOf("windows phone ") !== -1) {
    return (/\bwindows phone (?:os )?([0-9.]+)/
    );
  } else if (ua.indexOf("xblwp") !== -1) {
    return (/\bxblwp([0-9.]+)/
    );
  } else if (ua.indexOf("zunewp") !== -1) {
    return (/\bzunewp([0-9.]+)/
    );
  }
  return "windows phone";
}], ["windows", /\bwindows nt ([0-9.]+)/], ["macosx", /\bmac os x ([0-9._]+)/], ["ios", function (ua) {
  if (/\bcpu(?: iphone)? os /.test(ua)) {
    return (/\bcpu(?: iphone)? os ([0-9._]+)/
    );
  } else if (ua.indexOf("iph os ") !== -1) {
    return (/\biph os ([0-9_]+)/
    );
  } else {
    return (/\bios\b/
    );
  }
}], ["yunos", /\baliyunos ([0-9.]+)/], ["android", function (ua) {
  if (ua.indexOf("android") >= 0) {
    return (/\bandroid[ \/-]?([0-9.x]+)?/
    );
  } else if (ua.indexOf("adr") >= 0) {
    if (ua.indexOf("mqqbrowser") >= 0) {
      return (/\badr[ ]\(linux; u; ([0-9.]+)?/
      );
    } else {
      return (/\badr(?:[ ]([0-9.]+))?/
      );
    }
  }
  return "android";
  //return /\b(?:android|\badr)(?:[\/\- ](?:\(linux; u; )?)?([0-9.x]+)?/;
}], ["chromeos", /\bcros i686 ([0-9.]+)/], ["linux", "linux"], ["windowsce", /\bwindows ce(?: ([0-9.]+))?/], ["symbian", /\bsymbian(?:os)?\/([0-9.]+)/], ["blackberry", function (ua) {
  var m = ua.match(re_blackberry_10) || ua.match(re_blackberry_6_7) || ua.match(re_blackberry_4_5);
  return m ? { version: m[1] } : "blackberry";
}]];

// 针对同源的 TheWorld 和 360 的 external 对象进行检测。
// @param {String} key, 关键字，用于检测浏览器的安装路径中出现的关键字。
// @return {Undefined,Boolean,Object} 返回 undefined 或 false 表示检测未命中。
function checkTW360External(key) {
  if (!external) {
    return;
  } // return undefined.
  try {
    //        360安装路径：
    //        C:%5CPROGRA~1%5C360%5C360se3%5C360SE.exe
    var runpath = external.twGetRunPath.toLowerCase();
    // 360SE 3.x ~ 5.x support.
    // 暴露的 external.twGetVersion 和 external.twGetSecurityID 均为 undefined。
    // 因此只能用 try/catch 而无法使用特性判断。
    var security = external.twGetSecurityID(win);
    var version = external.twGetVersion(security);

    if (runpath && runpath.indexOf(key) === -1) {
      return false;
    }
    if (version) {
      return { version: version };
    }
  } catch (ex) {/* */}
}

var ENGINE = [["edgehtml", /edge\/([0-9.]+)/], ["trident", re_msie], ["blink", function () {
  return "chrome" in win && "CSS" in win && /\bapplewebkit[\/]?([0-9.+]+)/;
}], ["webkit", /\bapplewebkit[\/]?([0-9.+]+)/], ["gecko", function (ua) {
  var match = ua.match(/\brv:([\d\w.]+).*\bgecko\/(\d+)/);
  if (match) {
    return {
      version: match[1] + "." + match[2]
    };
  }
}], ["presto", /\bpresto\/([0-9.]+)/], ["androidwebkit", /\bandroidwebkit\/([0-9.]+)/], ["coolpadwebkit", /\bcoolpadwebkit\/([0-9.]+)/], ["u2", /\bu2\/([0-9.]+)/], ["u3", /\bu3\/([0-9.]+)/]];
var BROWSER = [
// Microsoft Edge Browser, Default browser in Windows 10.
["edge", /edge\/([0-9.]+)/],
// Sogou.
["sogou", function (ua) {
  if (ua.indexOf("sogoumobilebrowser") >= 0) {
    return (/sogoumobilebrowser\/([0-9.]+)/
    );
  } else if (ua.indexOf("sogoumse") >= 0) {
    return true;
  }
  return (/ se ([0-9.x]+)/
  );
}],
// TheWorld (世界之窗)
// 由于裙带关系，TheWorld API 与 360 高度重合。
// 只能通过 UA 和程序安装路径中的应用程序名来区分。
// TheWorld 的 UA 比 360 更靠谱，所有将 TheWorld 的规则放置到 360 之前。
["theworld", function () {
  var x = checkTW360External("theworld");
  if (typeof x !== "undefined") {
    return x;
  }
  return (/theworld(?: ([\d.])+)?/
  );
}],
// 360SE, 360EE.
["360", function (ua) {
  var x = checkTW360External("360se");
  if (typeof x !== "undefined") {
    return x;
  }
  if (ua.indexOf("360 aphone browser") !== -1) {
    return (/\b360 aphone browser \(([^\)]+)\)/
    );
  }
  return (/\b360(?:se|ee|chrome|browser)\b/
  );
}],
// Maxthon
["maxthon", function () {
  try {
    if (external && (external.mxVersion || external.max_version)) {
      return {
        version: external.mxVersion || external.max_version
      };
    }
  } catch (ex) {/* */}
  return (/\b(?:maxthon|mxbrowser)(?:[ \/]([0-9.]+))?/
  );
}], ["micromessenger", /\bmicromessenger\/([\d.]+)/], ["qq", /\bm?qqbrowser\/([0-9.]+)/], ["green", "greenbrowser"], ["tt", /\btencenttraveler ([0-9.]+)/], ["liebao", function (ua) {
  if (ua.indexOf("liebaofast") >= 0) {
    return (/\bliebaofast\/([0-9.]+)/
    );
  }
  if (ua.indexOf("lbbrowser") === -1) {
    return false;
  }
  var version = void 0;
  try {
    if (external && external.LiebaoGetVersion) {
      version = external.LiebaoGetVersion();
    }
  } catch (ex) {/* */}
  return {
    version: version || NA_VERSION
  };
}], ["tao", /\btaobrowser\/([0-9.]+)/], ["coolnovo", /\bcoolnovo\/([0-9.]+)/], ["saayaa", "saayaa"],
// 有基于 Chromniun 的急速模式和基于 IE 的兼容模式。必须在 IE 的规则之前。
["baidu", /\b(?:ba?idubrowser|baiduhd)[ \/]([0-9.x]+)/],
// 后面会做修复版本号，这里只要能识别是 IE 即可。
["ie", re_msie], ["mi", /\bmiuibrowser\/([0-9.]+)/],
// Opera 15 之后开始使用 Chromniun 内核，需要放在 Chrome 的规则之前。
["opera", function (ua) {
  var re_opera_old = /\bopera.+version\/([0-9.ab]+)/;
  var re_opera_new = /\bopr\/([0-9.]+)/;
  return re_opera_old.test(ua) ? re_opera_old : re_opera_new;
}], ["oupeng", /\boupeng\/([0-9.]+)/], ["yandex", /yabrowser\/([0-9.]+)/],
// 支付宝手机客户端
["ali-ap", function (ua) {
  if (ua.indexOf("aliapp") > 0) {
    return (/\baliapp\(ap\/([0-9.]+)\)/
    );
  } else {
    return (/\balipayclient\/([0-9.]+)\b/
    );
  }
}],
// 支付宝平板客户端
["ali-ap-pd", /\baliapp\(ap-pd\/([0-9.]+)\)/],
// 支付宝商户客户端
["ali-am", /\baliapp\(am\/([0-9.]+)\)/],
// 淘宝手机客户端
["ali-tb", /\baliapp\(tb\/([0-9.]+)\)/],
// 淘宝平板客户端
["ali-tb-pd", /\baliapp\(tb-pd\/([0-9.]+)\)/],
// 天猫手机客户端
["ali-tm", /\baliapp\(tm\/([0-9.]+)\)/],
// 天猫平板客户端
["ali-tm-pd", /\baliapp\(tm-pd\/([0-9.]+)\)/],
// UC 浏览器，可能会被识别为 Android 浏览器，规则需要前置。
// UC 桌面版浏览器携带 Chrome 信息，需要放在 Chrome 之前。
["uc", function (ua) {
  if (ua.indexOf("ucbrowser/") >= 0) {
    return (/\bucbrowser\/([0-9.]+)/
    );
  } else if (ua.indexOf("ubrowser/") >= 0) {
    return (/\bubrowser\/([0-9.]+)/
    );
  } else if (/\buc\/[0-9]/.test(ua)) {
    return (/\buc\/([0-9.]+)/
    );
  } else if (ua.indexOf("ucweb") >= 0) {
    // `ucweb/2.0` is compony info.
    // `UCWEB8.7.2.214/145/800` is browser info.
    return (/\bucweb([0-9.]+)?/
    );
  } else {
    return (/\b(?:ucbrowser|uc)\b/
    );
  }
}], ["chrome", / (?:chrome|crios|crmo)\/([0-9.]+)/],
// Android 默认浏览器。该规则需要在 safari 之前。
["android", function (ua) {
  if (ua.indexOf("android") === -1) {
    return;
  }
  return (/\bversion\/([0-9.]+(?: beta)?)/
  );
}], ["blackberry", function (ua) {
  var m = ua.match(re_blackberry_10) || ua.match(re_blackberry_6_7) || ua.match(re_blackberry_4_5);
  return m ? { version: m[1] } : "blackberry";
}], ["safari", /\bversion\/([0-9.]+(?: beta)?)(?: mobile(?:\/[a-z0-9]+)?)? safari\//],
// 如果不能被识别为 Safari，则猜测是 WebView。
["webview", /\bcpu(?: iphone)? os (?:[0-9._]+).+\bapplewebkit\b/], ["firefox", /\bfirefox\/([0-9.ab]+)/], ["nokia", /\bnokiabrowser\/([0-9.]+)/]];

module.exports = {
  device: DEVICES,
  os: OS,
  browser: BROWSER,
  engine: ENGINE,
  re_msie: re_msie
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],26:[function(require,module,exports){
/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2015 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */

// vim: ts=4 sts=4 sw=4 expandtab

// Add semicolon to prevent IIFE from being passed as argument to concatenated code.
;

// UMD (Universal Module Definition)
// see https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function (root, factory) {
    'use strict';

    /* global define, exports, module */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

/**
 * Brings an environment as close to ECMAScript 5 compliance
 * as is possible with the facilities of erstwhile engines.
 *
 * Annotated ES5: http://es5.github.com/ (specific links below)
 * ES5 Spec: http://www.ecma-international.org/publications/files/ECMA-ST/Ecma-262.pdf
 * Required reading: http://javascriptweblog.wordpress.com/2011/12/05/extending-javascript-natives/
 */

// Shortcut to an often accessed properties, in order to avoid multiple
// dereference that costs universally. This also holds a reference to known-good
// functions.
var $Array = Array;
var ArrayPrototype = $Array.prototype;
var $Object = Object;
var ObjectPrototype = $Object.prototype;
var $Function = Function;
var FunctionPrototype = $Function.prototype;
var $String = String;
var StringPrototype = $String.prototype;
var $Number = Number;
var NumberPrototype = $Number.prototype;
var array_slice = ArrayPrototype.slice;
var array_splice = ArrayPrototype.splice;
var array_push = ArrayPrototype.push;
var array_unshift = ArrayPrototype.unshift;
var array_concat = ArrayPrototype.concat;
var array_join = ArrayPrototype.join;
var call = FunctionPrototype.call;
var apply = FunctionPrototype.apply;
var max = Math.max;
var min = Math.min;

// Having a toString local variable name breaks in Opera so use to_string.
var to_string = ObjectPrototype.toString;

/* global Symbol */
/* eslint-disable one-var-declaration-per-line, no-redeclare, max-statements-per-line */
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
var isCallable; /* inlined from https://npmjs.com/is-callable */ var fnToStr = Function.prototype.toString, constructorRegex = /^\s*class /, isES6ClassFn = function isES6ClassFn(value) { try { var fnStr = fnToStr.call(value); var singleStripped = fnStr.replace(/\/\/.*\n/g, ''); var multiStripped = singleStripped.replace(/\/\*[.\s\S]*\*\//g, ''); var spaceStripped = multiStripped.replace(/\n/mg, ' ').replace(/ {2}/g, ' '); return constructorRegex.test(spaceStripped); } catch (e) { return false; /* not a function */ } }, tryFunctionObject = function tryFunctionObject(value) { try { if (isES6ClassFn(value)) { return false; } fnToStr.call(value); return true; } catch (e) { return false; } }, fnClass = '[object Function]', genClass = '[object GeneratorFunction]', isCallable = function isCallable(value) { if (!value) { return false; } if (typeof value !== 'function' && typeof value !== 'object') { return false; } if (hasToStringTag) { return tryFunctionObject(value); } if (isES6ClassFn(value)) { return false; } var strClass = to_string.call(value); return strClass === fnClass || strClass === genClass; };

var isRegex; /* inlined from https://npmjs.com/is-regex */ var regexExec = RegExp.prototype.exec, tryRegexExec = function tryRegexExec(value) { try { regexExec.call(value); return true; } catch (e) { return false; } }, regexClass = '[object RegExp]'; isRegex = function isRegex(value) { if (typeof value !== 'object') { return false; } return hasToStringTag ? tryRegexExec(value) : to_string.call(value) === regexClass; };
var isString; /* inlined from https://npmjs.com/is-string */ var strValue = String.prototype.valueOf, tryStringObject = function tryStringObject(value) { try { strValue.call(value); return true; } catch (e) { return false; } }, stringClass = '[object String]'; isString = function isString(value) { if (typeof value === 'string') { return true; } if (typeof value !== 'object') { return false; } return hasToStringTag ? tryStringObject(value) : to_string.call(value) === stringClass; };
/* eslint-enable one-var-declaration-per-line, no-redeclare, max-statements-per-line */

/* inlined from http://npmjs.com/define-properties */
var supportsDescriptors = $Object.defineProperty && (function () {
    try {
        var obj = {};
        $Object.defineProperty(obj, 'x', { enumerable: false, value: obj });
        for (var _ in obj) { return false; }
        return obj.x === obj;
    } catch (e) { /* this is ES3 */
        return false;
    }
}());
var defineProperties = (function (has) {
  // Define configurable, writable, and non-enumerable props
  // if they don't exist.
  var defineProperty;
  if (supportsDescriptors) {
      defineProperty = function (object, name, method, forceAssign) {
          if (!forceAssign && (name in object)) { return; }
          $Object.defineProperty(object, name, {
              configurable: true,
              enumerable: false,
              writable: true,
              value: method
          });
      };
  } else {
      defineProperty = function (object, name, method, forceAssign) {
          if (!forceAssign && (name in object)) { return; }
          object[name] = method;
      };
  }
  return function defineProperties(object, map, forceAssign) {
      for (var name in map) {
          if (has.call(map, name)) {
            defineProperty(object, name, map[name], forceAssign);
          }
      }
  };
}(ObjectPrototype.hasOwnProperty));

//
// Util
// ======
//

/* replaceable with https://npmjs.com/package/es-abstract /helpers/isPrimitive */
var isPrimitive = function isPrimitive(input) {
    var type = typeof input;
    return input === null || (type !== 'object' && type !== 'function');
};

var isActualNaN = $Number.isNaN || function (x) { return x !== x; };

var ES = {
    // ES5 9.4
    // http://es5.github.com/#x9.4
    // http://jsperf.com/to-integer
    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToInteger */
    ToInteger: function ToInteger(num) {
        var n = +num;
        if (isActualNaN(n)) {
            n = 0;
        } else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
            n = (n > 0 || -1) * Math.floor(Math.abs(n));
        }
        return n;
    },

    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToPrimitive */
    ToPrimitive: function ToPrimitive(input) {
        var val, valueOf, toStr;
        if (isPrimitive(input)) {
            return input;
        }
        valueOf = input.valueOf;
        if (isCallable(valueOf)) {
            val = valueOf.call(input);
            if (isPrimitive(val)) {
                return val;
            }
        }
        toStr = input.toString;
        if (isCallable(toStr)) {
            val = toStr.call(input);
            if (isPrimitive(val)) {
                return val;
            }
        }
        throw new TypeError();
    },

    // ES5 9.9
    // http://es5.github.com/#x9.9
    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToObject */
    ToObject: function (o) {
        if (o == null) { // this matches both null and undefined
            throw new TypeError("can't convert " + o + ' to object');
        }
        return $Object(o);
    },

    /* replaceable with https://npmjs.com/package/es-abstract ES5.ToUint32 */
    ToUint32: function ToUint32(x) {
        return x >>> 0;
    }
};

//
// Function
// ========
//

// ES-5 15.3.4.5
// http://es5.github.com/#x15.3.4.5

var Empty = function Empty() {};

defineProperties(FunctionPrototype, {
    bind: function bind(that) { // .length is 1
        // 1. Let Target be the this value.
        var target = this;
        // 2. If IsCallable(Target) is false, throw a TypeError exception.
        if (!isCallable(target)) {
            throw new TypeError('Function.prototype.bind called on incompatible ' + target);
        }
        // 3. Let A be a new (possibly empty) internal list of all of the
        //   argument values provided after thisArg (arg1, arg2 etc), in order.
        // XXX slicedArgs will stand in for "A" if used
        var args = array_slice.call(arguments, 1); // for normal call
        // 4. Let F be a new native ECMAScript object.
        // 11. Set the [[Prototype]] internal property of F to the standard
        //   built-in Function prototype object as specified in 15.3.3.1.
        // 12. Set the [[Call]] internal property of F as described in
        //   15.3.4.5.1.
        // 13. Set the [[Construct]] internal property of F as described in
        //   15.3.4.5.2.
        // 14. Set the [[HasInstance]] internal property of F as described in
        //   15.3.4.5.3.
        var bound;
        var binder = function () {

            if (this instanceof bound) {
                // 15.3.4.5.2 [[Construct]]
                // When the [[Construct]] internal method of a function object,
                // F that was created using the bind function is called with a
                // list of arguments ExtraArgs, the following steps are taken:
                // 1. Let target be the value of F's [[TargetFunction]]
                //   internal property.
                // 2. If target has no [[Construct]] internal method, a
                //   TypeError exception is thrown.
                // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Construct]] internal
                //   method of target providing args as the arguments.

                var result = apply.call(
                    target,
                    this,
                    array_concat.call(args, array_slice.call(arguments))
                );
                if ($Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                // 15.3.4.5.1 [[Call]]
                // When the [[Call]] internal method of a function object, F,
                // which was created using the bind function is called with a
                // this value and a list of arguments ExtraArgs, the following
                // steps are taken:
                // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                //   property.
                // 2. Let boundThis be the value of F's [[BoundThis]] internal
                //   property.
                // 3. Let target be the value of F's [[TargetFunction]] internal
                //   property.
                // 4. Let args be a new list containing the same values as the
                //   list boundArgs in the same order followed by the same
                //   values as the list ExtraArgs in the same order.
                // 5. Return the result of calling the [[Call]] internal method
                //   of target providing boundThis as the this value and
                //   providing args as the arguments.

                // equiv: target.call(this, ...boundArgs, ...args)
                return apply.call(
                    target,
                    that,
                    array_concat.call(args, array_slice.call(arguments))
                );

            }

        };

        // 15. If the [[Class]] internal property of Target is "Function", then
        //     a. Let L be the length property of Target minus the length of A.
        //     b. Set the length own property of F to either 0 or L, whichever is
        //       larger.
        // 16. Else set the length own property of F to 0.

        var boundLength = max(0, target.length - args.length);

        // 17. Set the attributes of the length own property of F to the values
        //   specified in 15.3.5.1.
        var boundArgs = [];
        for (var i = 0; i < boundLength; i++) {
            array_push.call(boundArgs, '$' + i);
        }

        // XXX Build a dynamic function with desired amount of arguments is the only
        // way to set the length property of a function.
        // In environments where Content Security Policies enabled (Chrome extensions,
        // for ex.) all use of eval or Function costructor throws an exception.
        // However in all of these environments Function.prototype.bind exists
        // and so this code will never be executed.
        bound = $Function('binder', 'return function (' + array_join.call(boundArgs, ',') + '){ return binder.apply(this, arguments); }')(binder);

        if (target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            // Clean up dangling references.
            Empty.prototype = null;
        }

        // TODO
        // 18. Set the [[Extensible]] internal property of F to true.

        // TODO
        // 19. Let thrower be the [[ThrowTypeError]] function Object (13.2.3).
        // 20. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "caller", PropertyDescriptor {[[Get]]: thrower, [[Set]]:
        //   thrower, [[Enumerable]]: false, [[Configurable]]: false}, and
        //   false.
        // 21. Call the [[DefineOwnProperty]] internal method of F with
        //   arguments "arguments", PropertyDescriptor {[[Get]]: thrower,
        //   [[Set]]: thrower, [[Enumerable]]: false, [[Configurable]]: false},
        //   and false.

        // TODO
        // NOTE Function objects created using Function.prototype.bind do not
        // have a prototype property or the [[Code]], [[FormalParameters]], and
        // [[Scope]] internal properties.
        // XXX can't delete prototype in pure-js.

        // 22. Return F.
        return bound;
    }
});

// _Please note: Shortcuts are defined after `Function.prototype.bind` as we
// use it in defining shortcuts.
var owns = call.bind(ObjectPrototype.hasOwnProperty);
var toStr = call.bind(ObjectPrototype.toString);
var arraySlice = call.bind(array_slice);
var arraySliceApply = apply.bind(array_slice);
var strSlice = call.bind(StringPrototype.slice);
var strSplit = call.bind(StringPrototype.split);
var strIndexOf = call.bind(StringPrototype.indexOf);
var pushCall = call.bind(array_push);
var isEnum = call.bind(ObjectPrototype.propertyIsEnumerable);
var arraySort = call.bind(ArrayPrototype.sort);

//
// Array
// =====
//

var isArray = $Array.isArray || function isArray(obj) {
    return toStr(obj) === '[object Array]';
};

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.13
// Return len+argCount.
// [bugfix, ielt8]
// IE < 8 bug: [].unshift(0) === undefined but should be "1"
var hasUnshiftReturnValueBug = [].unshift(0) !== 1;
defineProperties(ArrayPrototype, {
    unshift: function () {
        array_unshift.apply(this, arguments);
        return this.length;
    }
}, hasUnshiftReturnValueBug);

// ES5 15.4.3.2
// http://es5.github.com/#x15.4.3.2
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
defineProperties($Array, { isArray: isArray });

// The IsCallable() check in the Array functions
// has been replaced with a strict check on the
// internal class of the object to trap cases where
// the provided function was actually a regular
// expression literal, which in V8 and
// JavaScriptCore is a typeof "function".  Only in
// V8 are regular expression literals permitted as
// reduce parameters, so it is desirable in the
// general case for the shim to match the more
// strict and common behavior of rejecting regular
// expressions.

// ES5 15.4.4.18
// http://es5.github.com/#x15.4.4.18
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/forEach

// Check failure of by-index access of string characters (IE < 9)
// and failure of `0 in boxedString` (Rhino)
var boxedString = $Object('a');
var splitString = boxedString[0] !== 'a' || !(0 in boxedString);

var properlyBoxesContext = function properlyBoxed(method) {
    // Check node 0.6.21 bug where third parameter is not boxed
    var properlyBoxesNonStrict = true;
    var properlyBoxesStrict = true;
    var threwException = false;
    if (method) {
        try {
            method.call('foo', function (_, __, context) {
                if (typeof context !== 'object') {
                    properlyBoxesNonStrict = false;
                }
            });

            method.call([1], function () {
                'use strict';

                properlyBoxesStrict = typeof this === 'string';
            }, 'x');
        } catch (e) {
            threwException = true;
        }
    }
    return !!method && !threwException && properlyBoxesNonStrict && properlyBoxesStrict;
};

defineProperties(ArrayPrototype, {
    forEach: function forEach(callbackfn/*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var i = -1;
        var length = ES.ToUint32(self.length);
        var T;
        if (arguments.length > 1) {
          T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.forEach callback must be a function');
        }

        while (++i < length) {
            if (i in self) {
                // Invoke the callback function with call, passing arguments:
                // context, property value, property key, thisArg object
                if (typeof T === 'undefined') {
                    callbackfn(self[i], i, object);
                } else {
                    callbackfn.call(T, self[i], i, object);
                }
            }
        }
    }
}, !properlyBoxesContext(ArrayPrototype.forEach));

// ES5 15.4.4.19
// http://es5.github.com/#x15.4.4.19
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/map
defineProperties(ArrayPrototype, {
    map: function map(callbackfn/*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = ES.ToUint32(self.length);
        var result = $Array(length);
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.map callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                if (typeof T === 'undefined') {
                    result[i] = callbackfn(self[i], i, object);
                } else {
                    result[i] = callbackfn.call(T, self[i], i, object);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.map));

// ES5 15.4.4.20
// http://es5.github.com/#x15.4.4.20
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
defineProperties(ArrayPrototype, {
    filter: function filter(callbackfn/*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = ES.ToUint32(self.length);
        var result = [];
        var value;
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.filter callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (typeof T === 'undefined' ? callbackfn(value, i, object) : callbackfn.call(T, value, i, object)) {
                    pushCall(result, value);
                }
            }
        }
        return result;
    }
}, !properlyBoxesContext(ArrayPrototype.filter));

// ES5 15.4.4.16
// http://es5.github.com/#x15.4.4.16
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
defineProperties(ArrayPrototype, {
    every: function every(callbackfn/*, thisArg*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = ES.ToUint32(self.length);
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.every callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !(typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                return false;
            }
        }
        return true;
    }
}, !properlyBoxesContext(ArrayPrototype.every));

// ES5 15.4.4.17
// http://es5.github.com/#x15.4.4.17
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
defineProperties(ArrayPrototype, {
    some: function some(callbackfn/*, thisArg */) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = ES.ToUint32(self.length);
        var T;
        if (arguments.length > 1) {
            T = arguments[1];
        }

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.some callback must be a function');
        }

        for (var i = 0; i < length; i++) {
            if (i in self && (typeof T === 'undefined' ? callbackfn(self[i], i, object) : callbackfn.call(T, self[i], i, object))) {
                return true;
            }
        }
        return false;
    }
}, !properlyBoxesContext(ArrayPrototype.some));

// ES5 15.4.4.21
// http://es5.github.com/#x15.4.4.21
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduce
var reduceCoercesToObject = false;
if (ArrayPrototype.reduce) {
    reduceCoercesToObject = typeof ArrayPrototype.reduce.call('es5', function (_, __, ___, list) {
        return list;
    }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduce: function reduce(callbackfn/*, initialValue*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = ES.ToUint32(self.length);

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.reduce callback must be a function');
        }

        // no value to return if no initial value and an empty array
        if (length === 0 && arguments.length === 1) {
            throw new TypeError('reduce of empty array with no initial value');
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }

                // if array contains no values, no initial value to return
                if (++i >= length) {
                    throw new TypeError('reduce of empty array with no initial value');
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = callbackfn(result, self[i], i, object);
            }
        }

        return result;
    }
}, !reduceCoercesToObject);

// ES5 15.4.4.22
// http://es5.github.com/#x15.4.4.22
// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/reduceRight
var reduceRightCoercesToObject = false;
if (ArrayPrototype.reduceRight) {
    reduceRightCoercesToObject = typeof ArrayPrototype.reduceRight.call('es5', function (_, __, ___, list) {
        return list;
    }) === 'object';
}
defineProperties(ArrayPrototype, {
    reduceRight: function reduceRight(callbackfn/*, initial*/) {
        var object = ES.ToObject(this);
        var self = splitString && isString(this) ? strSplit(this, '') : object;
        var length = ES.ToUint32(self.length);

        // If no callback function or if callback is not a callable function
        if (!isCallable(callbackfn)) {
            throw new TypeError('Array.prototype.reduceRight callback must be a function');
        }

        // no value to return if no initial value, empty array
        if (length === 0 && arguments.length === 1) {
            throw new TypeError('reduceRight of empty array with no initial value');
        }

        var result;
        var i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }

                // if array contains no values, no initial value to return
                if (--i < 0) {
                    throw new TypeError('reduceRight of empty array with no initial value');
                }
            } while (true);
        }

        if (i < 0) {
            return result;
        }

        do {
            if (i in self) {
                result = callbackfn(result, self[i], i, object);
            }
        } while (i--);

        return result;
    }
}, !reduceRightCoercesToObject);

// ES5 15.4.4.14
// http://es5.github.com/#x15.4.4.14
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
var hasFirefox2IndexOfBug = ArrayPrototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
defineProperties(ArrayPrototype, {
    indexOf: function indexOf(searchElement/*, fromIndex */) {
        var self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
        var length = ES.ToUint32(self.length);

        if (length === 0) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = ES.ToInteger(arguments[1]);
        }

        // handle negative indices
        i = i >= 0 ? i : max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === searchElement) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2IndexOfBug);

// ES5 15.4.4.15
// http://es5.github.com/#x15.4.4.15
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/lastIndexOf
var hasFirefox2LastIndexOfBug = ArrayPrototype.lastIndexOf && [0, 1].lastIndexOf(0, -3) !== -1;
defineProperties(ArrayPrototype, {
    lastIndexOf: function lastIndexOf(searchElement/*, fromIndex */) {
        var self = splitString && isString(this) ? strSplit(this, '') : ES.ToObject(this);
        var length = ES.ToUint32(self.length);

        if (length === 0) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = min(i, ES.ToInteger(arguments[1]));
        }
        // handle negative indices
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && searchElement === self[i]) {
                return i;
            }
        }
        return -1;
    }
}, hasFirefox2LastIndexOfBug);

// ES5 15.4.4.12
// http://es5.github.com/#x15.4.4.12
var spliceNoopReturnsEmptyArray = (function () {
    var a = [1, 2];
    var result = a.splice();
    return a.length === 2 && isArray(result) && result.length === 0;
}());
defineProperties(ArrayPrototype, {
    // Safari 5.0 bug where .splice() returns undefined
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) {
            return [];
        } else {
            return array_splice.apply(this, arguments);
        }
    }
}, !spliceNoopReturnsEmptyArray);

var spliceWorksWithEmptyObject = (function () {
    var obj = {};
    ArrayPrototype.splice.call(obj, 0, 0, 1);
    return obj.length === 1;
}());
defineProperties(ArrayPrototype, {
    splice: function splice(start, deleteCount) {
        if (arguments.length === 0) { return []; }
        var args = arguments;
        this.length = max(ES.ToInteger(this.length), 0);
        if (arguments.length > 0 && typeof deleteCount !== 'number') {
            args = arraySlice(arguments);
            if (args.length < 2) {
                pushCall(args, this.length - start);
            } else {
                args[1] = ES.ToInteger(deleteCount);
            }
        }
        return array_splice.apply(this, args);
    }
}, !spliceWorksWithEmptyObject);
var spliceWorksWithLargeSparseArrays = (function () {
    // Per https://github.com/es-shims/es5-shim/issues/295
    // Safari 7/8 breaks with sparse arrays of size 1e5 or greater
    var arr = new $Array(1e5);
    // note: the index MUST be 8 or larger or the test will false pass
    arr[8] = 'x';
    arr.splice(1, 1);
    // note: this test must be defined *after* the indexOf shim
    // per https://github.com/es-shims/es5-shim/issues/313
    return arr.indexOf('x') === 7;
}());
var spliceWorksWithSmallSparseArrays = (function () {
    // Per https://github.com/es-shims/es5-shim/issues/295
    // Opera 12.15 breaks on this, no idea why.
    var n = 256;
    var arr = [];
    arr[n] = 'a';
    arr.splice(n + 1, 0, 'b');
    return arr[n] === 'a';
}());
defineProperties(ArrayPrototype, {
    splice: function splice(start, deleteCount) {
        var O = ES.ToObject(this);
        var A = [];
        var len = ES.ToUint32(O.length);
        var relativeStart = ES.ToInteger(start);
        var actualStart = relativeStart < 0 ? max((len + relativeStart), 0) : min(relativeStart, len);
        var actualDeleteCount = min(max(ES.ToInteger(deleteCount), 0), len - actualStart);

        var k = 0;
        var from;
        while (k < actualDeleteCount) {
            from = $String(actualStart + k);
            if (owns(O, from)) {
                A[k] = O[from];
            }
            k += 1;
        }

        var items = arraySlice(arguments, 2);
        var itemCount = items.length;
        var to;
        if (itemCount < actualDeleteCount) {
            k = actualStart;
            var maxK = len - actualDeleteCount;
            while (k < maxK) {
                from = $String(k + actualDeleteCount);
                to = $String(k + itemCount);
                if (owns(O, from)) {
                    O[to] = O[from];
                } else {
                    delete O[to];
                }
                k += 1;
            }
            k = len;
            var minK = len - actualDeleteCount + itemCount;
            while (k > minK) {
                delete O[k - 1];
                k -= 1;
            }
        } else if (itemCount > actualDeleteCount) {
            k = len - actualDeleteCount;
            while (k > actualStart) {
                from = $String(k + actualDeleteCount - 1);
                to = $String(k + itemCount - 1);
                if (owns(O, from)) {
                    O[to] = O[from];
                } else {
                    delete O[to];
                }
                k -= 1;
            }
        }
        k = actualStart;
        for (var i = 0; i < items.length; ++i) {
            O[k] = items[i];
            k += 1;
        }
        O.length = len - actualDeleteCount + itemCount;

        return A;
    }
}, !spliceWorksWithLargeSparseArrays || !spliceWorksWithSmallSparseArrays);

var originalJoin = ArrayPrototype.join;
var hasStringJoinBug;
try {
    hasStringJoinBug = Array.prototype.join.call('123', ',') !== '1,2,3';
} catch (e) {
    hasStringJoinBug = true;
}
if (hasStringJoinBug) {
    defineProperties(ArrayPrototype, {
        join: function join(separator) {
            var sep = typeof separator === 'undefined' ? ',' : separator;
            return originalJoin.call(isString(this) ? strSplit(this, '') : this, sep);
        }
    }, hasStringJoinBug);
}

var hasJoinUndefinedBug = [1, 2].join(undefined) !== '1,2';
if (hasJoinUndefinedBug) {
    defineProperties(ArrayPrototype, {
        join: function join(separator) {
            var sep = typeof separator === 'undefined' ? ',' : separator;
            return originalJoin.call(this, sep);
        }
    }, hasJoinUndefinedBug);
}

var pushShim = function push(item) {
    var O = ES.ToObject(this);
    var n = ES.ToUint32(O.length);
    var i = 0;
    while (i < arguments.length) {
        O[n + i] = arguments[i];
        i += 1;
    }
    O.length = n + i;
    return n + i;
};

var pushIsNotGeneric = (function () {
    var obj = {};
    var result = Array.prototype.push.call(obj, undefined);
    return result !== 1 || obj.length !== 1 || typeof obj[0] !== 'undefined' || !owns(obj, 0);
}());
defineProperties(ArrayPrototype, {
    push: function push(item) {
        if (isArray(this)) {
            return array_push.apply(this, arguments);
        }
        return pushShim.apply(this, arguments);
    }
}, pushIsNotGeneric);

// This fixes a very weird bug in Opera 10.6 when pushing `undefined
var pushUndefinedIsWeird = (function () {
    var arr = [];
    var result = arr.push(undefined);
    return result !== 1 || arr.length !== 1 || typeof arr[0] !== 'undefined' || !owns(arr, 0);
}());
defineProperties(ArrayPrototype, { push: pushShim }, pushUndefinedIsWeird);

// ES5 15.2.3.14
// http://es5.github.io/#x15.4.4.10
// Fix boxed string bug
defineProperties(ArrayPrototype, {
    slice: function (start, end) {
        var arr = isString(this) ? strSplit(this, '') : this;
        return arraySliceApply(arr, arguments);
    }
}, splitString);

var sortIgnoresNonFunctions = (function () {
    try {
        [1, 2].sort(null);
        [1, 2].sort({});
        return true;
    } catch (e) { /**/ }
    return false;
}());
var sortThrowsOnRegex = (function () {
    // this is a problem in Firefox 4, in which `typeof /a/ === 'function'`
    try {
        [1, 2].sort(/a/);
        return false;
    } catch (e) { /**/ }
    return true;
}());
var sortIgnoresUndefined = (function () {
    // applies in IE 8, for one.
    try {
        [1, 2].sort(undefined);
        return true;
    } catch (e) { /**/ }
    return false;
}());
defineProperties(ArrayPrototype, {
    sort: function sort(compareFn) {
        if (typeof compareFn === 'undefined') {
            return arraySort(this);
        }
        if (!isCallable(compareFn)) {
            throw new TypeError('Array.prototype.sort callback must be a function');
        }
        return arraySort(this, compareFn);
    }
}, sortIgnoresNonFunctions || !sortIgnoresUndefined || !sortThrowsOnRegex);

//
// Object
// ======
//

// ES5 15.2.3.14
// http://es5.github.com/#x15.2.3.14

// http://whattheheadsaid.com/2010/10/a-safer-object-keys-compatibility-implementation
var hasDontEnumBug = !({ 'toString': null }).propertyIsEnumerable('toString');
var hasProtoEnumBug = function () {}.propertyIsEnumerable('prototype');
var hasStringEnumBug = !owns('x', '0');
var equalsConstructorPrototype = function (o) {
    var ctor = o.constructor;
    return ctor && ctor.prototype === o;
};
var blacklistedKeys = {
    $window: true,
    $console: true,
    $parent: true,
    $self: true,
    $frame: true,
    $frames: true,
    $frameElement: true,
    $webkitIndexedDB: true,
    $webkitStorageInfo: true,
    $external: true
};
var hasAutomationEqualityBug = (function () {
    /* globals window */
    if (typeof window === 'undefined') { return false; }
    for (var k in window) {
        try {
            if (!blacklistedKeys['$' + k] && owns(window, k) && window[k] !== null && typeof window[k] === 'object') {
                equalsConstructorPrototype(window[k]);
            }
        } catch (e) {
            return true;
        }
    }
    return false;
}());
var equalsConstructorPrototypeIfNotBuggy = function (object) {
    if (typeof window === 'undefined' || !hasAutomationEqualityBug) { return equalsConstructorPrototype(object); }
    try {
        return equalsConstructorPrototype(object);
    } catch (e) {
        return false;
    }
};
var dontEnums = [
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor'
];
var dontEnumsLength = dontEnums.length;

// taken directly from https://github.com/ljharb/is-arguments/blob/master/index.js
// can be replaced with require('is-arguments') if we ever use a build process instead
var isStandardArguments = function isArguments(value) {
    return toStr(value) === '[object Arguments]';
};
var isLegacyArguments = function isArguments(value) {
    return value !== null &&
        typeof value === 'object' &&
        typeof value.length === 'number' &&
        value.length >= 0 &&
        !isArray(value) &&
        isCallable(value.callee);
};
var isArguments = isStandardArguments(arguments) ? isStandardArguments : isLegacyArguments;

defineProperties($Object, {
    keys: function keys(object) {
        var isFn = isCallable(object);
        var isArgs = isArguments(object);
        var isObject = object !== null && typeof object === 'object';
        var isStr = isObject && isString(object);

        if (!isObject && !isFn && !isArgs) {
            throw new TypeError('Object.keys called on a non-object');
        }

        var theKeys = [];
        var skipProto = hasProtoEnumBug && isFn;
        if ((isStr && hasStringEnumBug) || isArgs) {
            for (var i = 0; i < object.length; ++i) {
                pushCall(theKeys, $String(i));
            }
        }

        if (!isArgs) {
            for (var name in object) {
                if (!(skipProto && name === 'prototype') && owns(object, name)) {
                    pushCall(theKeys, $String(name));
                }
            }
        }

        if (hasDontEnumBug) {
            var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j];
                if (!(skipConstructor && dontEnum === 'constructor') && owns(object, dontEnum)) {
                    pushCall(theKeys, dontEnum);
                }
            }
        }
        return theKeys;
    }
});

var keysWorksWithArguments = $Object.keys && (function () {
    // Safari 5.0 bug
    return $Object.keys(arguments).length === 2;
}(1, 2));
var keysHasArgumentsLengthBug = $Object.keys && (function () {
    var argKeys = $Object.keys(arguments);
    return arguments.length !== 1 || argKeys.length !== 1 || argKeys[0] !== 1;
}(1));
var originalKeys = $Object.keys;
defineProperties($Object, {
    keys: function keys(object) {
        if (isArguments(object)) {
            return originalKeys(arraySlice(object));
        } else {
            return originalKeys(object);
        }
    }
}, !keysWorksWithArguments || keysHasArgumentsLengthBug);

//
// Date
// ====
//

var hasNegativeMonthYearBug = new Date(-3509827329600292).getUTCMonth() !== 0;
var aNegativeTestDate = new Date(-1509842289600292);
var aPositiveTestDate = new Date(1449662400000);
var hasToUTCStringFormatBug = aNegativeTestDate.toUTCString() !== 'Mon, 01 Jan -45875 11:59:59 GMT';
var hasToDateStringFormatBug;
var hasToStringFormatBug;
var timeZoneOffset = aNegativeTestDate.getTimezoneOffset();
if (timeZoneOffset < -720) {
    hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Tue Jan 02 -45875';
    hasToStringFormatBug = !(/^Thu Dec 10 2015 \d\d:\d\d:\d\d GMT[-\+]\d\d\d\d(?: |$)/).test(aPositiveTestDate.toString());
} else {
    hasToDateStringFormatBug = aNegativeTestDate.toDateString() !== 'Mon Jan 01 -45875';
    hasToStringFormatBug = !(/^Wed Dec 09 2015 \d\d:\d\d:\d\d GMT[-\+]\d\d\d\d(?: |$)/).test(aPositiveTestDate.toString());
}

var originalGetFullYear = call.bind(Date.prototype.getFullYear);
var originalGetMonth = call.bind(Date.prototype.getMonth);
var originalGetDate = call.bind(Date.prototype.getDate);
var originalGetUTCFullYear = call.bind(Date.prototype.getUTCFullYear);
var originalGetUTCMonth = call.bind(Date.prototype.getUTCMonth);
var originalGetUTCDate = call.bind(Date.prototype.getUTCDate);
var originalGetUTCDay = call.bind(Date.prototype.getUTCDay);
var originalGetUTCHours = call.bind(Date.prototype.getUTCHours);
var originalGetUTCMinutes = call.bind(Date.prototype.getUTCMinutes);
var originalGetUTCSeconds = call.bind(Date.prototype.getUTCSeconds);
var originalGetUTCMilliseconds = call.bind(Date.prototype.getUTCMilliseconds);
var dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var daysInMonth = function daysInMonth(month, year) {
    return originalGetDate(new Date(year, month, 0));
};

defineProperties(Date.prototype, {
    getFullYear: function getFullYear() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var year = originalGetFullYear(this);
        if (year < 0 && originalGetMonth(this) > 11) {
            return year + 1;
        }
        return year;
    },
    getMonth: function getMonth() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var year = originalGetFullYear(this);
        var month = originalGetMonth(this);
        if (year < 0 && month > 11) {
            return 0;
        }
        return month;
    },
    getDate: function getDate() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var year = originalGetFullYear(this);
        var month = originalGetMonth(this);
        var date = originalGetDate(this);
        if (year < 0 && month > 11) {
            if (month === 12) {
                return date;
            }
            var days = daysInMonth(0, year + 1);
            return (days - date) + 1;
        }
        return date;
    },
    getUTCFullYear: function getUTCFullYear() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var year = originalGetUTCFullYear(this);
        if (year < 0 && originalGetUTCMonth(this) > 11) {
            return year + 1;
        }
        return year;
    },
    getUTCMonth: function getUTCMonth() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var year = originalGetUTCFullYear(this);
        var month = originalGetUTCMonth(this);
        if (year < 0 && month > 11) {
            return 0;
        }
        return month;
    },
    getUTCDate: function getUTCDate() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var year = originalGetUTCFullYear(this);
        var month = originalGetUTCMonth(this);
        var date = originalGetUTCDate(this);
        if (year < 0 && month > 11) {
            if (month === 12) {
                return date;
            }
            var days = daysInMonth(0, year + 1);
            return (days - date) + 1;
        }
        return date;
    }
}, hasNegativeMonthYearBug);

defineProperties(Date.prototype, {
    toUTCString: function toUTCString() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var day = originalGetUTCDay(this);
        var date = originalGetUTCDate(this);
        var month = originalGetUTCMonth(this);
        var year = originalGetUTCFullYear(this);
        var hour = originalGetUTCHours(this);
        var minute = originalGetUTCMinutes(this);
        var second = originalGetUTCSeconds(this);
        return dayName[day] + ', ' +
            (date < 10 ? '0' + date : date) + ' ' +
            monthName[month] + ' ' +
            year + ' ' +
            (hour < 10 ? '0' + hour : hour) + ':' +
            (minute < 10 ? '0' + minute : minute) + ':' +
            (second < 10 ? '0' + second : second) + ' GMT';
    }
}, hasNegativeMonthYearBug || hasToUTCStringFormatBug);

// Opera 12 has `,`
defineProperties(Date.prototype, {
    toDateString: function toDateString() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var day = this.getDay();
        var date = this.getDate();
        var month = this.getMonth();
        var year = this.getFullYear();
        return dayName[day] + ' ' +
            monthName[month] + ' ' +
            (date < 10 ? '0' + date : date) + ' ' +
            year;
    }
}, hasNegativeMonthYearBug || hasToDateStringFormatBug);

// can't use defineProperties here because of toString enumeration issue in IE <= 8
if (hasNegativeMonthYearBug || hasToStringFormatBug) {
    Date.prototype.toString = function toString() {
        if (!this || !(this instanceof Date)) {
            throw new TypeError('this is not a Date object.');
        }
        var day = this.getDay();
        var date = this.getDate();
        var month = this.getMonth();
        var year = this.getFullYear();
        var hour = this.getHours();
        var minute = this.getMinutes();
        var second = this.getSeconds();
        var timezoneOffset = this.getTimezoneOffset();
        var hoursOffset = Math.floor(Math.abs(timezoneOffset) / 60);
        var minutesOffset = Math.floor(Math.abs(timezoneOffset) % 60);
        return dayName[day] + ' ' +
            monthName[month] + ' ' +
            (date < 10 ? '0' + date : date) + ' ' +
            year + ' ' +
            (hour < 10 ? '0' + hour : hour) + ':' +
            (minute < 10 ? '0' + minute : minute) + ':' +
            (second < 10 ? '0' + second : second) + ' GMT' +
            (timezoneOffset > 0 ? '-' : '+') +
            (hoursOffset < 10 ? '0' + hoursOffset : hoursOffset) +
            (minutesOffset < 10 ? '0' + minutesOffset : minutesOffset);
    };
    if (supportsDescriptors) {
        $Object.defineProperty(Date.prototype, 'toString', {
            configurable: true,
            enumerable: false,
            writable: true
        });
    }
}

// ES5 15.9.5.43
// http://es5.github.com/#x15.9.5.43
// This function returns a String value represent the instance in time
// represented by this Date object. The format of the String is the Date Time
// string format defined in 15.9.1.15. All fields are present in the String.
// The time zone is always UTC, denoted by the suffix Z. If the time value of
// this object is not a finite Number a RangeError exception is thrown.
var negativeDate = -62198755200000;
var negativeYearString = '-000001';
var hasNegativeDateBug = Date.prototype.toISOString && new Date(negativeDate).toISOString().indexOf(negativeYearString) === -1;
var hasSafari51DateBug = Date.prototype.toISOString && new Date(-1).toISOString() !== '1969-12-31T23:59:59.999Z';

var getTime = call.bind(Date.prototype.getTime);

defineProperties(Date.prototype, {
    toISOString: function toISOString() {
        if (!isFinite(this) || !isFinite(getTime(this))) {
            // Adope Photoshop requires the second check.
            throw new RangeError('Date.prototype.toISOString called on non-finite value.');
        }

        var year = originalGetUTCFullYear(this);

        var month = originalGetUTCMonth(this);
        // see https://github.com/es-shims/es5-shim/issues/111
        year += Math.floor(month / 12);
        month = (month % 12 + 12) % 12;

        // the date time string format is specified in 15.9.1.15.
        var result = [month + 1, originalGetUTCDate(this), originalGetUTCHours(this), originalGetUTCMinutes(this), originalGetUTCSeconds(this)];
        year = (
            (year < 0 ? '-' : (year > 9999 ? '+' : '')) +
            strSlice('00000' + Math.abs(year), (0 <= year && year <= 9999) ? -4 : -6)
        );

        for (var i = 0; i < result.length; ++i) {
          // pad months, days, hours, minutes, and seconds to have two digits.
          result[i] = strSlice('00' + result[i], -2);
        }
        // pad milliseconds to have three digits.
        return (
            year + '-' + arraySlice(result, 0, 2).join('-') +
            'T' + arraySlice(result, 2).join(':') + '.' +
            strSlice('000' + originalGetUTCMilliseconds(this), -3) + 'Z'
        );
    }
}, hasNegativeDateBug || hasSafari51DateBug);

// ES5 15.9.5.44
// http://es5.github.com/#x15.9.5.44
// This function provides a String representation of a Date object for use by
// JSON.stringify (15.12.3).
var dateToJSONIsSupported = (function () {
    try {
        return Date.prototype.toJSON &&
            new Date(NaN).toJSON() === null &&
            new Date(negativeDate).toJSON().indexOf(negativeYearString) !== -1 &&
            Date.prototype.toJSON.call({ // generic
                toISOString: function () { return true; }
            });
    } catch (e) {
        return false;
    }
}());
if (!dateToJSONIsSupported) {
    Date.prototype.toJSON = function toJSON(key) {
        // When the toJSON method is called with argument key, the following
        // steps are taken:

        // 1.  Let O be the result of calling ToObject, giving it the this
        // value as its argument.
        // 2. Let tv be ES.ToPrimitive(O, hint Number).
        var O = $Object(this);
        var tv = ES.ToPrimitive(O);
        // 3. If tv is a Number and is not finite, return null.
        if (typeof tv === 'number' && !isFinite(tv)) {
            return null;
        }
        // 4. Let toISO be the result of calling the [[Get]] internal method of
        // O with argument "toISOString".
        var toISO = O.toISOString;
        // 5. If IsCallable(toISO) is false, throw a TypeError exception.
        if (!isCallable(toISO)) {
            throw new TypeError('toISOString property is not callable');
        }
        // 6. Return the result of calling the [[Call]] internal method of
        //  toISO with O as the this value and an empty argument list.
        return toISO.call(O);

        // NOTE 1 The argument is ignored.

        // NOTE 2 The toJSON function is intentionally generic; it does not
        // require that its this value be a Date object. Therefore, it can be
        // transferred to other kinds of objects for use as a method. However,
        // it does require that any such object have a toISOString method. An
        // object is free to use the argument key to filter its
        // stringification.
    };
}

// ES5 15.9.4.2
// http://es5.github.com/#x15.9.4.2
// based on work shared by Daniel Friesen (dantman)
// http://gist.github.com/303249
var supportsExtendedYears = Date.parse('+033658-09-27T01:46:40.000Z') === 1e15;
var acceptsInvalidDates = !isNaN(Date.parse('2012-04-04T24:00:00.500Z')) || !isNaN(Date.parse('2012-11-31T23:59:59.000Z')) || !isNaN(Date.parse('2012-12-31T23:59:60.000Z'));
var doesNotParseY2KNewYear = isNaN(Date.parse('2000-01-01T00:00:00.000Z'));
if (doesNotParseY2KNewYear || acceptsInvalidDates || !supportsExtendedYears) {
    // XXX global assignment won't work in embeddings that use
    // an alternate object for the context.
    /* global Date: true */
    /* eslint-disable no-undef */
    var maxSafeUnsigned32Bit = Math.pow(2, 31) - 1;
    var hasSafariSignedIntBug = isActualNaN(new Date(1970, 0, 1, 0, 0, 0, maxSafeUnsigned32Bit + 1).getTime());
    /* eslint-disable no-implicit-globals */
    Date = (function (NativeDate) {
    /* eslint-enable no-implicit-globals */
    /* eslint-enable no-undef */
        // Date.length === 7
        var DateShim = function Date(Y, M, D, h, m, s, ms) {
            var length = arguments.length;
            var date;
            if (this instanceof NativeDate) {
                var seconds = s;
                var millis = ms;
                if (hasSafariSignedIntBug && length >= 7 && ms > maxSafeUnsigned32Bit) {
                    // work around a Safari 8/9 bug where it treats the seconds as signed
                    var msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
                    var sToShift = Math.floor(msToShift / 1e3);
                    seconds += sToShift;
                    millis -= sToShift * 1e3;
                }
                date = length === 1 && $String(Y) === Y ? // isString(Y)
                    // We explicitly pass it through parse:
                    new NativeDate(DateShim.parse(Y)) :
                    // We have to manually make calls depending on argument
                    // length here
                    length >= 7 ? new NativeDate(Y, M, D, h, m, seconds, millis) :
                    length >= 6 ? new NativeDate(Y, M, D, h, m, seconds) :
                    length >= 5 ? new NativeDate(Y, M, D, h, m) :
                    length >= 4 ? new NativeDate(Y, M, D, h) :
                    length >= 3 ? new NativeDate(Y, M, D) :
                    length >= 2 ? new NativeDate(Y, M) :
                    length >= 1 ? new NativeDate(Y instanceof NativeDate ? +Y : Y) :
                                  new NativeDate();
            } else {
                date = NativeDate.apply(this, arguments);
            }
            if (!isPrimitive(date)) {
              // Prevent mixups with unfixed Date object
              defineProperties(date, { constructor: DateShim }, true);
            }
            return date;
        };

        // 15.9.1.15 Date Time String Format.
        var isoDateExpression = new RegExp('^' +
            '(\\d{4}|[+-]\\d{6})' + // four-digit year capture or sign +
                                      // 6-digit extended year
            '(?:-(\\d{2})' + // optional month capture
            '(?:-(\\d{2})' + // optional day capture
            '(?:' + // capture hours:minutes:seconds.milliseconds
                'T(\\d{2})' + // hours capture
                ':(\\d{2})' + // minutes capture
                '(?:' + // optional :seconds.milliseconds
                    ':(\\d{2})' + // seconds capture
                    '(?:(\\.\\d{1,}))?' + // milliseconds capture
                ')?' +
            '(' + // capture UTC offset component
                'Z|' + // UTC capture
                '(?:' + // offset specifier +/-hours:minutes
                    '([-+])' + // sign capture
                    '(\\d{2})' + // hours offset capture
                    ':(\\d{2})' + // minutes offset capture
                ')' +
            ')?)?)?)?' +
        '$');

        var months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];

        var dayFromMonth = function dayFromMonth(year, month) {
            var t = month > 1 ? 1 : 0;
            return (
                months[month] +
                Math.floor((year - 1969 + t) / 4) -
                Math.floor((year - 1901 + t) / 100) +
                Math.floor((year - 1601 + t) / 400) +
                365 * (year - 1970)
            );
        };

        var toUTC = function toUTC(t) {
            var s = 0;
            var ms = t;
            if (hasSafariSignedIntBug && ms > maxSafeUnsigned32Bit) {
                // work around a Safari 8/9 bug where it treats the seconds as signed
                var msToShift = Math.floor(ms / maxSafeUnsigned32Bit) * maxSafeUnsigned32Bit;
                var sToShift = Math.floor(msToShift / 1e3);
                s += sToShift;
                ms -= sToShift * 1e3;
            }
            return $Number(new NativeDate(1970, 0, 1, 0, 0, s, ms));
        };

        // Copy any custom methods a 3rd party library may have added
        for (var key in NativeDate) {
            if (owns(NativeDate, key)) {
                DateShim[key] = NativeDate[key];
            }
        }

        // Copy "native" methods explicitly; they may be non-enumerable
        defineProperties(DateShim, {
            now: NativeDate.now,
            UTC: NativeDate.UTC
        }, true);
        DateShim.prototype = NativeDate.prototype;
        defineProperties(DateShim.prototype, {
            constructor: DateShim
        }, true);

        // Upgrade Date.parse to handle simplified ISO 8601 strings
        var parseShim = function parse(string) {
            var match = isoDateExpression.exec(string);
            if (match) {
                // parse months, days, hours, minutes, seconds, and milliseconds
                // provide default values if necessary
                // parse the UTC offset component
                var year = $Number(match[1]),
                    month = $Number(match[2] || 1) - 1,
                    day = $Number(match[3] || 1) - 1,
                    hour = $Number(match[4] || 0),
                    minute = $Number(match[5] || 0),
                    second = $Number(match[6] || 0),
                    millisecond = Math.floor($Number(match[7] || 0) * 1000),
                    // When time zone is missed, local offset should be used
                    // (ES 5.1 bug)
                    // see https://bugs.ecmascript.org/show_bug.cgi?id=112
                    isLocalTime = Boolean(match[4] && !match[8]),
                    signOffset = match[9] === '-' ? 1 : -1,
                    hourOffset = $Number(match[10] || 0),
                    minuteOffset = $Number(match[11] || 0),
                    result;
                var hasMinutesOrSecondsOrMilliseconds = minute > 0 || second > 0 || millisecond > 0;
                if (
                    hour < (hasMinutesOrSecondsOrMilliseconds ? 24 : 25) &&
                    minute < 60 && second < 60 && millisecond < 1000 &&
                    month > -1 && month < 12 && hourOffset < 24 &&
                    minuteOffset < 60 && // detect invalid offsets
                    day > -1 &&
                    day < (dayFromMonth(year, month + 1) - dayFromMonth(year, month))
                ) {
                    result = (
                        (dayFromMonth(year, month) + day) * 24 +
                        hour +
                        hourOffset * signOffset
                    ) * 60;
                    result = (
                        (result + minute + minuteOffset * signOffset) * 60 +
                        second
                    ) * 1000 + millisecond;
                    if (isLocalTime) {
                        result = toUTC(result);
                    }
                    if (-8.64e15 <= result && result <= 8.64e15) {
                        return result;
                    }
                }
                return NaN;
            }
            return NativeDate.parse.apply(this, arguments);
        };
        defineProperties(DateShim, { parse: parseShim });

        return DateShim;
    }(Date));
    /* global Date: false */
}

// ES5 15.9.4.4
// http://es5.github.com/#x15.9.4.4
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}

//
// Number
// ======
//

// ES5.1 15.7.4.5
// http://es5.github.com/#x15.7.4.5
var hasToFixedBugs = NumberPrototype.toFixed && (
  (0.00008).toFixed(3) !== '0.000' ||
  (0.9).toFixed(0) !== '1' ||
  (1.255).toFixed(2) !== '1.25' ||
  (1000000000000000128).toFixed(0) !== '1000000000000000128'
);

var toFixedHelpers = {
  base: 1e7,
  size: 6,
  data: [0, 0, 0, 0, 0, 0],
  multiply: function multiply(n, c) {
      var i = -1;
      var c2 = c;
      while (++i < toFixedHelpers.size) {
          c2 += n * toFixedHelpers.data[i];
          toFixedHelpers.data[i] = c2 % toFixedHelpers.base;
          c2 = Math.floor(c2 / toFixedHelpers.base);
      }
  },
  divide: function divide(n) {
      var i = toFixedHelpers.size;
      var c = 0;
      while (--i >= 0) {
          c += toFixedHelpers.data[i];
          toFixedHelpers.data[i] = Math.floor(c / n);
          c = (c % n) * toFixedHelpers.base;
      }
  },
  numToString: function numToString() {
      var i = toFixedHelpers.size;
      var s = '';
      while (--i >= 0) {
          if (s !== '' || i === 0 || toFixedHelpers.data[i] !== 0) {
              var t = $String(toFixedHelpers.data[i]);
              if (s === '') {
                  s = t;
              } else {
                  s += strSlice('0000000', 0, 7 - t.length) + t;
              }
          }
      }
      return s;
  },
  pow: function pow(x, n, acc) {
      return (n === 0 ? acc : (n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc)));
  },
  log: function log(x) {
      var n = 0;
      var x2 = x;
      while (x2 >= 4096) {
          n += 12;
          x2 /= 4096;
      }
      while (x2 >= 2) {
          n += 1;
          x2 /= 2;
      }
      return n;
  }
};

var toFixedShim = function toFixed(fractionDigits) {
    var f, x, s, m, e, z, j, k;

    // Test for NaN and round fractionDigits down
    f = $Number(fractionDigits);
    f = isActualNaN(f) ? 0 : Math.floor(f);

    if (f < 0 || f > 20) {
        throw new RangeError('Number.toFixed called with invalid number of decimals');
    }

    x = $Number(this);

    if (isActualNaN(x)) {
        return 'NaN';
    }

    // If it is too big or small, return the string value of the number
    if (x <= -1e21 || x >= 1e21) {
        return $String(x);
    }

    s = '';

    if (x < 0) {
        s = '-';
        x = -x;
    }

    m = '0';

    if (x > 1e-21) {
        // 1e-21 < x < 1e21
        // -70 < log2(x) < 70
        e = toFixedHelpers.log(x * toFixedHelpers.pow(2, 69, 1)) - 69;
        z = (e < 0 ? x * toFixedHelpers.pow(2, -e, 1) : x / toFixedHelpers.pow(2, e, 1));
        z *= 0x10000000000000; // Math.pow(2, 52);
        e = 52 - e;

        // -18 < e < 122
        // x = z / 2 ^ e
        if (e > 0) {
            toFixedHelpers.multiply(0, z);
            j = f;

            while (j >= 7) {
                toFixedHelpers.multiply(1e7, 0);
                j -= 7;
            }

            toFixedHelpers.multiply(toFixedHelpers.pow(10, j, 1), 0);
            j = e - 1;

            while (j >= 23) {
                toFixedHelpers.divide(1 << 23);
                j -= 23;
            }

            toFixedHelpers.divide(1 << j);
            toFixedHelpers.multiply(1, 1);
            toFixedHelpers.divide(2);
            m = toFixedHelpers.numToString();
        } else {
            toFixedHelpers.multiply(0, z);
            toFixedHelpers.multiply(1 << (-e), 0);
            m = toFixedHelpers.numToString() + strSlice('0.00000000000000000000', 2, 2 + f);
        }
    }

    if (f > 0) {
        k = m.length;

        if (k <= f) {
            m = s + strSlice('0.0000000000000000000', 0, f - k + 2) + m;
        } else {
            m = s + strSlice(m, 0, k - f) + '.' + strSlice(m, k - f);
        }
    } else {
        m = s + m;
    }

    return m;
};
defineProperties(NumberPrototype, { toFixed: toFixedShim }, hasToFixedBugs);

var hasToPrecisionUndefinedBug = (function () {
    try {
        return 1.0.toPrecision(undefined) === '1';
    } catch (e) {
        return true;
    }
}());
var originalToPrecision = NumberPrototype.toPrecision;
defineProperties(NumberPrototype, {
    toPrecision: function toPrecision(precision) {
        return typeof precision === 'undefined' ? originalToPrecision.call(this) : originalToPrecision.call(this, precision);
    }
}, hasToPrecisionUndefinedBug);

//
// String
// ======
//

// ES5 15.5.4.14
// http://es5.github.com/#x15.5.4.14

// [bugfix, IE lt 9, firefox 4, Konqueror, Opera, obscure browsers]
// Many browsers do not split properly with regular expressions or they
// do not perform the split correctly under obscure conditions.
// See http://blog.stevenlevithan.com/archives/cross-browser-split
// I've tested in many browsers and this seems to cover the deviant ones:
//    'ab'.split(/(?:ab)*/) should be ["", ""], not [""]
//    '.'.split(/(.?)(.?)/) should be ["", ".", "", ""], not ["", ""]
//    'tesst'.split(/(s)*/) should be ["t", undefined, "e", "s", "t"], not
//       [undefined, "t", undefined, "e", ...]
//    ''.split(/.?/) should be [], not [""]
//    '.'.split(/()()/) should be ["."], not ["", "", "."]

if (
    'ab'.split(/(?:ab)*/).length !== 2 ||
    '.'.split(/(.?)(.?)/).length !== 4 ||
    'tesst'.split(/(s)*/)[1] === 't' ||
    'test'.split(/(?:)/, -1).length !== 4 ||
    ''.split(/.?/).length ||
    '.'.split(/()()/).length > 1
) {
    (function () {
        var compliantExecNpcg = typeof (/()??/).exec('')[1] === 'undefined'; // NPCG: nonparticipating capturing group
        var maxSafe32BitInt = Math.pow(2, 32) - 1;

        StringPrototype.split = function (separator, limit) {
            var string = String(this);
            if (typeof separator === 'undefined' && limit === 0) {
                return [];
            }

            // If `separator` is not a regex, use native split
            if (!isRegex(separator)) {
                return strSplit(this, separator, limit);
            }

            var output = [];
            var flags = (separator.ignoreCase ? 'i' : '') +
                        (separator.multiline ? 'm' : '') +
                        (separator.unicode ? 'u' : '') + // in ES6
                        (separator.sticky ? 'y' : ''), // Firefox 3+ and ES6
                lastLastIndex = 0,
                // Make `global` and avoid `lastIndex` issues by working with a copy
                separator2, match, lastIndex, lastLength;
            var separatorCopy = new RegExp(separator.source, flags + 'g');
            if (!compliantExecNpcg) {
                // Doesn't need flags gy, but they don't hurt
                separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
            }
            /* Values for `limit`, per the spec:
             * If undefined: 4294967295 // maxSafe32BitInt
             * If 0, Infinity, or NaN: 0
             * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
             * If negative number: 4294967296 - Math.floor(Math.abs(limit))
             * If other: Type-convert, then use the above rules
             */
            var splitLimit = typeof limit === 'undefined' ? maxSafe32BitInt : ES.ToUint32(limit);
            match = separatorCopy.exec(string);
            while (match) {
                // `separatorCopy.lastIndex` is not reliable cross-browser
                lastIndex = match.index + match[0].length;
                if (lastIndex > lastLastIndex) {
                    pushCall(output, strSlice(string, lastLastIndex, match.index));
                    // Fix browsers whose `exec` methods don't consistently return `undefined` for
                    // nonparticipating capturing groups
                    if (!compliantExecNpcg && match.length > 1) {
                        /* eslint-disable no-loop-func */
                        match[0].replace(separator2, function () {
                            for (var i = 1; i < arguments.length - 2; i++) {
                                if (typeof arguments[i] === 'undefined') {
                                    match[i] = void 0;
                                }
                            }
                        });
                        /* eslint-enable no-loop-func */
                    }
                    if (match.length > 1 && match.index < string.length) {
                        array_push.apply(output, arraySlice(match, 1));
                    }
                    lastLength = match[0].length;
                    lastLastIndex = lastIndex;
                    if (output.length >= splitLimit) {
                        break;
                    }
                }
                if (separatorCopy.lastIndex === match.index) {
                    separatorCopy.lastIndex++; // Avoid an infinite loop
                }
                match = separatorCopy.exec(string);
            }
            if (lastLastIndex === string.length) {
                if (lastLength || !separatorCopy.test('')) {
                    pushCall(output, '');
                }
            } else {
                pushCall(output, strSlice(string, lastLastIndex));
            }
            return output.length > splitLimit ? arraySlice(output, 0, splitLimit) : output;
        };
    }());

// [bugfix, chrome]
// If separator is undefined, then the result array contains just one String,
// which is the this value (converted to a String). If limit is not undefined,
// then the output array is truncated so that it contains no more than limit
// elements.
// "0".split(undefined, 0) -> []
} else if ('0'.split(void 0, 0).length) {
    StringPrototype.split = function split(separator, limit) {
        if (typeof separator === 'undefined' && limit === 0) { return []; }
        return strSplit(this, separator, limit);
    };
}

var str_replace = StringPrototype.replace;
var replaceReportsGroupsCorrectly = (function () {
    var groups = [];
    'x'.replace(/x(.)?/g, function (match, group) {
        pushCall(groups, group);
    });
    return groups.length === 1 && typeof groups[0] === 'undefined';
}());

if (!replaceReportsGroupsCorrectly) {
    StringPrototype.replace = function replace(searchValue, replaceValue) {
        var isFn = isCallable(replaceValue);
        var hasCapturingGroups = isRegex(searchValue) && (/\)[*?]/).test(searchValue.source);
        if (!isFn || !hasCapturingGroups) {
            return str_replace.call(this, searchValue, replaceValue);
        } else {
            var wrappedReplaceValue = function (match) {
                var length = arguments.length;
                var originalLastIndex = searchValue.lastIndex;
                searchValue.lastIndex = 0;
                var args = searchValue.exec(match) || [];
                searchValue.lastIndex = originalLastIndex;
                pushCall(args, arguments[length - 2], arguments[length - 1]);
                return replaceValue.apply(this, args);
            };
            return str_replace.call(this, searchValue, wrappedReplaceValue);
        }
    };
}

// ECMA-262, 3rd B.2.3
// Not an ECMAScript standard, although ECMAScript 3rd Edition has a
// non-normative section suggesting uniform semantics and it should be
// normalized across all browsers
// [bugfix, IE lt 9] IE < 9 substr() with negative value not working in IE
var string_substr = StringPrototype.substr;
var hasNegativeSubstrBug = ''.substr && '0b'.substr(-1) !== 'b';
defineProperties(StringPrototype, {
    substr: function substr(start, length) {
        var normalizedStart = start;
        if (start < 0) {
            normalizedStart = max(this.length + start, 0);
        }
        return string_substr.call(this, normalizedStart, length);
    }
}, hasNegativeSubstrBug);

// ES5 15.5.4.20
// whitespace from: http://es5.github.io/#x15.5.4.20
var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
    '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' +
    '\u2029\uFEFF';
var zeroWidth = '\u200b';
var wsRegexChars = '[' + ws + ']';
var trimBeginRegexp = new RegExp('^' + wsRegexChars + wsRegexChars + '*');
var trimEndRegexp = new RegExp(wsRegexChars + wsRegexChars + '*$');
var hasTrimWhitespaceBug = StringPrototype.trim && (ws.trim() || !zeroWidth.trim());
defineProperties(StringPrototype, {
    // http://blog.stevenlevithan.com/archives/faster-trim-javascript
    // http://perfectionkills.com/whitespace-deviations/
    trim: function trim() {
        if (typeof this === 'undefined' || this === null) {
            throw new TypeError("can't convert " + this + ' to object');
        }
        return $String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    }
}, hasTrimWhitespaceBug);
var trim = call.bind(String.prototype.trim);

var hasLastIndexBug = StringPrototype.lastIndexOf && 'abcあい'.lastIndexOf('あい', 2) !== -1;
defineProperties(StringPrototype, {
    lastIndexOf: function lastIndexOf(searchString) {
        if (typeof this === 'undefined' || this === null) {
            throw new TypeError("can't convert " + this + ' to object');
        }
        var S = $String(this);
        var searchStr = $String(searchString);
        var numPos = arguments.length > 1 ? $Number(arguments[1]) : NaN;
        var pos = isActualNaN(numPos) ? Infinity : ES.ToInteger(numPos);
        var start = min(max(pos, 0), S.length);
        var searchLen = searchStr.length;
        var k = start + searchLen;
        while (k > 0) {
            k = max(0, k - searchLen);
            var index = strIndexOf(strSlice(S, k, start + searchLen), searchStr);
            if (index !== -1) {
                return k + index;
            }
        }
        return -1;
    }
}, hasLastIndexBug);

var originalLastIndexOf = StringPrototype.lastIndexOf;
defineProperties(StringPrototype, {
    lastIndexOf: function lastIndexOf(searchString) {
        return originalLastIndexOf.apply(this, arguments);
    }
}, StringPrototype.lastIndexOf.length !== 1);

// ES-5 15.1.2.2
/* eslint-disable radix */
if (parseInt(ws + '08') !== 8 || parseInt(ws + '0x16') !== 22) {
/* eslint-enable radix */
    /* global parseInt: true */
    parseInt = (function (origParseInt) {
        var hexRegex = /^[\-+]?0[xX]/;
        return function parseInt(str, radix) {
            var string = trim(str);
            var defaultedRadix = $Number(radix) || (hexRegex.test(string) ? 16 : 10);
            return origParseInt(string, defaultedRadix);
        };
    }(parseInt));
}

// https://es5.github.io/#x15.1.2.3
if (1 / parseFloat('-0') !== -Infinity) {
    /* global parseFloat: true */
    parseFloat = (function (origParseFloat) {
        return function parseFloat(string) {
            var inputString = trim(string);
            var result = origParseFloat(inputString);
            return result === 0 && strSlice(inputString, 0, 1) === '-' ? -0 : result;
        };
    }(parseFloat));
}

if (String(new RangeError('test')) !== 'RangeError: test') {
    var errorToStringShim = function toString() {
        if (typeof this === 'undefined' || this === null) {
            throw new TypeError("can't convert " + this + ' to object');
        }
        var name = this.name;
        if (typeof name === 'undefined') {
            name = 'Error';
        } else if (typeof name !== 'string') {
            name = $String(name);
        }
        var msg = this.message;
        if (typeof msg === 'undefined') {
            msg = '';
        } else if (typeof msg !== 'string') {
            msg = $String(msg);
        }
        if (!name) {
            return msg;
        }
        if (!msg) {
            return name;
        }
        return name + ': ' + msg;
    };
    // can't use defineProperties here because of toString enumeration issue in IE <= 8
    Error.prototype.toString = errorToStringShim;
}

if (supportsDescriptors) {
    var ensureNonEnumerable = function (obj, prop) {
        if (isEnum(obj, prop)) {
            var desc = Object.getOwnPropertyDescriptor(obj, prop);
            if (desc.configurable) {
              desc.enumerable = false;
              Object.defineProperty(obj, prop, desc);
            }
        }
    };
    ensureNonEnumerable(Error.prototype, 'message');
    if (Error.prototype.message !== '') {
      Error.prototype.message = '';
    }
    ensureNonEnumerable(Error.prototype, 'name');
}

if (String(/a/mig) !== '/a/gim') {
    var regexToString = function toString() {
        var str = '/' + this.source + '/';
        if (this.global) {
            str += 'g';
        }
        if (this.ignoreCase) {
            str += 'i';
        }
        if (this.multiline) {
            str += 'm';
        }
        return str;
    };
    // can't use defineProperties here because of toString enumeration issue in IE <= 8
    RegExp.prototype.toString = regexToString;
}

}));

},{}]},{},[5])