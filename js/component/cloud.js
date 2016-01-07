define([], function() {
   return Juicy.Component.create('Cloud', {
      constructor: function(life, speed) {
         this.speed = speed;

         this.life = life || -1;

         this.dt = 0;
         this.dx = 0;

         this.remove = false;
      },
      update: function(dt) {
         if (this.remove) {
            return;
         }

         this.dt += dt;

         this.dx = this.speed * Math.sin(this.dt / 5);
         this.entity.position.x += this.dx * dt;

         if (this.life >= 0 && this.dt > this.life) {
            this.remove = true;

            var entity = this.entity;

            entity.getComponent('Sprite').runAnimation(1, 5, 0.6, false);
            entity.getComponent('Sprite').oncompleteanimation = function() {
               entity.remove = true;
            }
         }
      }
   })
});