define([], function() {
   return Juicy.Component.create('Announcement', {
      constructor: function(entity) {
         this.elapsed = 0;
         this.messageLength = 0;
         this.transitionLength = 0.5;

         var self = this;
         entity.isVisible = function() {
            return !!self.elapsed < self.messageLength + self.transitionLength * 2;
         };
      },
      announce: function(message, time) {
         this.messageLength = (time || 1) + this.transitionLength * 2;
         this.elapsed = 0;

         this.entity.getComponent('Text').set({
            font: '52px Arcade Classic',
            text: message
         });
      },
      update: function(dt) {
         var destination = this.entity.state.game.width / 2;
         var percentElapsed = this.elapsed / this.messageLength;
         var announcementPosition = destination * (1 + Math.pow(percentElapsed - 0.5, 0.1));

         this.entity.position.x = Math.floor(announcementPosition - this.entity.width / 2)
      }
   })
});