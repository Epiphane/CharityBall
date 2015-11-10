define([
   'state/game',
   'helper/auth'
], function(
   GameState,
   Auth
) {
   return Juicy.State.extend({
      init: function() {
         var self = this;

         Auth.verify.then(function() {
            self.startGame();
         });
      },
      startGame: function() {
         this.game.setState(new GameState());
      },
      update: function() {

      },
      render: function(context) {
      }
   });
})