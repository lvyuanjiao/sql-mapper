/* lexical grammar */
%lex

/* m:map, q:query, h: header, i:plugin, f:fragment, s:section */
%x q h m i f s

%{
  function trim(){
    yytext = yytext.trim();
  }
  function strip(start, end) {
    yytext = yytext.substr(start, yytext.length - (end ? end : 0));
  }
  function deleteWhitespace() {
    yytext = yytext.replace(/\s+/g, '');
  }
  function toNumber(){
    trim();
    yytext = Number(yytext);
  }
  function deleteQuotes(){
    trim();
    strip(1,2);
    yytext = yytext.replace(/\\"/g,'"');
  }
%}

id                                        [a-zA-Z_][a-zA-Z0-9_]*
path                                      [a-zA-Z_][a-zA-Z0-9_.]*
quotes                                    ('"'(\\\"|[^\"])*'"')|("'"(\\\'|[^\'])*"'")
number                                    "-"?\d+\.?\d*
s                                         \s*

%%

<<EOF>>													          { return 'EOF'; }
<q>{s}<<EOF>>													    { return 'EOF'; }
<m>{s}<<EOF>>													    { return 'EOF'; }

"//".*            		  		    					/* ignore comment */
\s+                                       /* skip whitespace */

<q>"{/"{id}{s}"}"                         { strip(2, 3); trim(); return 'END' }

{s}"{#"{id}                               { this.begin('h'); trim(); strip(2); return 'QUERY'; }
<q>{s}"{#"{id}                            { this.popState(); this.begin('h'); trim(); strip(2); return 'QUERY'; }
<m>{s}"{#"{id}                            { this.popState(); this.begin('h'); trim(); strip(2); return 'QUERY'; }
<h>{s}"("{s}                              { return '('; }
<h>{s}")"{s}                              { return ')'; }
<h>{s}","{s}                              { return ','; }
<h>{s}{id}          										  { trim(); return 'QUERY_ARG'; }
<h>{s}":"{path}                           { trim(); strip(1); return 'RESULT_MAP'; }
<h>{s}"+"({id})?                          { trim(); return 'CACHE'; }
<h>{s}"-"({id})?                          { trim(); return 'CACHE'; }
<h>{s}"|"{s}{id}                          { this.begin('i'); deleteWhitespace(); strip(1); return 'PLUGIN'; }
<h,i>{s}"|"{s}{id}  									    { this.popState(); this.begin("i"); deleteWhitespace(); strip(1); return 'PLUGIN' }
<h,i>\s+{path}											      { trim(); return 'PLUGIN_VAR'; }
<h,i>\s+{number}										      { toNumber(); return 'PLUGIN_CONST'; }
<h,i>\s+{quotes}										      { deleteQuotes(); return 'PLUGIN_CONST'; }

<h>{s}"}"  												        { this.popState(); this.begin('q'); return 'QUERY_BEGIN'; }
<h,i>{s}"}"  												      { this.popState(); this.popState(); this.begin('q'); return 'QUERY_BEGIN'; }

// escape
<q>[\\]["{"|"}"|"#"|"$"|\\]?							{ strip(1,1); return 'TEXT'; }

<q>"#"{path}(":"{id})?								    { trim(); strip(1,1); return 'REFERENCE'; }
<q>"$"{path}(":"{id})?								    { trim(); strip(1,1); return 'INLINE'; }

<q>[^{\\#$]+												      { return 'TEXT'; }

<q>"{<"{path}     							          { this.begin('f'); strip(2); return 'FRAGMENT'; }
<q,f>{s}["/"]?"}"										      { this.popState(); return 'FRAGMENT_END'; }
<q,f>{s}"("{s}                            { return '('; }
<q,f>{s}")"{s}                            { return ')'; }
<q,f>{s}","{s}                            { return ','; }
<q,f>{path}											          { return 'FRAGMENT_VAR'; }
<q,f>{number}											        { toNumber(); return 'FRAGMENT_CONST'; }
<q,f>{quotes}											        { deleteQuotes(); return 'FRAGMENT_CONST'; }

<q>"{@"{path}													    { this.begin("s"); strip(2); return 'SECTION_DEF'; }
<q,s>\s+{id}												      { trim(); return 'PARAMETER_KEY'; }
<q,s>{s}"="{s}											      { return '='; }
<q,s>{quotes}												      { deleteQuotes(); return 'PARAMETER_VALUE'; }
<q,s>{s}"/}"												      { this.popState(); return 'SECTION_SELF_CLOSE'; }
<q,s>{s}"}"												        { this.popState(); return 'SECTION_END'; }

"{"                                       { this.begin('m'); return 'MAP_BEGIN'; }
<m>\s+                                    /* skip whitespace */
<m>"}"                                    { return 'MAP_END'; }

<m>("*"{s})?{id}{s}":"                    { deleteWhitespace(); strip(0, 1); return 'KEY'; }
<m>","                                    { return ','; }
<m>({path}{s})?"{"                        { deleteWhitespace(); strip(0, 1); return 'ASSOCIATION_BEGIN'; }
<m>({path}{s})?"["                        { deleteWhitespace(); strip(0, 1); return 'COLLECTION_BEGIN'; }
<m>"]"                                    { return 'COLLECTION_END'; }
<m>{id}({s}"|"{s}{id}(\s+{id})*)?         { trim(); return 'VALUE'; }

/lex

/* operator precedence */

%start mapper

%% /* language grammar */

mapper
  : EOF
    { return {}; }
  | map EOF
    { return { map:$1 }; }
  | queries EOF
		{ return { sql:$1 }; }
  | map queries EOF
    { return { map:$1, sql:$2 }; }
	;

queries
  : queries query
    {
      $$ = $1;
      $$[$2.name] = $2;
    }
  | query
    { $$ = {}; $$[$1.name] = $1; }
  ;

query
	: query_header QUERY_BEGIN nodes END
    { $$ = $1; $$.block = $3; }
  ;

query_header
  : QUERY
    { $$ = yy.query($1, [], null, null, []); }
  | QUERY RESULT_MAP
    { $$ = yy.query($1, [], $2, null, []); }
  | QUERY '(' query_args ')'
    { $$ = yy.query($1, $3, null, null, []); }
  | QUERY '(' query_args ')' RESULT_MAP
    { $$ = yy.query($1, $3, $5, null, []); }

  | QUERY plugins
    { $$ = yy.query($1, [], null, null, $2); }
  | QUERY RESULT_MAP plugins
    { $$ = yy.query($1, [], $2, null, $3); }
  | QUERY '(' query_args ')' plugins
    { $$ = yy.query($1, $3, null, null, $5); }
  | QUERY '(' query_args ')' RESULT_MAP plugins
    { $$ = yy.query($1, $3, $5, null, $6); }

  | QUERY CACHE
    { $$ = yy.query($1, [], null, yy.cache($2), []); }
  | QUERY RESULT_MAP CACHE
    { $$ = yy.query($1, [], $2, yy.cache($3), []); }
  | QUERY '(' query_args ')' CACHE
    { $$ = yy.query($1, $3, null, yy.cache($5), []); }
  | QUERY '(' query_args ')' RESULT_MAP CACHE
    { $$ = yy.query($1, $3, $5, yy.cache($6), []); }

  | QUERY CACHE plugins
    { $$ = yy.query($1, [], null, yy.cache($2), $3); }
  | QUERY RESULT_MAP CACHE plugins
    { $$ = yy.query($1, [], $2, yy.cache($3), $4); }
  | QUERY '(' query_args ')' CACHE plugins
    { $$ = yy.query($1, $3, null, yy.cache($5), $6); }
  | QUERY '(' query_args ')' RESULT_MAP CACHE plugins
    { $$ = yy.query($1, $3, $5, yy.cache($6), $7); }
  ;

query_args
  : query_args ',' QUERY_ARG
    { $$ = [].concat($1, $3); }
  | QUERY_ARG
    { $$ = [$1] }
  ;

plugins
  : plugins plugin
    { $$ = [].concat($1, $2); }
  | plugin
    { $$ = [$1]; }
  ;

plugin
  : PLUGIN plugin_args
    { $$ = yy.plugin($1, $2); }
  | PLUGIN
    { $$ = yy.plugin($1, []); }
  ;

plugin_args
  : plugin_args plugin_arg
    { $$ = [].concat($1, $2); }
  | plugin_arg
    { $$ = [$1]; }
  ;

plugin_arg
  : PLUGIN_VAR
    { $$ = yy.argVar($1); }
  | PLUGIN_CONST
    { $$ = yy.argConst($1); }
  ;

nodes
	: nodes node
		{ $$ = yy.appendNode($1, $2); }
	| node
		{ $$ = [$1]; }
	;

node
  : section
    { $$ = $1; }
	| fragment
    { $$ = $1; }
  | REFERENCE
    { $$ = yy.reference($1); }
  | INLINE
    { $$ = yy.inline($1); }
  | TEXT
    { $$ = yy.text($1); }
	;

section
  : section_self_close
    { $$ = $1; }
	| section_header SECTION_END nodes END
  	{ $$ = $1; $$.block = $3; }
	;

section_self_close
	: section_header SECTION_SELF_CLOSE
	  { $$ = $1; }
	| section_header SECTION_END END
		{ $$ = $1; }
	;

section_header
  : SECTION_DEF parameters
    { $$ = yy.section($1, $2, []); }
  | SECTION_DEF
    { $$ = yy.section($1, {}, []); }
  ;

parameters
	: parameters parameter
		{
			$$ = $1;
			for(var k in $2) {
				$$[k] = $2[k];
			}
		}
  | parameter
		{ $$ = $1; }
	;

parameter
	: PARAMETER_KEY '=' PARAMETER_VALUE
		{
			$$ = {};
			$$[$1] = $3;
		}
	| PARAMETER_KEY
		{
			$$ = {};
			$$[$1] = true;
		}
	;

fragment
	: FRAGMENT '(' fragment_args ')' FRAGMENT_END
		{ $$ = yy.fragment($1, $3); }
	| FRAGMENT FRAGMENT_END
		{ $$ = yy.fragment($1, []); }
	;

fragment_args
	: fragment_args ',' fragment_arg
		{ $$ = [].concat($1, $3); }
	| fragment_arg
		{ $$ = [$1]; }
	;

fragment_arg
	: FRAGMENT_VAR
		{ $$ = yy.argVar($1); }
	| FRAGMENT_CONST
		{ $$ = yy.argConst($1); }
	;

map
  : MAP_BEGIN MAP_END
    { $$ = {}; }
  | MAP_BEGIN pairs MAP_END
    { $$ = $2.association; }
  ;

association
  :
    ASSOCIATION_BEGIN MAP_END
    {
      $$ = yy.schema();
      if($1){
        $$.extend = $1;
      }
    }
  | ASSOCIATION_BEGIN pairs MAP_END
    {
      $$ = $2;
      if($1){
        $$.extend = $1;
      }
    }
  ;

collection
  : COLLECTION_BEGIN COLLECTION_END
    {
      $$ = yy.schema();
      if($1){
        $$.extend = $1;
      }
    }
  | COLLECTION_BEGIN pairs COLLECTION_END
    {
      $$ = $2;
      if($1){
        $$.extend = $1;
      }
    }
  ;

pairs
  : pairs ',' pair
    { $$ = yy.appendPair($3, $1); }
  | pair
    { $$ = yy.appendPair($1); }
  ;

pair
  : KEY VALUE
    { $$ = yy.column($1, $2); }
  | KEY association
    { $$ = yy.association($1, $2); }
  | KEY collection
    { $$ = yy.collection($1, $2); }
  ;
