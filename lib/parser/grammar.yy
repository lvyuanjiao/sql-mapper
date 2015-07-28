/* lexical grammar */
%lex

%x q s f e

id			[a-zA-Z_][a-zA-Z0-9_]*
path		[a-zA-Z_][a-zA-Z0-9_.]*
quotes		('"'(\\\"|[^\"])*'"')|("'"(\\\'|[^\'])*"'")

%%

"//".*													/* ignore comment */

\s*"{/"													{ this.begin("e"); return '{/' }
<e>{id}													{ return 'ENAME'; }
<e>[ ]*"}"\s*											{ this.popState(); return '}'; }

\s*"{#"													{ this.begin("q"); return '{#'; }
<q>[ ]*"}"												{ this.popState(); return '}'; }
<q>{id}													{ return 'QNAME'; }
<q>[ ]*{id}												{ yytext = yytext.replace(/\s+/g, ''); return 'QARGS'; }
<q>[ ]*"|"[ ]*{id}  									{ yytext = yytext.replace(/\s+/g, '').substr(1); return 'FILTER' }

\s*"{<"													{ this.begin("f"); return '{<'; }
<f>[ ]*["/"]?"}"										{ this.popState(); return '}'; }
<f>{path}												{ return 'FNAME'; }
<f>[ ]+{path}											{ yytext = yytext.replace(/\s+/g, ''); return 'FARGS_VAR'; }
<f>[ ]+\d+												{ yytext = parseInt(yytext.replace(/\s+/g, ''), 10); return 'FARGS_CONST'; }
<f>[ ]+{quotes}											{ yytext = yytext.trim(); yytext = yytext.substr(1, yytext.length-2).replace(/\\"/g,'"'); return 'FARGS_CONST'; }

\s*"{@"													{ this.begin("s"); return '{@'; }
<s>[ ]*"}"												{ this.popState(); return '}'; }
<s>[ ]*"/}"												{ this.popState(); return '/}'; }
<s>{id}													{ return 'SNAME'; }
<s>[ ]+{id}												{ yytext = yytext.substr(1, yyleng-1); return 'PK'; }
<s>"="													{ return 'EQ'; }
<s>{quotes}												{ yytext = yytext.substr(1, yyleng-2).replace(/\\"/g,'"'); return 'PV'; }

// escape
[\\]["{"|"}"|"#"|"$"|\\]								{ yytext = yytext.substr(1, yyleng-1); return 'TEXT'; }

"#"{path}(":"{id})?										{ yytext = yytext.replace(/\s+/g, ''); yytext = yytext.substr(1, yyleng-1); return 'REF'; }
"$"{path}(":"{id})?										{ yytext = yytext.replace(/\s+/g, ''); yytext = yytext.substr(1, yyleng-1); return 'INL'; }
[^{\\#$]+												{ yytext = yytext.replace(/\s+/g, ' '); return 'TEXT'; }

<<EOF>>													{ return 'EOF' }

/lex

/* operator associations and precedence */

%start mapper

%% /* language grammar */


mapper
	: EOF
		{ return {}; }
	| queries EOF
		{ return $1; }
	;
	
queries
	: query
		{
			var q = $1;
			var t = {};
			t[q['name']] = q;
			$$ = t;
		}
	| queries query
		{
			var qs = $1;
			var q = $2;
			qs[q['name']] = q;
			$$ = qs;
		}
	;

query
	: '{#' QNAME '}' nodes '{/' ENAME '}'
		{ $$ = yy.query($2, [], [], $4); }
	| '{#' QNAME args '}' nodes '{/' ENAME '}'
		{ $$ = yy.query($2, $3, [], $5); }
	| '{#' QNAME filters '}' nodes '{/' ENAME '}'
		{ $$ = yy.query($2, [], $3, $5); }
	| '{#' QNAME args filters '}' nodes '{/' ENAME '}'
		{ $$ = yy.query($2, $3, $4, $6); }
	;

filters
	: FILTER
		{ $$ = [$1]; }
	| filters FILTER
		{ $$ = [$1, $2]; }
	;

args
	: QARGS
		{ $$ = [$1]; }
	| args QARGS
		{ $$ = [].concat($1, $2); }
	;

nodes
	: node
		{ $$ = [$1]; }
	| nodes node
		{ $$ = yy.appendNode($1, $2); }
	;

node
	: section
		{ $$ = $1; }
	| fragment
	    { $$ = $1; }
	| INL
		{ $$ = yy.inline($1); }
	| REF
		{ $$ = yy.reference($1); }
	| TEXT
		{ $$ = yy.text($1); }
	;  

fragment
	: '{<' FNAME '}'
		{ $$ = yy.fragment($2, []); }
	| '{<' FNAME fargs '}'
		{ $$ = yy.fragment($2, $3); }
	;

fargs
	: farg
		{ $$ = [$1]; }
	| fargs farg
		{ $$ = [].concat($1, $2); }
	;

farg
	: FARGS_VAR
		{ $$ = yy.fargVar($1); }
	| FARGS_CONST
		{ $$ = yy.fargConst($1); }		
	;

section
	: self_close
		{ $$ = $1; }
	| '{@' fn '}' nodes '{/' ENAME '}'
		{ $$ = yy.section($2.value, $2.params, $4); }
	;

self_close
	: '{@'fn'/}'
	    { $$ = yy.section($2.value, $2.params, []); }
	| '{@'fn'}' '{/' ENAME '}'
		{ $$ = yy.section($2.value, $2.params, []); }
	;

fn
	: SNAME
		{ $$ = {value: $1, params: {}} }
	| SNAME params
		{ $$ = {value: $1, params: $2} }
	;

params
	: param
		{ $$ = $1; }
	| params param
		{
			var ps = $1;
			var p = $2;
			for(var k in p) {
				ps[k] = p[k];
			}
			$$ = ps;
		}
	;

param
	: PK EQ PV
		{
			var p = {};
			p[$1] = $3;
			$$ = p;
		}
	| PK
		{
			var p = {};
			p[$1] = true;
			$$ = p;
		}
	;
	

