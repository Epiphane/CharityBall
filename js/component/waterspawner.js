define([], function() {
   return Juicy.Component.create('WaterSpawner', {
      constructor: function() {
         this.x = 0;
         this.y = 0;
         this.width = 0;
         
         this.timePerRain = 0;
         this.counter = 0;
         this.onspawn = function() {};
      },
      setShape: function(x, y, width) {
         this.x = x;
         this.y = y;
         this.width = width;
      },
      setRainPerSec: function(frequency) {
         this.timePerRain = 1.0 / frequency;
      },
      update: function(dt) {
         if (this.timePerRain === 0) {
            return;
         }

         this.counter -= dt;
         while (this.counter <= 0) {
            this.onspawn(this.entity.position.x + Math.random() * this.width + this.x, this.entity.position.y + this.y);

            this.counter += this.timePerRain;
         }
      }
   })
});