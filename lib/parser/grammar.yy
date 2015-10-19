/* lexical grammar */
%lex

%x q s f e i

%{

function trim(){
	yytext = yytext.trim();
}
function strip(start, end) {
	return yytext = yytext.substr(start, yytext.length - (end?end:0));
}
function deleteWhitespace() {
	return yytext = yytext.replace(/\s+/g, '');
}

%}

id			[a-zA-Z_][a-zA-Z0-9_]*
path		[a-zA-Z_][a-zA-Z0-9_.]*
quotes		('"'(\\\"|[^\"])*'"')|("'"(\\\'|[^\'])*"'")
number		"-"?\d+\.?\d*

%%

"//".*													/* ignore comment */

\s*"{/"													{ this.begin("e"); return '{/' }
<e>{id}													{ return 'ENAME'; }
<e>[ ]*"}"\s*											{ this.popState(); return '}'; }

\s*"{#"													{ this.begin("q"); return '{#'; }
<q>[ ]*"}"												{ this.popState(); return '}'; }
<q>{id}													{ return 'QNAME'; }
<q>[ ]*{id}												{ trim(); return 'QARGS'; }
<q>[ ]*"|"[ ]*{id}  									{　this.begin("i"); deleteWhitespace(); strip(1); return 'INTERCEPTOR' }
<q,i>[ ]*"|"[ ]*{id}  									{ this.popState(); this.begin("i"); deleteWhitespace(); strip(1); return 'INTERCEPTOR' }
<q,i>[ ]+{path}											{ trim(); return 'IARGS_VAR'; }
<q,i>[ ]+{number}										{ trim(); yytext = Number(yytext); return 'IARGS_CONST'; }
<q,i>[ ]+{quotes}										{ trim(); strip(1,2); yytext = yytext.replace(/\\"/g,'"'); return 'IARGS_CONST'; }
<q,i>[ ]*"}"											{ this.popState(); this.popState(); return '}'; }

\s*"{<"													{ this.begin("f"); return '{<'; }
<f>[ ]*["/"]?"}"										{ this.popState(); return '}'; }
<f>{path}												{ return 'FNAME'; }
<f>[ ]+{path}											{ trim(); return 'FARGS_VAR'; }
<f>[ ]+{number}											{ trim();　yytext = Number(yytext); return 'FARGS_CONST'; }
<f>[ ]+{quotes}											{ trim(); strip(1, 2); yytext = yytext.replace(/\\"/g,'"'); return 'FARGS_CONST'; }

\s*"{@"													{ this.begin("s"); return '{@'; }
<s>[ ]*"}"												{ this.popState(); return '}'; }
<s>[ ]*"/}"												{ this.popState(); return '/}'; }
<s>{id}													{ return 'SNAME'; }
<s>[ ]+{id}												{ trim();　return 'PK'; }
<s>\s*"="\s*											{ return 'EQ'; }
<s>{quotes}												{ strip(1,2); yytext = yytext.replace(/\\"/g,'"'); return 'PV'; }

// escape
[\\]["{"|"}"|"#"|"$"|\\]								{ strip(1,1); return 'TEXT'; }

"#"{path}(":"{id})?										{ trim(); strip(1,1); return 'REF'; }
"$"{path}(":"{id})?										{ trim(); strip(1,1); return 'INL'; }
[^{\\#$]+												{ return 'TEXT'; }

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
	| '{#' QNAME interceptors '}' nodes '{/' ENAME '}'
		{ $$ = yy.query($2, [], $3, $5); }
	| '{#' QNAME args interceptors '}' nodes '{/' ENAME '}'
		{ $$ = yy.query($2, $3, $4, $6); }
	;

args
	: QARGS
		{ $$ = [$1]; }
	| args QARGS
		{ $$ = [].concat($1, $2); }
	;

interceptors
	: interceptor
		{ $$ = [$1]; }
	| interceptors interceptor
		{ $$ = [].concat($1, $2); }
	;

interceptor
	: INTERCEPTOR
		{ $$ = yy.interceptor($1, []); }
	| INTERCEPTOR iargs
		{ $$ = yy.interceptor($1, $2); }
	;

iargs
	: iarg
		{ $$ = [$1]; }
	| iargs iarg
		{ $$ = [].concat($1, $2); }
	;

iarg
	: IARGS_VAR
		{ $$ = yy.argVar($1); }
	| IARGS_CONST
		{ $$ = yy.argConst($1); }
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
		{ $$ = yy.argVar($1); }
	| FARGS_CONST
		{ $$ = yy.argConst($1); }
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
	

