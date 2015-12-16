define(Juicy.Component.create('Announcer', {
   constructor: function(entity) {
      var self = this;

      this.timeElapsed = 0;
      this.duration = 0;

      entity.isAnnouncing = function() {
         return self.timeElapsed < self.duration;
      }; 
   },

   announce: function(message, time) {
      time = time || 1;

      this.timeElapsed = 0;
      this.duration = time + 1;

      this.entity.getComponent('Text').set({
         font: '50px Arcade Classic',
         text: message
      });
   },

   update: function(dt) {
      if (!this.entity.isAnnouncing()) return;

      var destination = this.entity.state.game.width / 2;

      this.timeElapsed += dt;

      this.entity.position.x = destination * (1 + Math.pow(2 * this.timeElapsed / this.duration - 1, 3)) - this.entity.width / 2;
   }
}));