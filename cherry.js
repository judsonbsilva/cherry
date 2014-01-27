(function(){

String.prototype.capitalize = function(){
	return this.replace(/^./, function(letter){
		return letter.toUpperCase();
	});
}
/* Captalize the first letter */
function capitalize( str ){
	return str.replace(/^./, function(letter){
		return letter.toUpperCase();
	});
};
/* Convert to Array */
function toArray(obj){
	return Array.prototype.slice.call(obj, 0);
};
/* Recursive extend */
function extend(){
	var extended = {};
	$.each( toArray( arguments ), function( i, obj ){
		$.each( obj, function( key, val ){
			extended[key] = val.constructor == Object ? 
				( extended.hasOwnProperty(key) ?
					extend( extended[key], val ):val
				) : val;
		});
	});
	return extended;
}

App = {
	options: {
		engine: 'cakephp',
		url: 'localhost/cherry'
	},
	base: function( singular, plural ){

		if( this.constructor != App.base ){
			return new App.base(singular, plural);
		}

		var self = this;
			self.plural = plural;
			self.singular = singular;
		
		self._set = function( key, value ){
			self[key] = value;
		}
		return self;
	},
	request: function(url, data, callback){
		var url = App.options.url + '/' + url;
		if( data.constructor == Function && !callback )
			$.get(url, data /*, 'json' */);
		else 
			$.post(url, data, callback /*, 'json' */);
	},
	setup: function( options ){
		this.options = $.extend(this.options, options);
	},
	templates: {
		form:"<form action='#' data-resource='{%= o.resource %}' class='cherry-form {%= o.resource %}'><fieldset><legend>{%= o.title %}</legend>{% $.each(o.fields, function(name, attr){ %}{% include(App.templates.field, attr); }); %}<div class='form-actions'><button class='btn submit-cherry-form'>{%= o.submit %}</button></div></fieldset></form>",
		field:"{% var output = []; o.class = o.class ? o.class + ' cherry-input' : 'cherry-input'; $.each(o, function( attr, value ){ if( attr == 'title'){ o.class += ' cherry-tooltip' } else if ( attr == 'class' || attr == 'label' ){ return true } output.push( attr + '=' + value ); }); %}<div class='cherry-field cherry-{%= o.type %}'>{% if( o.type == 'checkbox' ){ %}<label class='cherry-label {%= o.type%}'><input {%= output.join(' ') %} class='{%= o.class %}'>{%= o.label %}</label>{% } else { %}<label class='cherry-label'>{%= o.label %}</label><input {%= output.join(' ') %} class='{%= o.class %}'>{% } %}</div>"
	},
	dataTypes: {
		string:{
			constructor: String,
			field: 'text'
		},
		number:{
			constructor: Number,
			field:'number'
		},
		boolean:{
			constructor: Boolean,
			field:'checkbox'
		},
		date:{
			constructor: Date,
			field:'date'
		},
		email:{
			constructor: String,
			field:'email'
		},
		list:{
			constructor: Number,
			field:'radio'
		},
		option:{
			constructor: Number,
			field:'select'
		}
		text:{
			constructor: String,
			field:'textarea'
		}
	}
};


App.base.prototype = {
	constructor: App.base,
	validation: null,
	checkator: [],
	find: function( callback ){
		App.request( this.plural + '/list', { limit:5 } , function(){

		});
	},
	setup: function( validation ){
		this.validation = validation;
		return this;
	},
	_validate: function(){
		if( !this.validation ){ return true; }

		var data = this.getAll(),
			isValid = true,
			self = this;

		$.each(data, function( key, value ){
			if( value.constructor != self.validation[key] ){
				isValid = false;
			}
		});
		return isValid;
	},
	getAll: function(){
		return this.data || {};
	},
	get: function( key ){
		return this.data[key] || null;
	},
	set: function( object , value ){
		if( object.constructor == String && value ){
			key = object; object = {};
			object[key] = value;
		}
		object = extend( this.getAll() , object);
		this._set('data', object); 
		return this;
	},
	_toDataFormat: function( key, attr ){
		var str = '['+ key +']';
		if( App.options.engine == 'cakephp' )
			str = 'data[' + capitalize(this.singular) +']' + str ;
		else
			str = this.singular + str;

		if( attr ) str += '['+attr+']';

		return str;
	},
	_makeField: function( name, type ){
		var defaults = {
				'Number':{ type:'number' },
				'String':{ type:'text' },
				'Date':{ type:'date' },
				'Boolean':{ type: 'checkbox' }
			},
			field = defaults[ type.name ];
		field.label = field.name = name;
		return field;
	},
	_makeFields: function(){
		var self = this,
			fields = {};
		$.each( this.validation, function(name, type){
			fields[name] = self._makeField( name, type );
		});
		return fields;
	},
	makeForm: function( data ){
		
		var data = extend({
			title: 'Formulário',
			resource: this.singular,
			fields: this._makeFields(),
			submit: 'Submit'
		}, data );

		return tmpl( App.templates.form , data);
	},
	makeField: function( name, props ){
		var field = {};
		if( this.validation.hasOwnProperty( name ) ){
			field = this._makeField( name, this.validation[name]);
		}
		return tmpl(App.templates.field, extend( field, props || {} )); 
	},
	serialize: function(){
		var data = this.getAll(),
			self = this,
			serialized = {};

		$.each(data, function( key, value ){
			if( value.constructor == Date ){
				var day = value.getDate();
				serialized[ self._toDataFormat( key, 'day' ) ] = day < 10 ? '0' + day : day + '';
				serialized[ self._toDataFormat( key, 'year') ] = value.getFullYear() + '';
				serialized[ self._toDataFormat( key, 'month') ] = value.getMonth() + 1 + '';
			} else serialized[ self._toDataFormat( key ) ] = value;
		});

		return serialized;
	},
	beforeSend: function( fn ){
		this.checkator.push( fn );
	},
	_beforeCall: function(){
		var self = this;
		$.each( this.checkator, function( fn ){
			if( fn ) fn.call(self);
		});
	},
	create: function(callback){
		this._beforeCall();
		if( this._validate() ){
			App.request( this.plural + '/add', this.serialize(), callback);
		} else {
			callback({ error: 'Erro na validação dos dados' });
		}
	},
	edit: function(){
		this._beforeCall();
		if( this.validate() ){
			App.request( this.plural + '/add', this.serialize(), callback);
		} else {
			callback({ error: 'Erro na validação dos dados' });
		}
	},
	getDataForm:function( form ){
		var convert = this.validation,
			values = [];
			data = {};

		form.find('textarea, input, select').each(function(){
			console.log(this, this.constructor);
		});
		
		$.each( form.serializeArray(), function( i, field ){
			data[ field.name ] = convert[ field.name]( field.value );
		});

		return data;
	},
	onSubmit: function( callback ){
		var form = $('.cherry-form[data-resource="'+ this.singular +'"]'),
			self = this;

		form.on('click','.submit-cherry-form', function(ev){
			ev.preventDefault();
			callback.call(form, self.getDataForm(form) );
		});
	}
}

})();