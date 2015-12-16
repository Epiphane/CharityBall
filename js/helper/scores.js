define(['helper/auth'], function(Auth) {
   var Scores = {};

   var USING_SERVER = false;

   Scores.get = function(num) {
      num = num || 5;
      if (USING_SERVER) {
         return Auth.get('/objects/Scores?sort=score&dir=desc&limit=' + num);
      }
      else {
         return new Promise(function(resolve, reject) {
            resolve(JSON.parse(localStorage.getItem('scores') || '[]').sort(function(a, b) { return b.score - a.score }).slice(0, num));
         });
      }
   };

   Scores.add = function(name, score) {
      if (USING_SERVER) {
         console.error("oh no");
      }
      else {
         var currentScores = JSON.parse(localStorage.getItem('scores') || '[]');
         currentScores.push({
            name: name,
            score: score
         });

         localStorage.setItem('scores', JSON.stringify(currentScores));
      }
   };

   return Scores;
});