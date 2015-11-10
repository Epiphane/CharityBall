define([
   'state/game',
   'helper/auth'
], function(
   GameState,
   Auth
) {
   return Juicy.State.extend({
      constructor: function(score) {
         var self = this;
         var token = localStorage.getItem('token');

         Auth.get('/objects/Scores?sort=score&dir=desc&limit=5')
            .then(function(text) { console.log(text); });

            console.log('Score: ' + score);
      },
      update: function() {

      },
      render: function(context) {
      }
   });
})