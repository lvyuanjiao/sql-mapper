/* lexical grammar */
%lex

/* m:map, q:query, h: header, i:interceptor, f:fragment, s:section */
%x q h m i f s p

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
<h>{s}{id}          										  { trim(); return 'QUERY_ARG'; }
<h>{s}":"{id}                             { trim(); strip(1); return 'RESULT_MAP'; }
<h>{s}"|"{s}{id}                          { this.begin('i'); deleteWhitespace(); strip(1); return 'INTERCEPTOR'; }
<h,i>{s}"|"{s}{id}  									    { this.popState(); this.begin("i"); deleteWhitespace(); strip(1); return 'INTERCEPTOR' }
<h,i>\s+{path}											      { trim(); return 'INTERCEPTOR_VAR'; }
<h,i>\s+{number}										      { toNumber(); return 'INTERCEPTOR_CONST'; }
<h,i>\s+{quotes}										      { deleteQuotes(); return 'INTERCEPTOR_CONST'; }

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
<q,f>{path}											      { trim(); return 'FRAGMENT_VAR'; }
<q,f>{number}											    { toNumber(); return 'FRAGMENT_CONST'; }
<q,f>{quotes}											    { deleteQuotes(); return 'FRAGMENT_CONST'; }

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
<m>"{"{s}{path}{s}"}"                     { deleteWhitespace(); strip(1, 2); return 'REF_ASSOCIATION'; }
<m>"[{"{s}{path}{s}"}]"                   { deleteWhitespace(); strip(2, 4); return 'REF_COLLECTION'; }
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
    { return { maps:$1 }; }
  | queries EOF
		{ return { queries:$1 }; }
  | map queries EOF
    { return { maps:$1, queries:$2 }; }
	;

queries
  : queries query
    { $$ = [].concat($1, $2); }
  | query
    { $$ = $1; }
  ;

query
	: query_header QUERY_BEGIN nodes END
    { $$ = {'header':$1, 'nodes':$3, 'end':$4}; }
  ;

query_header
  : QUERY
    { $$ = {}; $$.name = $1; }
  | QUERY RESULT_MAP
      { $$ = {}; $$.name = $1; $$.map = $2; }
  | QUERY '(' query_args ')'
    { $$ = {}; $$.name = $1, $$.args = $3; }
  | QUERY '(' query_args ')' RESULT_MAP
      { $$ = {}; $$.name = $1, $$.args = $3; $$.map = $5; }
  | QUERY interceptors
    { $$ = {}; $$.name = $1; $$.interceptors = $2; }
  | QUERY RESULT_MAP interceptors
      { $$ = {}; $$.name = $1; $$.map = $2; $$.interceptors = $3; }
  | QUERY '(' query_args ')' interceptors
    { $$ = {}; $$.name = $1, $$.args = $3; $$.interceptors = $5; }
  | QUERY '(' query_args ')' RESULT_MAP interceptors
      { $$ = {}; $$.name = $1, $$.args = $3; $$.map = $5;  $$.interceptors = $6; }
  ;

query_args
  : query_args QUERY_ARG
    { $$ = [].concat($1, $2); }
  | QUERY_ARG
    { $$ = [$1]; }
  ;

interceptors
  : interceptors interceptor
    { $$ = [].concat($1, $2); }
  | interceptor
    { $$ = [$1]; }
  ;

interceptor
  : INTERCEPTOR interceptor_args
    { $$ = {}; $$.name = $1; $$.args = $2; }
  | INTERCEPTOR
    { $$ = {}; $$.name = $1; }
  ;

interceptor_args
  : interceptor_args interceptor_arg
    { $$ = [].concat($1, $2); }
  | interceptor_arg
    { $$ = [$1]; }
  ;

interceptor_arg
  : INTERCEPTOR_VAR
    { $$ = $1; }
  | INTERCEPTOR_CONST
    { $$ = $1; }
  ;

nodes
	: nodes node
		{ $$ = [].concat($1, $2); }
	| node
		{ $$ = [$1]; }
	;

node
  : section
    { $$ = $1; }
	| fragment
    { $$ = $1; }
  | REFERENCE
    { $$ = $1; }
  | INLINE
    { $$ = $1; }
  | TEXT
    { $$ = $1; }
	;

section
  : section_self_close
    { $$ = $1; }
	| section_header SECTION_END nodes END
  	{ $$ = $1; $$.block = $3; $$.end = $4; }
	;

section_self_close
	: section_header SECTION_SELF_CLOSE
	  { $$ = $1; }
	| section_header SECTION_END END
		{ $$ = $1; $$.end = $3; }
	;

section_header
  : SECTION_DEF parameters
    { $$ = {}; $$.name = $1; $$.params = $2; }
  | SECTION_DEF
    { $$ = {}; $$.name = $1; }
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
		{ $$ = {}; $$.fragment = $1; $$.args = $3; }
	| FRAGMENT FRAGMENT_END
		{ $$ = {}; $$.fragment = $1; }
	;

fragment_args
	: fragment_args ',' fragment_arg
		{ $$ = [].concat($1, $3); }
	| fragment_arg
		{ $$ = [$1]; }
	;

fragment_arg
	: FRAGMENT_VAR
		{ $$ = $1; }
	| FRAGMENT_CONST
		{ $$ = $1; }
	;

map
  : MAP_BEGIN MAP_END
    { $$ = {}; }
  | MAP_BEGIN pairs MAP_END
    {
      var maps = {};
      $2.associations.forEach(function(association){
        console.log(association);
        maps[association.property] = association;
      });
      $$ = maps;
    }
  ;

association
  : ASSOCIATION_BEGIN pairs MAP_END
    { $$ = $2; $$.extend = $1; }
  ;

collection
  : COLLECTION_BEGIN pairs COLLECTION_END
    { $$ = $2; $$.extend = $1; }
  ;

pairs
  : pairs ',' pair
    {
      $$ = $1;
      if($3.type === 'id') {
        $$.idx.push($3.value[$3.key]);
        $$.columns.push($1.value);
      } else if($3.type === 'column') {
        $$.columns.push($3.value);
      } else if($3.type === 'association') {
        $$.associations.push($3.value);
      } else if($3.type === 'collection') {
        $$.collections.push($3.value);
      }
    }
  | pair
    {
      $$ = {
        'idx': [],
        'columns': [],
        'associations': [],
        'collections': []
      };
      if($1.type === 'id') {
        $$.idx.push($1.value[$1.key]);
        $$.columns.push($1.value);
      } else if($1.type === 'column') {
        $$.columns.push($1.value);
      } else if($1.type === 'association') {
        $$.associations.push($1.value);
      } else if($1.type === 'collection') {
        $$.collections.push($1.value);
      }
    }
  ;

pair
  : KEY VALUE
    {
      $$ = { type:'column', key: $1, value: {} };
      if($1[0] === '*') {
        $$.key = $$.key.substring(1);
        $$.type = 'id';
      }
      $$.value[$$.key] = $2;
    }
  | KEY association
    {
      $$ = { type:'association', value: $2 };
      $$.value.property = $1;
    }
  | KEY collection
    {
      $$ = { type:'collection', value: $2 };
      $$.value.property = $1;
    }
  | KEY REF_ASSOCIATION
    { $$ = { key: $1, value: $2 }; }
  | KEY REF_COLLECTION
    { $$ = { key: $1, value: $2 }; }
  ;
