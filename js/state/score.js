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

         console.log('Score: ' + score);

         this.objects = [];

         var text = new Juicy.Entity(this, ['Text']);
         text.getComponent('Text').set({
            font: '50px Arcade Classic',
            text: 'Score: ' + score
         });
         this.objects.push(text);

         this.status = new Juicy.Entity(this, ['Text']);
         this.status.getComponent('Text').set({
            font: '50px Arcade Classic',
            text: 'Loading High Scores'
         });

         this.scoreboard = document.createElement('canvas');
         this.scoreboard.width = Juicy.Game.width;
         this.scoreboard.height = Juicy.Game.height;
         var scoreboard_context = this.scoreboard.getContext('2d');

         var width_4 = this.scoreboard.width / 4;
         var writeLine = function(y, no, score, name) {
            scoreboard_context.fillText(no, width_4 - scoreboard_context.measureText(no).width / 2, y);
            scoreboard_context.fillText(score, 2 * width_4 - scoreboard_context.measureText(score).width / 2, y);
            scoreboard_context.fillText(name, 3 * width_4 - scoreboard_context.measureText(name).width / 2, y);
         }

         var writePlayerName = function(y, name) {
            scoreboard_context.fillStyle = '#00ff00'; // For name
            scoreboard_context.fillText(name, 3 * width_4 - scoreboard_context.measureText(name).width / 2, y);
         }

         scoreboard_context.font = '50px Arcade Classic';
         scoreboard_context.fillStyle = '#ff0000';
         writeLine(200, 'No.', 'Score', 'Name');
         scoreboard_context.fillStyle = '#ffff00'; // For scores

         this.keypressCallback = this.keypress.bind(this);
         Auth.get('/objects/Scores?sort=score&dir=desc&limit=5').then(function(scores) {
            self.status.getComponent('Text').set({
               text: 'High Scores',
               fillStyle: '#ccff00'
            });

            if (score > scores[scores.length - 1].score) {
               console.log('High score!');
               var ndx = scores.length - 1;
               while (ndx > 0 && scores[ndx - 1].score < score) {
                  ndx --;
               }

               scores.splice(ndx, 0, 'Player Score');
               scores.pop();

               scoreboard_context.fillStyle = '#00ff00'; // For name
               scoreboard_context.fillText('Enter Your Name', 2 * width_4 - scoreboard_context.measureText('Enter Your Name').width / 2, 700);
               

               self.name = '';
               self.highscore = ndx;
               document.addEventListener('keydown', self.keypressCallback);
            }

            scoreboard_context.fillStyle = '#ffff00'; // For scores
            for (var i = 0; i < scores.length; i ++) {
               if (scores[i] === 'Player Score') {
                  writeLine(300 + i * 75, i + 1, score, '');

               }
               else {
                  writeLine(300 + i * 75, i + 1, scores[i].score, scores[i].name);
               }
            }
         });

         this.pressEnter = new Juicy.Entity(this, ['Text']);
         this.pressEnter.getComponent('Text').set({
            fillStyle: '#ffff00',
            text: 'Press Enter to Continue',
            font: '50px Arcade Classic'
         });
      },
      setPlayerName: function(name) {
         if (name.length > 6) {
            name = name.substr(0, 6);
         }

         this.name = name;

         var scoreboard_context = this.scoreboard.getContext('2d');
         var width_4 = this.scoreboard.width / 4;
         var textWidth = scoreboard_context.measureText(name).width;

         scoreboard_context.clearRect(3 * width_4 - (textWidth + 50) / 2, 225 + this.highscore * 75, textWidth + 50, 75);
         scoreboard_context.fillStyle = '#00ff00'; // For name
         scoreboard_context.fillText(name, 3 * width_4 - textWidth / 2, 300 + this.highscore * 75);
      },
      keypress: function(e) {
         if (this.highscore == undefined) return;

         if (e.keyCode >= 65 && e.keyCode < 65 + 26) {
            this.setPlayerName(this.name + String.fromCharCode(e.keyCode));
         }
         // Backspace
         else if (e.keyCode === 8) {
            this.setPlayerName(this.name.substr(0, this.name.length - 1));
         }
      },
      key_ENTER: function() {
         if (this.highscore != undefined) {
            this.highscore = undefined;
            var scoreboard_context = this.scoreboard.getContext('2d');
            var clearWidth = scoreboard_context.measureText('Enter Your Name').width + 40;
            scoreboard_context.clearRect((this.game.width - clearWidth) / 2, 625, clearWidth, 700);
         }
         else {
            var self = this;
            require(['state/game'], function(GameState) {
               self.game.setState(new GameState());
            });
         }
      },
      update: function() {
      },
      render: function(context) {
         context.drawImage(this.scoreboard, 0, 0);

         for (var i = this.objects.length - 1; i >= 0; i--) {
            this.objects[i].render(context);
         }

         this.status.render(context, (this.game.width - this.status.width) / 2, 40);

         if (this.highscore == undefined) {
            this.pressEnter.render(context, (this.game.width - this.pressEnter.width) / 2, 625);
         }
      }
   });
})