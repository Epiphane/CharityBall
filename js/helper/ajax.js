define([], function() {
   var Ajax = {};

   Ajax.ajax = function(url, method, params) {
      return new Promise(function(resolve, reject) {
         var xhr = new XMLHttpRequest();
         xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
               if (xhr.status == 200) {
                  try
                  {
                     var json = JSON.parse(xhr.responseText);

                     resolve(json);
                  }
                  catch(e)
                  {
                     resolve(xhr.responseText);
                  }
               }
               else {
                  reject(xhr.status, xhr);
               }
            }
         }
         xhr.open(method, url, true);
         if (typeof(params) === 'object' || typeof(params) === 'array') {
            params = JSON.stringify(params);
         }

         xhr.send(params);
      });
   };

   Ajax.get = function(url) {
      return Ajax.ajax(url, 'GET', {});
   };

   Ajax.post = function(url, params) {
      return Ajax.ajax(url, 'POST', params || {});
   };

   return Ajax;
});