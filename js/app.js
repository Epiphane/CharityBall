requirejs.config({
   baseUrl: 'js',
   paths: {
      box2d: '../lib/box2d'
   }
});

require([
   'state/loading',
   'helper/ajax'
], function(
   LoadingState,
   Ajax
) {   
   var RATIO = 1.6;
   var HEIGHT = 800;

   var gameCanvas = document.getElementById('game-canvas');
   var Game = Juicy.Game.init(gameCanvas, HEIGHT * RATIO, HEIGHT, {
      ESC: 27,
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
      SPACE: 32,

      W: 87,
      A: 65,
      S: 83,
      D: 68,
   });

   // Game.getContext().mozImageSmoothingEnabled = false;
   // Game.getContext().imageSmoothingEnabled = false;


   // On window resize, fill it with the game again!
   window.onresize = function() {
      Game.resize();
   };

   // Find the right method, call on correct element
   function launchIntoFullscreen(element) {
      if(element.requestFullscreen) {
         element.requestFullscreen();
      } else if(element.mozRequestFullScreen) {
         element.mozRequestFullScreen();
      } else if(element.webkitRequestFullscreen) {
         element.webkitRequestFullscreen();
      } else if(element.msRequestFullscreen) {
         element.msRequestFullscreen();
      }
   }

   document.getElementById('fullscreen').onclick = function() {
      launchIntoFullscreen(gameCanvas);
   };

   Game.setState(new LoadingState()).run();
});
