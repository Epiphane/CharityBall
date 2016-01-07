define(['helper/ajax'], function(Ajax) {
   var Auth = {};
   var token = localStorage.getItem('token');
   var attempts = 0;

   var qid = 641600748;
   var qapi = 'http://thomassteinke.com/api/'
   var qurl = qapi + 'quick/' + qid;

   Auth.setToken = function(token) {
      localStorage.setItem('token', token);
   };

   Auth.testLoginToken = function(resolve, reject) {
      Ajax.post(qapi + 'user/login', {
         token: token
      }).then(function(response) {
         Auth.setToken(response.token);

         resolve();
      }).catch(function(status) {
         if (status === 403) {
            // Forbidden
            Auth.promptLogin(resolve, reject);
         }
      });
   };

   Auth.promptLogin = function(resolve, reject) {
      var email    = prompt('Please re-authenticate', 'thomas@thomassteinke.com');
      var password = prompt('Password (not hidden)');

      // Attempt login
      Ajax.post(qapi + 'user/login', {
         email: email,
         password: password
      }).then(function(response) {
         Auth.setToken(response.token);
         attempts = 0; // Reset login attempt counter

         resolve();
      }).catch(function(status) {
         if (++attempts < 3) {
            Auth.promptLogin();
         }
         else {
            reject();
         }
      });
   };

   if (token) {
      Auth.verify = new Promise(function(resolve) { resolve(); });//Auth.testLoginToken);
   }
   else {
      Auth.verify = new Promise(function(resolve) { resolve(); });//Auth.testLoginToken);
      // Auth.verify = new Promise(Auth.promptLogin);
   }

   for (var method in Ajax) {
      (function(method) {
         Auth[method] = function() {
            arguments[0] = qurl + arguments[0];
            return Ajax[method].apply(Ajax, arguments).catch(function(status) {
               if (status === 403) {
                  // Forbidden
                  Auth.verify = new Promise(Auth.promptLogin);
               }
            });
         }
      })(method);
   }

   return Auth;
});