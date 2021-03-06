/*
 * Copyright 2014-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License"). You may not use
 * this file except in compliance with the License. A copy of the License is
 * located at
 *
 *    http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express
 * or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
(function() {
   var global = this;
   connect = global.connect || {};
   global.connect = connect;
   global.lily = connect;

   var ONE_DAY_MILLIS = 24*60*60*1000;

   /**
    * Unpollute sprintf functions from the global namespace.
    */
   connect.sprintf = global.sprintf;
   connect.vsprintf = global.vsprintf;
   delete global.sprintf;
   delete global.vsprintf;

   /**
    * Binds the given instance object as the context for
    * the method provided.
    *
    * @param scope The instance object to be set as the scope
    *    of the function.
    * @param method The method to be encapsulated.
    *
    * All other arguments, if any, are bound to the method
    * invocation inside the closure.
    *
    * @return A closure encapsulating the invocation of the
    *    method provided in context of the given instance.
    */
   connect.hitch = function() {
      var args = Array.prototype.slice.call(arguments);
      var scope = args.shift();
      var method = args.shift();

      connect.assertNotNull(scope, 'scope');
      connect.assertNotNull(method, 'method');
      connect.assertTrue(connect.isFunction(method), 'method must be a function');

      return function() {
         var closureArgs = Array.prototype.slice.call(arguments);
         return method.apply(scope, args.concat(closureArgs));
      };
   };

   /**
    * Determine if the given value is a callable function type.
    * Borrowed from Underscore.js.
    */
   connect.isFunction = function(obj) {
      return !!(obj && obj.constructor && obj.call && obj.apply);
   };

   /**
    * Determine if the given value is an array.
    */
   connect.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
   };

   /**
    * Get a list of keys from a Javascript object used
    * as a hash map.
    */
   connect.keys = function(map) {
      var keys = [];

      connect.assertNotNull(map, 'map');

      for (var k in map) {
         keys.push(k);
      }

      return keys;
   };

   /**
    * Get a list of values from a Javascript object used
    * as a hash map.
    */
   connect.values = function(map) {
      var values = [];

      connect.assertNotNull(map, 'map');

      for (var k in map) {
         values.push(map[k]);
      }

      return values;
   };

   /**
    * Get a list of key/value pairs from the given map.
    */
   connect.entries = function(map) {
      var entries = [];

      for (var k in map) {
         entries.push({key: k, value: map[k]});
      }

      return entries;
   };

   /**
    * Merge two or more maps together into a new map,
    * or simply copy a single map.
    */
   connect.merge = function() {
      var argMaps = Array.prototype.slice.call(arguments, 0);
      var resultMap = {};

      argMaps.forEach(function(map) {
         connect.entries(map).forEach(function(kv) {
            resultMap[kv.key] = kv.value;
         });
      });

      return resultMap;
   };

   connect.now = function() {
      return new Date().getTime();
   };

   connect.find = function(array, predicate) {
      for (var x = 0; x < array.length; x++) {
         if (predicate(array[x])) {
            return array[x];
         }
      }

      return null;
   };

   connect.contains = function(obj, value) {
      if (obj instanceof Array) {
         return connect.find(obj, function(v) { return v === value; }) != null;

      } else {
         return (value in obj);
      }
   };

   connect.containsValue = function(obj, value) {
      if (obj instanceof Array) {
         return connect.find(obj, function(v) { return v === value; }) != null;

      } else {
         return connect.find(connect.values(obj), function(v) { return v === value; }) != null;
      }
   };

   /**
    * Generate a random ID consisting of the current timestamp
    * and a random base-36 number based on Math.random().
    */
   connect.randomId = function() {
      return connect.sprintf("%s-%s", connect.now(), Math.random().toString(36).slice(2));
   };

   /**
    * Generate an enum from the given list of lower-case enum values,
    * where the enum keys will be upper case.
    *
    * Conversion from pascal case based on code from here:
    * http://stackoverflow.com/questions/30521224
    */
   connect.makeEnum = function(values) {
      var enumObj = {};

      values.forEach(function(value) {
         var key = value.replace(/\.?([a-z]+)_?/g, function (x, y) { return y.toUpperCase() + "_"; })
            .replace(/_$/, "");

         enumObj[key] = value;
      });

      return enumObj;
   };

   connect.makeNamespacedEnum = function(prefix, values) {
      var enumObj = connect.makeEnum(values);
      connect.keys(enumObj).forEach(function(key) {
         enumObj[key] = connect.sprintf("%s::%s", prefix, enumObj[key]);
      });
      return enumObj;
   };

   /**
    * Return a map of items in the given list indexed by
    * keys determined by the closure provided.
    *
    * @param iterable A list-like object.
    * @param closure A closure to determine the index for the
    *    items in the iterable.
    * @return A map from index to item for each item in the iterable.
    */
   connect.index = function(iterable, closure) {
      var map = {};

      iterable.forEach(function(item) {
         map[closure(item)] = item;
      });

      return map;
   };

   /**
    * Converts the given array into a map as a set,
    * where elements in the array are mapped to 1.
    */
   connect.set = function(arrayIn) {
      var setMap = {};

      arrayIn.forEach(function(key) {
         setMap[key] = 1;
      });

      return setMap;
   };

   /**
    * Returns a map for each key in mapB which
    * is NOT in mapA.
    */
   connect.relativeComplement = function(mapA, mapB) {
      var compMap = {};

      connect.keys(mapB).forEach(function(key) {
         if (! (key in mapA)) {
            compMap[key] = mapB[key];
         }
      });

      return compMap;
   };

   /**
    * Asserts that a premise is true.
    */
   connect.assertTrue = function(premise, message) {
      if (! premise) {
         throw new connect.ValueError(message);
      }
   };

   /**
    * Asserts that a value is not null or undefined.
    */
   connect.assertNotNull = function(value, name) {
      connect.assertTrue(value != null && typeof value !== undefined,
            connect.sprintf("%s must be provided", name || 'A value'));
      return value;
   };

   connect.deepcopy = function(src) {
      return JSON.parse(JSON.stringify(src));
   };

   /**
    * Get the current base url of the open page, e.g. if the page is
    * https://example.com:9494/oranges, this will be "https://example.com:9494".
    */
   connect.getBaseUrl = function() {
      var location = global.location;
      return connect.sprintf("%s//%s:%s", location.protocol, location.hostname, location.port);
   };

   /**
    * Determine if the current window is in an iframe.
    * Courtesy: http://stackoverflow.com/questions/326069/
    */
   connect.isFramed = function() {
      try {
         return window.self !== window.top;
      } catch (e) {
         return true;
      }
   };

   /**
    * A wrapper around Window.open() for managing single instance popups.
    */
   connect.PopupManager = function() {};

   connect.PopupManager.prototype.open = function(url, name) {
      var then = this._getLastOpenedTimestamp(name);
      var now = new Date().getTime();

      if (now - then > ONE_DAY_MILLIS) {
         var win = window.open('', name);
         if (win.location !== url) {
            window.open(url, name);
         }
         this._setLastOpenedTimestamp(name, now);
      }
   };

   connect.PopupManager.prototype.clear = function(name) {
      var key = this._getLocalStorageKey(name);
      global.localStorage.removeItem(key);
   };

   connect.PopupManager.prototype._getLastOpenedTimestamp = function(name) {
      var key = this._getLocalStorageKey(name);
      var value = global.localStorage.getItem(key);

      if (value) {
         return parseInt(value, 10);

      } else {
         return 0;
      }
   };

   connect.PopupManager.prototype._setLastOpenedTimestamp = function(name, ts) {
      var key = this._getLocalStorageKey(name);
      global.localStorage.setItem(key, '' + ts);
   };

   connect.PopupManager.prototype._getLocalStorageKey = function(name) {
      return "connectPopupManager::" + name;
   };

   /**
    * An enumeration of the HTML5 notification permission values.
    */
   var NotificationPermission = connect.makeEnum([
      'granted',
      'denied',
      'default'
   ]);

   /**
    * A simple engine for showing notification popups.
    */
   connect.NotificationManager = function() {
      this.queue = [];
      this.permission = NotificationPermission.DEFAULT;
   };

   connect.NotificationManager.prototype.requestPermission = function() {
      var self = this;
      if (!("Notification" in global)) {
         connect.getLog().warn("This browser doesn't support notifications.");
         this.permission = NotificationPermission.DENIED;

      } else if (global.Notification.permission === NotificationPermission.DENIED) {
         connect.getLog().warn("The user has requested to not receive notifications.");
         this.permission = NotificationPermission.DENIED;

      } else if (this.permission !== NotificationPermission.GRANTED) {
         global.Notification.requestPermission(function(permission) {
            self.permission = permission;
            if (permission === NotificationPermission.GRANTED) {
               self._showQueued();

            } else {
               self.queue = [];
            }
         });
      }
   };

   connect.NotificationManager.prototype.show = function(title, options) {
      if (this.permission === NotificationPermission.GRANTED) {
         return this._showImpl({title: title, options: options});

      } else if (this.permission === NotificationPermission.DENIED) {
         connect.getLog().warn("Unable to show notification.").withObject({
            title: title,
            options: options
         });

      } else {
         var params = {title: title, options: options};
         connect.getLog().warn("Deferring notification until user decides to allow or deny.")
            .withObject(params);
         this.queue.push(params);
      }
   };

   connect.NotificationManager.prototype._showQueued = function() {
      var self = this;
      var notifications = this.queue.map(function(params) {
         return self._showImpl(params);
      });
      this.queue = [];
      return notifications;
   };

   connect.NotificationManager.prototype._showImpl = function(params) {
      var notification = new global.Notification(params.title, params.options);
      if (params.options.clicked) {
         notification.onclick = function() {
            params.options.clicked.call(notification);
         };
      }
      return notification;
   };

   connect.BaseError = function(format, args) {
      global.Error.call(this, connect.vsprintf(format, args));
   };
   connect.BaseError.prototype = Object.create(Error.prototype);
   connect.BaseError.prototype.constructor = connect.BaseError;

   connect.ValueError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      connect.BaseError.call(this, format, args);
   };
   connect.ValueError.prototype = Object.create(connect.BaseError.prototype);
   connect.ValueError.prototype.constructor = connect.ValueError;

   connect.NotImplementedError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      connect.BaseError.call(this, format, args);
   };
   connect.NotImplementedError.prototype = Object.create(connect.BaseError.prototype);
   connect.NotImplementedError.prototype.constructor = connect.NotImplementedError;

   connect.StateError = function() {
      var args = Array.prototype.slice.call(arguments, 0);
      var format = args.shift();
      connect.BaseError.call(this, format, args);
   };
   connect.StateError.prototype = Object.create(connect.BaseError.prototype);
   connect.StateError.prototype.constructor = connect.StateError;

})();
