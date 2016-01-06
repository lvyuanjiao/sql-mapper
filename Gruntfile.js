module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      files: [
        'lib/**/*.js',
        '!lib/parser/grammar.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jison: {
      grammar: {
        files: {
          'lib/parser/grammar.js': 'lib/parser/grammar.jison'
        }
      }
    },
    mochacli: {
      src: ['test/**/*.js'],
      options: {
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jison');
  grunt.loadNpmTasks('grunt-mocha-cli');

  grunt.registerTask('default', ['jshint', 'jison']);
  grunt.registerTask('test', ['jshint', 'jison', 'mochacli']);
};
